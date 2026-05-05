import { saveUserHealthGoals } from "../services/medicationService";

export async function saveHealthGoals(rating, goals, confidence) {
  return saveUserHealthGoals({
    rating,
    goals,
    confidence,
  });
}
