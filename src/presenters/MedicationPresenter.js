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
      readOnlyMessage: "",
    };
  }

  if (user.role === "patient" && user.hasCaregiver) {
    return {
      mode: ACCESS_MODE.MANAGED,
      canWrite: false,
      readOnlyMessage: READ_ONLY_MESSAGE,
    };
  }

  return {
    mode: ACCESS_MODE.INDEPENDENT,
    canWrite: true,
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

export function validateMedicationDraft(draft) {
  const errors = {};

  if (!draft.name?.trim()) {
    errors.name = "Name is required.";
  }

  if (draft.scheduleTime && !/^\d{1,2}:\d{2}/.test(draft.scheduleTime)) {
    errors.scheduleTime = "Use a valid time (HH:MM).";
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

export async function loadMedicationSchedule() {
  const data = await getMedicationSchedule();
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
    name: draft.name,
    dosage: draft.dosage,
    frequency: draft.frequency,
    scheduleTime: normalizeTimeForDatabase(draft.scheduleTime),
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
    name: draft.name,
    dosage: draft.dosage,
    frequency: draft.frequency,
    scheduleTime: normalizeTimeForDatabase(draft.scheduleTime),
    instructions: draft.instructions,
  });
}

export async function removeMedication(access, medicationId) {
  ensureWriteAccess(access);
  await deleteMedication(medicationId);
}
