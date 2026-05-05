import { supabase } from "./supabaseConfig";
import {
  clearPendingCaregiverInvite,
  clearPendingHealthGoals,
  clearPendingRegistration,
  readPendingCaregiverInvite,
  readPendingHealthGoals,
  readPendingRegistration,
} from "./onboardingService";
import { toDatabaseError } from "./databaseErrors";
import { saveUserHealthGoals } from "./medicationService";

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw toDatabaseError(error);
  }

  if (data.session) {
    try {
      await syncPendingOnboarding();
    } catch {
      // A confirmed session is still valid if optional onboarding data needs a retry.
    }
  }

  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  try {
    await syncPendingOnboarding();
  } catch {
    // Keep the user logged in even if the optional onboarding sync needs a retry.
  }

  return data.user;
}

export async function signUpWithEmail({
                                        name,
                                        email,
                                        password,
                                        role,
                                        caregiverType,
                                        region,
                                        hospital,
                                        title,
                                      }) {
  const emailRedirectTo =
      typeof window === "undefined" ? undefined : `${window.location.origin}/dashboard`;

  const metadata = {
    full_name: name,
    role,
  };

  if (role === "caregiver") {
    metadata.caregiver_type = caregiverType || "private";

    if (caregiverType === "professional") {
      metadata.region = region || "";
      metadata.hospital = hospital || "";
      metadata.title = title || "";
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: metadata,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;

  if (!user) {
    throw new Error("Supabase did not return a user for this registration.");
  }

  if (data.session) {
    await syncPendingOnboarding(user);
  }

  return {
    ...user,
    emailVerificationRequired: !data.session,
  };
}

export async function upsertUserProfile({
                                          id,
                                          name,
                                          email,
                                          role,
                                          caregiverType,
                                          region,
                                          hospital,
                                          title,
                                        }) {
  const profilePayload = {
    id,
    full_name: name,
    email,
    role,
    updated_at: new Date().toISOString(),
  };

  if (role === "caregiver") {
    profilePayload.caregiver_type = caregiverType || "private";
    profilePayload.region = region || null;
    profilePayload.hospital = hospital || null;
    profilePayload.title = title || null;
  }

  const { data, error } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select()
      .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncPendingOnboarding() {
  const session = await supabase.auth.getSession();
  const user = session.data.session?.user;

  if (!user) {
    return;
  }

  const pendingRegistration = readPendingRegistration();

  const role =
      pendingRegistration?.role ||
      user.user_metadata?.role ||
      "patient";

  const caregiverType =
      pendingRegistration?.caregiverType ||
      user.user_metadata?.caregiver_type ||
      "private";

  await upsertUserProfile({
    id: user.id,
    name:
        pendingRegistration?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "CuraDose User",
    email: user.email || pendingRegistration?.email,
    role,
    caregiverType,
    region:
        pendingRegistration?.region ||
        user.user_metadata?.region ||
        null,
    hospital:
        pendingRegistration?.hospital ||
        user.user_metadata?.hospital ||
        null,
    title:
        pendingRegistration?.title ||
        user.user_metadata?.title ||
        null,
  });

  if (pendingRegistration) {
    clearPendingRegistration();
  }

  const pendingHealthGoals = readPendingHealthGoals();

  if (pendingHealthGoals && role !== "caregiver") {
    await saveUserHealthGoals(pendingHealthGoals);
    clearPendingHealthGoals();
  }

  const pendingCaregiverInvite = readPendingCaregiverInvite();

  if (pendingCaregiverInvite?.email && role !== "caregiver") {
    const { error } = await supabase
        .from("caregiver_invites")
        .insert({
          patient_id: user.id,
          caregiver_email: pendingCaregiverInvite.email,
          status: "pending",
        });

    if (error) {
      throw toDatabaseError(error);
    }
  }

  if (pendingCaregiverInvite) {
    clearPendingCaregiverInvite();
  }
}