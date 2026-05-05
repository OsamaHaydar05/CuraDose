import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfWeek(date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
}

function formatDoseTime(value) {
  if (!value) return "No upcoming dose";

  const doseDate = new Date(value);
  const today = startOfDay(new Date()).getTime();
  const doseDay = startOfDay(doseDate).getTime();
  const time = doseDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (doseDay === today) {
    return `Today, ${time}`;
  }

  if (doseDay === today + MS_PER_DAY) {
    return `Tomorrow, ${time}`;
  }

  return `${doseDate.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function displayNameForUser(user, profile) {
  const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0];
  return fullName || "CuraDose User";
}

function medicationById(medications) {
  return medications.reduce((result, medication) => {
    result[medication.id] = medication;
    return result;
  }, {});
}

function dayKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function buildWeek(logs, weekStart) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getTime() + index * MS_PER_DAY);
    const key = dayKey(date);
    const dayLogs = logs.filter((log) => dayKey(log.scheduled_for) === key);
    const completed = dayLogs.filter((log) => log.status === "taken" || log.taken_at).length;
    const total = dayLogs.length;

    return {
      day: date.toLocaleDateString([], { weekday: "short" }),
      value: total ? Math.round((completed / total) * 100) : 0,
      total,
    };
  });
}

function calculateStreak(logs) {
  let streak = 0;
  let cursor = startOfDay(new Date());

  for (let index = 0; index < 30; index += 1) {
    const key = dayKey(cursor);
    const dayLogs = logs.filter((log) => dayKey(log.scheduled_for) === key);

    if (!dayLogs.length) {
      if (index === 0) {
        cursor = new Date(cursor.getTime() - MS_PER_DAY);
        continue;
      }
      break;
    }

    const completed = dayLogs.every((log) => log.status === "taken" || log.taken_at);

    if (!completed) {
      break;
    }

    streak += 1;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }

  return streak;
}

function healthTipForGoals(healthGoals) {
  if (healthGoals?.goals?.includes("habit")) {
    return {
      title: "Health Tip",
      headline: "Pair medication with a daily habit",
      body: "Taking it after brushing your teeth can make it easier to remember.",
    };
  }

  if (healthGoals?.goals?.includes("safe")) {
    return {
      title: "Health Tip",
      headline: "Check labels before each dose",
      body: "A quick label check helps avoid mixed medication or dosage mistakes.",
    };
  }

  return {
    title: "Health Tip",
    headline: "Drink water with your medication",
    body: "It helps your body absorb it better.",
  };
}

function buildDashboardData({ user, profile, healthGoals, medications, doseLogs, caregiverInvites, deviceSlots }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const medicationsById = medicationById(medications);
  const todayLogs = doseLogs.filter((log) => {
    const scheduled = new Date(log.scheduled_for);
    return scheduled >= todayStart && scheduled <= todayEnd;
  });
  const completedToday = todayLogs.filter((log) => log.status === "taken" || log.taken_at).length;
  const upcomingLog = todayLogs
    .filter((log) => !(log.status === "taken" || log.taken_at))
    .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))[0];
  const upcomingMedication =
    medications
      .filter((medication) => medication.next_dose_at && new Date(medication.next_dose_at) >= now)
      .sort((a, b) => new Date(a.next_dose_at) - new Date(b.next_dose_at))[0] || medications[0];
  const nextMedication = upcomingLog ? medicationsById[upcomingLog.medication_id] : upcomingMedication;
  const weeklyProgress = buildWeek(doseLogs, weekStart);
  const scheduledDays = weeklyProgress.filter((item) => item.total > 0);
  const weeklyScore = scheduledDays.length
    ? Math.round(scheduledDays.reduce((sum, item) => sum + item.value, 0) / scheduledDays.length)
    : 0;
  const totalPills = medications.reduce((sum, medication) => sum + (medication.remaining_pills || 0), 0);
  const lowInventory = medications
    .filter((medication) => typeof medication.remaining_pills === "number")
    .sort((a, b) => a.remaining_pills - b.remaining_pills)[0];
  const acceptedInvite = caregiverInvites.find((invite) => invite.status === "accepted");
  const latestInvite = caregiverInvites[0];
  const caregiverStatus = acceptedInvite
    ? { value: "Connected", detail: acceptedInvite.caregiver_email }
    : latestInvite
      ? { value: "Pending", detail: latestInvite.caregiver_email }
      : { value: "Not added", detail: "Invite a caregiver" };
  const name = displayNameForUser(user, profile);

  return {
    user: {
      name,
      firstName: name.split(" ")[0],
      email: profile?.email || user.email,
      avatarInitial: name.trim().charAt(0).toUpperCase() || "C",
    },
    streakDays: calculateStreak(doseLogs),
    nextDose: nextMedication
      ? {
          doseLogId: upcomingLog?.id || null,
          medicationId: nextMedication.id,
          medicationName: nextMedication.name,
          doseText: [nextMedication.dosage, nextMedication.instructions].filter(Boolean).join(" - "),
          timeText: formatDoseTime(upcomingLog?.scheduled_for || nextMedication.next_dose_at),
          remainingPills: nextMedication.remaining_pills,
        }
      : {
          doseLogId: null,
          medicationId: null,
          medicationName: "No medication scheduled",
          doseText: "Add medication to sync doses",
          timeText: "No upcoming dose",
          remainingPills: null,
        },
    overviewCards: [
      {
        id: "doses",
        icon: "capsule",
        title: "Doses Today",
        value: `${completedToday} / ${todayLogs.length}`,
        detail: "Completed",
        progress: todayLogs.length ? Math.round((completedToday / todayLogs.length) * 100) : 0,
      },
      {
        id: "inventory",
        icon: "bottle",
        title: "Remaining Pills",
        value: `${totalPills} Pills`,
        detail: lowInventory ? `Lowest: ${lowInventory.name}` : "Add inventory",
      },
      {
        id: "caregiver",
        icon: "heart",
        title: "Caregiver Status",
        value: caregiverStatus.value,
        detail: caregiverStatus.detail,
      },
    ],
    weeklyProgress,
    weeklyScore,
    deviceStatus: {
      title: "Smart Dispenser",
      subtitle: deviceSlots?.length
        ? "Live slot data from the dispenser"
        : "Software ready for the two-box hardware",
      slots: buildDeviceSlots(deviceSlots, medications),
    },
    healthTip: healthTipForGoals(healthGoals),
  };
}

function fallbackDeviceSlots(medications) {
  const slots = [1, 2];

  return slots.map((slotNumber, index) => {
    const medication = medications[index];

    return {
      id: `future-slot-${slotNumber}`,
      slotNumber,
      label: `Box ${slotNumber}`,
      medicationName: medication?.name || "Unassigned",
      pillCount: medication?.remaining_pills ?? 0,
      dispenserStatusText: "Not connected",
      status: medication ? "setup_needed" : "unassigned",
      statusLabel: medication ? "Hardware setup needed" : "Assign medication",
      syncText: "No device sync yet",
      source: "planned",
    };
  });
}

function formatRelativeTime(value) {
  if (!value) return "No readings yet";

  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / (60 * 1000)));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function statusLabel(status) {
  if (status === "ready") return "Ready";
  if (status === "low") return "Low pills";
  if (status === "empty") return "Empty";
  if (status === "setup_needed") return "Setup needed";
  return "Unknown";
}

function dispenserStatusText(status, pillCount) {
  if (status === "empty") return "Needs refill";
  if (status === "low") return "Low supply";
  if (status === "ready" && pillCount > 0) return "Ready";
  if (status === "setup_needed") return "Not connected";
  return "Not configured";
}

function buildDeviceSlots(deviceSlots, medications) {
  if (!deviceSlots?.length) {
    return fallbackDeviceSlots(medications);
  }

  return [1, 2].map((slotNumber) => {
    const slot = deviceSlots.find((item) => item.slot_number === slotNumber);

    if (!slot) {
      return {
        id: `missing-slot-${slotNumber}`,
        slotNumber,
        label: `Box ${slotNumber}`,
        medicationName: "Unassigned",
        pillCount: 0,
        dispenserStatusText: "Not configured",
        status: "unassigned",
        statusLabel: "Assign medication",
        syncText: "No slot configured",
        source: "planned",
      };
    }

    return {
      id: slot.id,
      slotNumber,
      label: slot.label || `Box ${slotNumber}`,
      medicationName: slot.medications?.name || "Unassigned",
      pillCount: slot.current_pill_count ?? 0,
      status: slot.status || "setup_needed",
      statusLabel: statusLabel(slot.status),
      dispenserStatusText: dispenserStatusText(slot.status, slot.current_pill_count ?? 0),
      syncText: formatRelativeTime(slot.last_event_at),
      source: "device",
    };
  });
}

export async function getDashboardData() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toDatabaseError(sessionError);
  }

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in to view your dashboard.");
  }

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * MS_PER_DAY));

  const [
    profileResult,
    healthGoalsResult,
    medicationsResult,
    doseLogsResult,
    caregiverInvitesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name,email,role").eq("id", user.id).maybeSingle(),
    supabase.from("health_goals").select("routine_rating,goals,confidence").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("medications")
      .select("id,name,dosage,instructions,remaining_pills,refill_threshold,next_dose_at")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("next_dose_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("dose_logs")
      .select("id,medication_id,scheduled_for,taken_at,status")
      .eq("user_id", user.id)
      .gte("scheduled_for", weekStart.toISOString())
      .lte("scheduled_for", weekEnd.toISOString())
      .order("scheduled_for", { ascending: true }),
    supabase
      .from("caregiver_invites")
      .select("caregiver_email,status,created_at")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const deviceSlotsResult = await supabase
    .from("device_slots")
    .select("id,slot_number,label,current_weight_grams,current_pill_count,status,last_event_at,medications(name)")
    .eq("user_id", user.id)
    .order("slot_number", { ascending: true });

  const firstError = [
    profileResult.error,
    healthGoalsResult.error,
    medicationsResult.error,
    doseLogsResult.error,
    caregiverInvitesResult.error,
  ].find(Boolean);

  if (firstError) {
    throw toDatabaseError(firstError);
  }

  return buildDashboardData({
    user,
    profile: profileResult.data,
    healthGoals: healthGoalsResult.data,
    medications: medicationsResult.data || [],
    doseLogs: doseLogsResult.data || [],
    caregiverInvites: caregiverInvitesResult.data || [],
    deviceSlots: deviceSlotsResult.error ? [] : deviceSlotsResult.data || [],
  });
}

export async function markDoseTaken({ doseLogId, medicationId }) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toDatabaseError(sessionError);
  }

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in before taking a dose.");
  }

  if (!medicationId) {
    throw new Error("No medication is scheduled.");
  }

  if (doseLogId) {
    const { error } = await supabase
      .from("dose_logs")
      .update({
        status: "taken",
        taken_at: new Date().toISOString(),
      })
      .eq("id", doseLogId)
      .eq("user_id", user.id);

    if (error) {
      throw toDatabaseError(error);
    }
  } else {
    const { error } = await supabase.from("dose_logs").insert({
      user_id: user.id,
      medication_id: medicationId,
      scheduled_for: new Date().toISOString(),
      status: "taken",
      taken_at: new Date().toISOString(),
    });

    if (error) {
      throw toDatabaseError(error);
    }
  }

  const { data: medication, error: medicationError } = await supabase
    .from("medications")
    .select("remaining_pills")
    .eq("id", medicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (medicationError) {
    throw toDatabaseError(medicationError);
  }

  if (medication && typeof medication.remaining_pills === "number") {
    const { error } = await supabase
      .from("medications")
      .update({
        remaining_pills: Math.max(0, medication.remaining_pills - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", medicationId)
      .eq("user_id", user.id);

    if (error) {
      throw toDatabaseError(error);
    }
  }
}
