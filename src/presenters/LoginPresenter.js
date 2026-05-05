import { signInWithEmail, signUpWithEmail } from "../services/authService";

export function validateRegistration(name, email, password, role) {
  if (!name || name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Invalid email address.");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (!role) {
    throw new Error("Role is required.");
  }
}

export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error("Email and password required.");
  }

  return await signInWithEmail(email.trim(), password);
}

export async function signupUser(formData) {
  validateRegistration(
      formData.name,
      formData.email,
      formData.password,
      formData.role
  );

  return await signUpWithEmail({
    name: formData.name?.trim(),
    email: formData.email?.trim(),
    password: formData.password,
    role: formData.role,
    caregiverType: formData.caregiverType,
    region: formData.region,
    hospital: formData.hospital,
    title: formData.title,
  });
}

export async function registerUser(name, email, password, role = "patient") {
  validateRegistration(name, email, password, role);

  return await signUpWithEmail({
    name: name.trim(),
    email: email.trim(),
    password,
    role,
  });
}