import { getCurrentUser } from "./authService";
import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function createCaregiverInvite(email) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to invite a caregiver.");
  }

  if (!email) {
    return null;
  }

  const caregiverEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from("caregiver_invites")
    .insert({
      patient_id: user.id,
      caregiver_email: caregiverEmail,
      requested_by: "patient",
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function requestPatientConnection(patientEmail) {
  const email = normalizeEmail(patientEmail || "");

  if (!email) {
    throw new Error("Enter the patient's email address.");
  }

  const { data, error } = await supabase.rpc("request_patient_connection", {
    patient_email: email,
  });

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function updateCaregiverInviteStatus(inviteId, status) {
  if (!inviteId) {
    throw new Error("No invite selected.");
  }

  if (!["accepted", "declined"].includes(status)) {
    throw new Error("Choose whether to accept or decline the connection.");
  }

  const { data, error } = await supabase
    .from("caregiver_invites")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId)
    .select()
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export function acceptCaregiverInvite(inviteId) {
  return updateCaregiverInviteStatus(inviteId, "accepted");
}

export function declineCaregiverInvite(inviteId) {
  return updateCaregiverInviteStatus(inviteId, "declined");
}

export async function disconnectPatientConnection(connectionId) {
  if (!connectionId) {
    throw new Error("No connected patient selected.");
  }

  const { data, error } = await supabase.rpc("disconnect_patient_connection", {
    connection_id: connectionId,
  });

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}

export async function getCaregiverConnections() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to manage caregiver access.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw toDatabaseError(profileError);
  }

  const role = profile?.role || user.user_metadata?.role || "patient";
  const query =
    role === "caregiver" || role === "family"
      ? supabase
          .from("caregiver_invites")
          .select("id,patient_id,caregiver_email,status,requested_by,created_at,updated_at")
          .ilike("caregiver_email", user.email || "")
      : supabase
          .from("caregiver_invites")
          .select("id,patient_id,caregiver_email,status,requested_by,created_at,updated_at")
          .eq("patient_id", user.id);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw toDatabaseError(error);
  }

  return {
    role,
    invites: data || [],
  };
}
