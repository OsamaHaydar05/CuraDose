import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DevicePayload = {
  device_id?: string;
  slot_number?: number;
  weight_grams?: number;
  pill_count?: number;
  event_type?: "stable" | "dose_taken" | "refill" | "calibration";
  measured_at?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function requiredNumber(value: unknown, name: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${name} must be a number.`);
  }

  return value;
}

function determineEventType(payload: DevicePayload, previousCount: number) {
  if (payload.event_type) return payload.event_type;
  if (typeof payload.pill_count !== "number") return "stable";
  if (payload.pill_count < previousCount) return "dose_taken";
  if (payload.pill_count > previousCount) return "refill";
  return "stable";
}

function slotStatus(pillCount: number) {
  if (pillCount <= 0) return "empty";
  if (pillCount <= 3) return "low";
  return "ready";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const expectedSecret = Deno.env.get("DEVICE_INGEST_SECRET");
  const receivedSecret = request.headers.get("x-device-secret");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return jsonResponse({ error: "Invalid device secret." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase function configuration." }, 500);
  }

  try {
    const payload = (await request.json()) as DevicePayload;
    const deviceId = payload.device_id;
    const slotNumber = requiredNumber(payload.slot_number, "slot_number");
    const weightGrams = requiredNumber(payload.weight_grams, "weight_grams");
    const pillCount = Math.max(0, Math.round(requiredNumber(payload.pill_count, "pill_count")));
    const timestamp = payload.measured_at || new Date().toISOString();

    if (!deviceId) {
      throw new Error("device_id is required.");
    }

    if (![1, 2].includes(slotNumber)) {
      throw new Error("slot_number must be 1 or 2.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: slot, error: slotError } = await supabase
      .from("device_slots")
      .select("id,user_id,medication_id,current_weight_grams,current_pill_count")
      .eq("device_id", deviceId)
      .eq("slot_number", slotNumber)
      .maybeSingle();

    if (slotError) throw slotError;
    if (!slot) {
      return jsonResponse({ error: "Device slot is not registered." }, 404);
    }

    const eventType = determineEventType(payload, slot.current_pill_count ?? pillCount);
    const previousPillCount = slot.current_pill_count ?? pillCount;
    const previousWeightGrams = slot.current_weight_grams ?? weightGrams;
    const pillsDifference = Math.max(0, previousPillCount - pillCount);
    const weightDifferenceGrams = Math.max(0, previousWeightGrams - weightGrams);

    const { error: readingError } = await supabase.from("device_readings").insert({
      device_id: deviceId,
      slot_id: slot.id,
      user_id: slot.user_id,
      slot_number: slotNumber,
      weight_grams: weightGrams,
      pill_count: pillCount,
      event_type: eventType,
      raw_payload: payload,
      created_at: timestamp,
    });

    if (readingError) throw readingError;

    const { error: deviceError } = await supabase
      .from("devices")
      .update({
        status: "online",
        last_seen_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", deviceId);

    if (deviceError) throw deviceError;

    const { error: slotUpdateError } = await supabase
      .from("device_slots")
      .update({
        current_weight_grams: weightGrams,
        current_pill_count: pillCount,
        last_pill_count: slot.current_pill_count ?? pillCount,
        status: slotStatus(pillCount),
        last_event_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", slot.id);

    if (slotUpdateError) throw slotUpdateError;

    if (slot.medication_id) {
      const { error: medicationError } = await supabase
        .from("medications")
        .update({
          remaining_pills: pillCount,
          updated_at: timestamp,
        })
        .eq("id", slot.medication_id)
        .eq("user_id", slot.user_id);

      if (medicationError) throw medicationError;
    }

    if (eventType === "dose_taken" && slot.medication_id) {
      const now = new Date(timestamp);
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: doseLog, error: doseLogError } = await supabase
        .from("dose_logs")
        .select("id")
        .eq("user_id", slot.user_id)
        .eq("medication_id", slot.medication_id)
        .eq("status", "scheduled")
        .gte("scheduled_for", dayStart.toISOString())
        .lte("scheduled_for", dayEnd.toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (doseLogError) throw doseLogError;

      if (doseLog) {
        const { error: updateDoseError } = await supabase
          .from("dose_logs")
          .update({
            status: "taken",
            taken_at: timestamp,
            weight_before_grams: previousWeightGrams,
            weight_after_grams: weightGrams,
            weight_difference_grams: weightDifferenceGrams,
            pills_before: previousPillCount,
            pills_after: pillCount,
            pills_difference: pillsDifference,
            updated_at: timestamp,
          })
          .eq("id", doseLog.id);

        if (updateDoseError) throw updateDoseError;
      } else {
        const { error: insertDoseError } = await supabase.from("dose_logs").insert({
          user_id: slot.user_id,
          medication_id: slot.medication_id,
          scheduled_for: timestamp,
          status: "taken",
          taken_at: timestamp,
          weight_before_grams: previousWeightGrams,
          weight_after_grams: weightGrams,
          weight_difference_grams: weightDifferenceGrams,
          pills_before: previousPillCount,
          pills_after: pillCount,
          pills_difference: pillsDifference,
        });

        if (insertDoseError) throw insertDoseError;
      }
    }

    return jsonResponse({
      ok: true,
      event_type: eventType,
      pill_count: pillCount,
      slot_status: slotStatus(pillCount),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unable to process device reading.",
      },
      400,
    );
  }
});
