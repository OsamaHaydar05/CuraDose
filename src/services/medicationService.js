import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

export async function saveUserHealthGoals({ rating, goals, confidence }) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in before saving your health goals.");
  }

  const { data, error } = await supabase
    .from("health_goals")
    .upsert(
      {
        user_id: user.id,
        routine_rating: rating,
        goals,
        confidence,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    throw toDatabaseError(error);
  }

  return data;
}
