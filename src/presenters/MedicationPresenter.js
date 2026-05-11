import {
  createMedication,
  deleteMedication,
  getMedicationSchedule,
  updateMedication,
} from "../services/medicationService";

export const ACCESS_MODE = Object.freeze({
  CAREGIVER: "caregiver",
  INDEPENDENT: "independent",
  MANAGED: "managed",
});

export const READ_ONLY_MESSAGE = "Contact your caregiver to make changes.";

export function resolveMedicationAccess(user) {
  if (!user) {
    return {
      mode: ACCESS_MODE.MANAGED,
      canWrite: false,
      readOnlyMessage: "Sign in to manage your medication schedule.",
    };
  }

  if (user.role === "caregiver" || user.role === "family") {
    return {
      mode: ACCESS_MODE.CAREGIVER,
      canWrite: true,
      targetUserId: user.scheduleUserId || user.id,
      readOnlyMessage: "",
    };
  }

  if (user.role === "patient" && user.hasCaregiver) {
    return {
      mode: ACCESS_MODE.MANAGED,
      canWrite: false,
      targetUserId: user.scheduleUserId || user.id,
      readOnlyMessage: READ_ONLY_MESSAGE,
    };
  }

  return {
    mode: ACCESS_MODE.INDEPENDENT,
    canWrite: true,
    targetUserId: user.scheduleUserId || user.id,
    readOnlyMessage: "",
  };
}

export function formatScheduleTimeForDisplay(rawTime) {
  if (!rawTime) return "Not scheduled";

  const [hourString, minuteString] = String(rawTime).split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return rawTime;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatScheduleTimesForDisplay(rawTimes) {
  const times = Array.isArray(rawTimes) ? rawTimes.filter(Boolean) : [];

  if (!times.length) return "Not scheduled";

  return times.map(formatScheduleTimeForDisplay).join(", ");
}

export function timeFieldLabelsForFrequency(frequency) {
  if (frequency === "Twice daily") return ["Dose 1", "Dose 2"];
  if (frequency === "Three times daily") return ["Dose 1", "Dose 2", "Dose 3"];
  if (frequency === "As needed") return [];
  return ["Dose time"];
}

export function normalizeTimeForDatabase(rawTime) {
  if (!rawTime) return null;

  const [hourString, minuteString] = String(rawTime).split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const padded = (value) => value.toString().padStart(2, "0");
  return `${padded(hour)}:${padded(minute)}:00`;
}

export function scheduleTimesForDraft(draft) {
  const rawTimes = Array.isArray(draft.scheduleTimes)
    ? draft.scheduleTimes
    : [draft.scheduleTime].filter(Boolean);
  return rawTimes.filter(Boolean);
}

export function normalizeScheduleTimesForDatabase(draft) {
  return scheduleTimesForDraft(draft)
    .map(normalizeTimeForDatabase)
    .filter(Boolean);
}

export function validateMedicationDraft(draft) {
  const errors = {};
  const scheduleTimes = scheduleTimesForDraft(draft);

  if (!draft.name?.trim()) {
    errors.name = "Name is required.";
  }

  if (scheduleTimes.some((time) => !/^\d{1,2}:\d{2}/.test(time))) {
    errors.scheduleTimes = "Use valid dose times.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function ensureWriteAccess(access) {
  if (!access.canWrite) {
    throw new Error(access.readOnlyMessage || READ_ONLY_MESSAGE);
  }
}

export async function loadMedicationSchedule(patientId = null) {
  const data = await getMedicationSchedule(patientId);
  const access = resolveMedicationAccess(data.user);

  return {
    user: data.user,
    medications: data.medications,
    access,
  };
}

export async function addMedication(access, draft) {
  ensureWriteAccess(access);

  const validation = validateMedicationDraft(draft);

  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0]);
  }

  return createMedication({
    userId: access.targetUserId,
    name: draft.name,
    dosage: draft.dosage,
    frequency: draft.frequency,
    scheduleTime: normalizeScheduleTimesForDatabase(draft)[0] || null,
    scheduleTimes: normalizeScheduleTimesForDatabase(draft),
    instructions: draft.instructions,
  });
}

export async function editMedication(access, medicationId, draft) {
  ensureWriteAccess(access);

  const validation = validateMedicationDraft(draft);

  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0]);
  }

  return updateMedication(medicationId, {
    userId: access.targetUserId,
    name: draft.name,
    dosage: draft.dosage,
    frequency: draft.frequency,
    scheduleTime: normalizeScheduleTimesForDatabase(draft)[0] || null,
    scheduleTimes: normalizeScheduleTimesForDatabase(draft),
    instructions: draft.instructions,
  });
}

export async function removeMedication(access, medicationId) {
  ensureWriteAccess(access);
  await deleteMedication(medicationId, access.targetUserId);
}
