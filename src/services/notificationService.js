import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TIMER_DELAY = 2_147_483_647;
const REMINDER_HORIZON_DAYS = 7;
const REMINDER_GRACE_MS = MS_PER_DAY;
const ENABLED_KEY = "curadose-dose-notifications-enabled";
const DELIVERED_KEY_PREFIX = "curadose-dose-notifications-delivered";

const scheduledTimers = new Map();

function canUseBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

function notificationPermission() {
  if (!canUseBrowserNotifications()) return "unsupported";
  return Notification.permission;
}

function deliveredStorageKey(userId) {
  return `${DELIVERED_KEY_PREFIX}:${userId}`;
}

function readDeliveredNotificationIds(userId) {
  try {
    return JSON.parse(localStorage.getItem(deliveredStorageKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function rememberDeliveredNotification(userId, reminderId) {
  try {
    const ids = readDeliveredNotificationIds(userId).filter((id) => id !== reminderId);
    ids.push(reminderId);
    localStorage.setItem(deliveredStorageKey(userId), JSON.stringify(ids.slice(-80)));
  } catch {
    /* ignore */
  }
}

function readEnabledPreference() {
  try {
    const saved = localStorage.getItem(ENABLED_KEY);
    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch {
    /* ignore */
  }

  return notificationPermission() === "granted";
}

function saveEnabledPreference(value) {
  try {
    localStorage.setItem(ENABLED_KEY, value ? "true" : "false");
  } catch {
    /* ignore */
  }
}

function formatDoseTime(value) {
  const date = new Date(value);
  return date.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDosage(value) {
  const dosage = value?.trim();

  if (!dosage) return "";

  return /^\d+(\.\d+)?$/.test(dosage) ? `${dosage} mg` : dosage;
}

function formatReminderBody(reminder) {
  const details = [formatDosage(reminder.dosage), reminder.instructions].filter(Boolean).join(" - ");
  return details || "Open CuraDose to mark this dose as taken.";
}

function reminderFromDoseLog(log) {
  const medication = log.medications || {};

  return {
    id: `dose-log-${log.id}`,
    medicationId: log.medication_id,
    medicationName: medication.name || "your medication",
    dosage: medication.dosage || "",
    instructions: medication.instructions || "",
    scheduledFor: log.scheduled_for,
    source: "dose_log",
  };
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function nextDailyDoseAfter(value, after = new Date()) {
  const base = value ? new Date(value) : new Date(after);

  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const nextDose = new Date(base);

  do {
    nextDose.setDate(nextDose.getDate() + 1);
  } while (nextDose <= after);

  return nextDose.toISOString();
}

function scheduledAtForMedication(medication, { now = new Date(), takenToday = false } = {}) {
  const scheduledAt = medication?.next_dose_at || nextDoseAtForScheduleTime(medication?.schedule_time);

  if (!scheduledAt || !takenToday) {
    return scheduledAt;
  }

  if (startOfDay(scheduledAt).getTime() === startOfDay(now).getTime()) {
    return nextDailyDoseAfter(scheduledAt, now);
  }

  return scheduledAt;
}

function reminderFromMedication(medication, options) {
  const scheduledFor = scheduledAtForMedication(medication, options);

  return {
    id: `medication-${medication.id}-${new Date(scheduledFor).getTime()}`,
    medicationId: medication.id,
    medicationName: medication.name || "your medication",
    dosage: medication.dosage || "",
    instructions: medication.instructions || "",
    scheduledFor,
    source: "medication",
  };
}

function nextDoseAtForScheduleTime(scheduleTime) {
  if (!scheduleTime) return null;

  const [hours, minutes] = scheduleTime.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const doseAt = new Date();
  doseAt.setHours(hours, minutes, 0, 0);
  return doseAt.toISOString();
}

function uniqueDueAndFutureReminders(reminders) {
  const now = Date.now();
  const graceStart = now - REMINDER_GRACE_MS;
  const seen = new Set();

  return reminders
    .filter((reminder) => {
      const scheduledAt = new Date(reminder.scheduledFor).getTime();
      return Number.isFinite(scheduledAt) && scheduledAt >= graceStart;
    })
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
    .filter((reminder) => {
      const key = `${reminder.medicationId}:${new Date(reminder.scheduledFor).getTime()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function currentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toDatabaseError(sessionError);
  }

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in before enabling reminders.");
  }

  return user;
}

async function registerNotificationWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register("/curadose-sw.js");
  } catch {
    return null;
  }
}

async function showDoseNotification(reminder) {
  const options = {
    body: formatReminderBody(reminder),
    tag: reminder.id,
    renotify: true,
    requireInteraction: true,
    data: {
      url: "/dashboard",
      reminderId: reminder.id,
      medicationId: reminder.medicationId,
    },
  };

  const registration = await registerNotificationWorker();

  if (registration?.showNotification) {
    await registration.showNotification(`Time to take ${reminder.medicationName}`, options);
    return;
  }

  new Notification(`Time to take ${reminder.medicationName}`, options);
}

function clearDoseNotificationTimers() {
  scheduledTimers.forEach((timerId) => window.clearTimeout(timerId));
  scheduledTimers.clear();
}

export function getDoseNotificationState() {
  const permission = notificationPermission();
  const supported = permission !== "unsupported";
  const enabled = supported && permission === "granted" && readEnabledPreference();

  if (!supported) {
    return {
      supported,
      permission,
      enabled: false,
      status: "unsupported",
      description: "This browser does not support notifications.",
    };
  }

  if (permission === "denied") {
    return {
      supported,
      permission,
      enabled: false,
      status: "denied",
      description: "Notifications are blocked in this browser.",
    };
  }

  if (enabled) {
    return {
      supported,
      permission,
      enabled: true,
      status: "enabled",
      description: "Dose reminders are on for this device.",
    };
  }

  return {
    supported,
    permission,
    enabled: false,
    status: "disabled",
    description: "Turn on reminders for scheduled doses.",
  };
}

export async function requestDoseNotificationPermission() {
  if (!canUseBrowserNotifications()) {
    return getDoseNotificationState();
  }

  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  saveEnabledPreference(permission === "granted");
  await registerNotificationWorker();

  return getDoseNotificationState();
}

export function disableDoseNotifications() {
  saveEnabledPreference(false);
  clearDoseNotificationTimers();
  return getDoseNotificationState();
}

export async function getUpcomingDoseReminders() {
  const user = await currentUser();
  const now = new Date();
  const graceStart = new Date(now.getTime() - REMINDER_GRACE_MS);
  const horizon = new Date(now.getTime() + REMINDER_HORIZON_DAYS * MS_PER_DAY);
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart.getTime() + MS_PER_DAY - 1);

  const [doseLogsResult, medicationsResult, todayTakenLogsResult] = await Promise.all([
    supabase
      .from("dose_logs")
      .select("id,medication_id,scheduled_for,status,medications(name,dosage,instructions)")
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gte("scheduled_for", graceStart.toISOString())
      .lte("scheduled_for", horizon.toISOString())
      .order("scheduled_for", { ascending: true }),
    supabase
      .from("medications")
      .select("id,name,dosage,instructions,schedule_time,next_dose_at")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("next_dose_at", { ascending: true }),
    supabase
      .from("dose_logs")
      .select("medication_id")
      .eq("user_id", user.id)
      .eq("status", "taken")
      .gte("scheduled_for", todayStart.toISOString())
      .lte("scheduled_for", todayEnd.toISOString()),
  ]);

  const firstError = [doseLogsResult.error, medicationsResult.error, todayTakenLogsResult.error].find(Boolean);

  if (firstError) {
    throw toDatabaseError(firstError);
  }

  const completedMedicationIdsToday = new Set(
    (todayTakenLogsResult.data || []).map((log) => log.medication_id)
  );

  return {
    userId: user.id,
    reminders: uniqueDueAndFutureReminders([
      ...(doseLogsResult.data || []).map(reminderFromDoseLog),
      ...(medicationsResult.data || []).map((medication) =>
        reminderFromMedication(medication, {
          now,
          takenToday: completedMedicationIdsToday.has(medication.id),
        })
      ),
    ]),
  };
}

export async function scheduleDoseNotifications() {
  const state = getDoseNotificationState();

  if (!state.enabled) {
    clearDoseNotificationTimers();
    return {
      ...state,
      scheduledCount: 0,
      nextReminderAt: null,
      nextReminderText: "",
    };
  }

  const { userId, reminders } = await getUpcomingDoseReminders();
  const deliveredIds = new Set(readDeliveredNotificationIds(userId));

  clearDoseNotificationTimers();

  reminders.forEach((reminder) => {
    if (deliveredIds.has(reminder.id)) return;

    const delay = Math.max(0, new Date(reminder.scheduledFor).getTime() - Date.now());
    if (delay > MAX_TIMER_DELAY) return;

    const timerId = window.setTimeout(async () => {
      scheduledTimers.delete(reminder.id);
      rememberDeliveredNotification(userId, reminder.id);

      try {
        await showDoseNotification(reminder);
      } catch {
        /* ignore */
      }
    }, delay);

    scheduledTimers.set(reminder.id, timerId);
  });

  const nextReminder = reminders.find((reminder) => !deliveredIds.has(reminder.id));

  return {
    ...state,
    scheduledCount: scheduledTimers.size,
    nextReminderAt: nextReminder?.scheduledFor || null,
    nextReminderText: nextReminder ? `${nextReminder.medicationName}, ${formatDoseTime(nextReminder.scheduledFor)}` : "",
  };
}

export { clearDoseNotificationTimers };
