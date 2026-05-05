import { getCurrentUser } from "./authService";
import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

export async function createCaregiverInvite(email) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to invite a caregiver.");
  }

  if (!email) {
    return null;
  }

  const { data, error } = await supabase
    .from("caregiver_invites")
    .insert({
      patient_id: user.id,
      caregiver_email: email,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}
