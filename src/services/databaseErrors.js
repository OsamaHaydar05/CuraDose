export function toDatabaseError(error) {
  const message = error?.message || "Database request failed.";

  if (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  ) {
    return new Error(
      "Supabase tables are not set up yet. Run supabase/schema.sql in your Supabase SQL editor, then try again."
    );
  }

  return new Error(message);
}
