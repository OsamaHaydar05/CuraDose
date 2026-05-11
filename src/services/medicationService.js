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

export async function getMedicationSchedule(patientId = null) {
  const user = await requireSessionUser();
  const targetUserId = patientId || user.id;
  const isViewingPatient = targetUserId !== user.id;

  const viewerProfileResult = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (viewerProfileResult.error) {
    throw toDatabaseError(viewerProfileResult.error);
  }

  const viewerProfile = viewerProfileResult.data;
  const viewerRole = viewerProfile?.role || user.user_metadata?.role || "patient";

  if (isViewingPatient) {
    if (viewerRole !== "caregiver" && viewerRole !== "family") {
      throw new Error("Only caregivers can manage a patient's medication schedule.");
    }

    const { data: connection, error: connectionError } = await supabase
      .from("caregiver_invites")
      .select("id")
      .eq("patient_id", targetUserId)
      .ilike("caregiver_email", user.email || "")
      .eq("status", "accepted")
      .maybeSingle();

    if (connectionError) {
      throw toDatabaseError(connectionError);
    }

    if (!connection) {
      throw new Error("This patient has not accepted your caregiver access.");
    }
  }

  const [profileResult, patientProfileResult, medicationsResult, caregiverInvitesResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,role").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("id,full_name,email,role").eq("id", targetUserId).maybeSingle(),
    supabase
      .from("medications")
      .select(MEDICATION_COLUMNS)
      .eq("user_id", targetUserId)
      .eq("active", true)
      .order("schedule_time", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
    supabase
      .from("caregiver_invites")
      .select("caregiver_email,status,created_at")
      .eq("patient_id", targetUserId)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = [
    profileResult.error,
    patientProfileResult.error,
    medicationsResult.error,
    caregiverInvitesResult.error,
  ].find(Boolean);

  if (firstError) {
    throw toDatabaseError(firstError);
  }

  const viewer = profileResult.data;
  const profile = patientProfileResult.data;
  const role = viewer?.role || user.user_metadata?.role || "patient";
  const acceptedInvite = (caregiverInvitesResult.data || []).find((invite) => invite.status === "accepted");

  return {
    user: {
      id: user.id,
      scheduleUserId: targetUserId,
      email: profile?.email || user.email,
      role,
      viewerFullName: viewer?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "CuraDose User",
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "CuraDose User",
      isViewingPatient,
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
  const targetUserId = input.userId || user.id;

  const payload = {
    ...buildMedicationPayload(input),
    user_id: targetUserId,
    active: true,
  };

  if (!payload.name) {
    throw new Error("Medication name is required.");
  }

  const { count, error: countError } = await supabase
    .from("medications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", targetUserId)
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
  const targetUserId = input.userId || user.id;

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
    .eq("user_id", targetUserId)
    .select(MEDICATION_COLUMNS)
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function deleteMedication(medicationId, targetUserId = null) {
  const user = await requireSessionUser();
  const scheduleUserId = targetUserId || user.id;

  if (!medicationId) {
    throw new Error("Missing medication identifier.");
  }

  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", medicationId)
    .eq("user_id", scheduleUserId);

  if (error) {
    throw toDatabaseError(error);
  }
}
