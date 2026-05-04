import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

const MEDICATION_COLUMNS =
  "id,name,dosage,instructions,frequency,schedule_time,remaining_pills,refill_threshold,next_dose_at,active";

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

function buildMedicationPayload({ name, dosage, frequency, scheduleTime, instructions, remainingPills }) {
  return {
    name: name?.trim(),
    dosage: dosage?.trim() || null,
    frequency: frequency?.trim() || null,
    schedule_time: scheduleTime || null,
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
