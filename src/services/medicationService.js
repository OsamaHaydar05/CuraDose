import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

const MEDICATION_COLUMNS =
  "id,name,dosage,instructions,frequency,schedule_time,schedule_times,remaining_pills,refill_threshold,next_dose_at,active";
const MAX_ACTIVE_MEDICATIONS = 2;

function scheduleTimeToDate(scheduleTime, baseDate = new Date()) {
  if (!scheduleTime) return null;

  const [hours, minutes] = scheduleTime.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const nextDose = new Date(baseDate);
  nextDose.setHours(hours, minutes, 0, 0);
  return nextDose;
}

function nextDoseAtForSchedule(scheduleTimes) {
  const times = Array.isArray(scheduleTimes) ? scheduleTimes.filter(Boolean) : [];

  if (!times.length) return null;

  const now = new Date();
  const upcomingToday = times
    .map((time) => scheduleTimeToDate(time, now))
    .filter((date) => date && date >= now)
    .sort((a, b) => a - b)[0];

  if (upcomingToday) return upcomingToday.toISOString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const firstTomorrow = times
    .map((time) => scheduleTimeToDate(time, tomorrow))
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  if (!firstTomorrow) return null;

  return firstTomorrow.toISOString();
}

function formatPillDosage(value) {
  const dosage = value?.trim();

  if (!dosage) return null;

  if (!/^\d+(\.\d+)?$/.test(dosage)) {
    return dosage;
  }

  return Number(dosage) === 1 ? "1 pill" : `${dosage} pills`;
}

async function requireSessionUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toDatabaseError(sessionError);
  }

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in to manage your medication schedule.");
  }

  return user;
}

export async function saveUserHealthGoals({ rating, goals, confidence }) {
  const user = await requireSessionUser();

  const { data, error } = await supabase
    .from("health_goals")
    .upsert(
      {
        user_id: user.id,
        routine_rating: rating,
        goals,
        confidence,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function getMedicationSchedule() {
  const user = await requireSessionUser();

  const [profileResult, medicationsResult, caregiverInvitesResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,role").eq("id", user.id).maybeSingle(),
    supabase
      .from("medications")
      .select(MEDICATION_COLUMNS)
      .eq("user_id", user.id)
      .eq("active", true)
      .order("schedule_time", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
    supabase
      .from("caregiver_invites")
      .select("caregiver_email,status,created_at")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = [
    profileResult.error,
    medicationsResult.error,
    caregiverInvitesResult.error,
  ].find(Boolean);

  if (firstError) {
    throw toDatabaseError(firstError);
  }

  const profile = profileResult.data;
  const role = profile?.role || user.user_metadata?.role || "patient";
  const acceptedInvite = (caregiverInvitesResult.data || []).find((invite) => invite.status === "accepted");

  return {
    user: {
      id: user.id,
      email: user.email,
      role,
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "CuraDose User",
      hasCaregiver: Boolean(acceptedInvite),
      caregiverEmail: acceptedInvite?.caregiver_email || null,
    },
    medications: medicationsResult.data || [],
  };
}

function buildMedicationPayload({ name, dosage, frequency, scheduleTime, scheduleTimes, instructions, remainingPills }) {
  const times = Array.isArray(scheduleTimes)
    ? scheduleTimes.filter(Boolean)
    : [scheduleTime].filter(Boolean);

  return {
    name: name?.trim(),
    dosage: formatPillDosage(dosage),
    frequency: frequency?.trim() || null,
    schedule_time: times[0] || null,
    schedule_times: times,
    next_dose_at: nextDoseAtForSchedule(times),
    instructions: instructions?.trim() || null,
    ...(typeof remainingPills === "number" ? { remaining_pills: remainingPills } : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function createMedication(input) {
  const user = await requireSessionUser();

  const payload = {
    ...buildMedicationPayload(input),
    user_id: user.id,
    active: true,
  };

  if (!payload.name) {
    throw new Error("Medication name is required.");
  }

  const { count, error: countError } = await supabase
    .from("medications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("active", true);

  if (countError) {
    throw toDatabaseError(countError);
  }

  if ((count || 0) >= MAX_ACTIVE_MEDICATIONS) {
    throw new Error("CuraDose has two compartments. Remove a medication before adding another.");
  }

  const { data, error } = await supabase
    .from("medications")
    .insert(payload)
    .select(MEDICATION_COLUMNS)
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function updateMedication(medicationId, input) {
  const user = await requireSessionUser();

  if (!medicationId) {
    throw new Error("Missing medication identifier.");
  }

  const payload = buildMedicationPayload(input);

  if (!payload.name) {
    throw new Error("Medication name is required.");
  }

  const { data, error } = await supabase
    .from("medications")
    .update(payload)
    .eq("id", medicationId)
    .eq("user_id", user.id)
    .select(MEDICATION_COLUMNS)
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function deleteMedication(medicationId) {
  const user = await requireSessionUser();

  if (!medicationId) {
    throw new Error("Missing medication identifier.");
  }

  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", medicationId)
    .eq("user_id", user.id);

  if (error) {
    throw toDatabaseError(error);
  }
}
