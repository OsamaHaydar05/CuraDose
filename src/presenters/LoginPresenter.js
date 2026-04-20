import { CuraDoseUser } from "../models/CuraDoseModel";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function loginUser(email, password) {
  await sleep(500);

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const derivedName = email.split("@")[0] || "CuraDose User";

  return new CuraDoseUser({
    id: "mock-user-1",
    name: derivedName,
    email,
    role: "patient",
  });
}

export async function registerUser(name, email, password, role) {
  await sleep(700);

  if (!name || !email || !password || !role) {
    throw new Error("Please complete every field.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  return new CuraDoseUser({
    id: `mock-${Date.now()}`,
    name,
    email,
    role,
  });
}
