import { createCaregiverInvite } from "../services/caregiverService";

export async function inviteCaregiver(email) {
  const normalizedEmail = email?.trim();

  if (!normalizedEmail) {
    return { invited: false, email: "" };
  }

  await createCaregiverInvite(normalizedEmail);

  return { invited: true, email: normalizedEmail };
}
