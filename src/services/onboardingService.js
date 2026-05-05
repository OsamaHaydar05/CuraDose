const PENDING_HEALTH_GOALS_KEY = "curadose-pending-health-goals";
const PENDING_REGISTRATION_KEY = "curadose-pending-registration";
const PENDING_CAREGIVER_INVITE_KEY = "curadose-pending-caregiver-invite";

export function savePendingRegistration(registration) {
  localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(registration));
}

export function readPendingRegistration() {
  const rawRegistration = localStorage.getItem(PENDING_REGISTRATION_KEY);

  if (!rawRegistration) {
    return null;
  }

  try {
    return JSON.parse(rawRegistration);
  } catch {
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
    return null;
  }
}

export function clearPendingRegistration() {
  localStorage.removeItem(PENDING_REGISTRATION_KEY);
}

export function savePendingHealthGoals(healthGoals) {
  localStorage.setItem(PENDING_HEALTH_GOALS_KEY, JSON.stringify(healthGoals));
}

export function readPendingHealthGoals() {
  const rawGoals = localStorage.getItem(PENDING_HEALTH_GOALS_KEY);

  if (!rawGoals) {
    return null;
  }

  try {
    return JSON.parse(rawGoals);
  } catch {
    localStorage.removeItem(PENDING_HEALTH_GOALS_KEY);
    return null;
  }
}

export function clearPendingHealthGoals() {
  localStorage.removeItem(PENDING_HEALTH_GOALS_KEY);
}

export function savePendingCaregiverInvite(invite) {
  localStorage.setItem(PENDING_CAREGIVER_INVITE_KEY, JSON.stringify(invite));
}

export function readPendingCaregiverInvite() {
  const rawInvite = localStorage.getItem(PENDING_CAREGIVER_INVITE_KEY);

  if (!rawInvite) {
    return null;
  }

  try {
    return JSON.parse(rawInvite);
  } catch {
    localStorage.removeItem(PENDING_CAREGIVER_INVITE_KEY);
    return null;
  }
}

export function clearPendingCaregiverInvite() {
  localStorage.removeItem(PENDING_CAREGIVER_INVITE_KEY);
}