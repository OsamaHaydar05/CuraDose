const PENDING_HEALTH_GOALS_KEY = "curadose-pending-health-goals";

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
