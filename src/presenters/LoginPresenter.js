import { CuraDoseUser } from "../models/CuraDoseModel";
import { getUserRole, signInWithEmail, signUpWithEmail } from "../services/authService";

export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const user = await signInWithEmail(email, password);
  const derivedName = user.user_metadata?.full_name || email.split("@")[0] || "CuraDose User";
  const role = await getUserRole(user);

  return new CuraDoseUser({
    id: user.id,
    name: derivedName,
    email: user.email,
    role,
  });
}

export async function registerUser(name, email, password, role, options = {}) {
  validateRegistration(name, email, password, role);

  const user = await signUpWithEmail({ name, email, password, role, ...options });

  return new CuraDoseUser({
    id: user.id,
    name,
    email: user.email,
    role,
    emailVerificationRequired: user.emailVerificationRequired,
  });
}

export function validateRegistration(name, email, password, role) {
  if (!name || !email || !password || !role) {
    throw new Error("Please complete every field.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
}
