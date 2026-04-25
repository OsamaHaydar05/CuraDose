import { supabase } from "./supabaseConfig";
import {
  clearPendingHealthGoals,
  readPendingHealthGoals,
} from "./onboardingService";
import { toDatabaseError } from "./databaseErrors";
import { saveUserHealthGoals } from "./medicationService";

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw toDatabaseError(error);
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

export async function signUpWithEmail({ name, email, password, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;

  if (!user) {
    throw new Error("Supabase did not return a user for this registration.");
  }

  if (!data.session) {
    throw new Error(
      "Account created. Please confirm your email, then log in to finish setup."
    );
  }

  await upsertUserProfile({
    id: user.id,
    name,
    email,
    role,
  });

  return user;
}

export async function upsertUserProfile({ id, name, email, role }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id,
        full_name: name,
        email,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
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
  const pendingHealthGoals = readPendingHealthGoals();

  if (!pendingHealthGoals) {
    return;
  }

  await saveUserHealthGoals(pendingHealthGoals);
  clearPendingHealthGoals();
}
