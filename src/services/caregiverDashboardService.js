import { toDatabaseError } from "./databaseErrors";
import { supabase } from "./supabaseConfig";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function initialsForName(name, email) {
  const source = name || email || "Patient";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "PT";
}

function formatDoseTime(value) {
  if (!value) return "No scheduled dose";

  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatAlertTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const today = startOfDay(new Date()).getTime();
  const alertDay = startOfDay(date).getTime();

  if (alertDay === today) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  if (alertDay === today - MS_PER_DAY) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function pillWord(count) {
  return Number(count) === 1 ? "pill" : "pills";
}

function formatPillCount(count) {
  const value = Number(count);

  if (!Number.isFinite(value)) return "1";

  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function expectedPillsForMedication(medication) {
  const dosage = medication?.dosage?.trim();

  if (!dosage) return 1;

  const match = dosage.match(/(\d+(?:[.,]\d+)?)/);
  const count = match ? Number(match[1].replace(",", ".")) : 1;

  return Number.isFinite(count) && count > 0 ? count : 1;
}

function pillsTakenForLog(log) {
  const count = Number(log.pills_difference);

  return Number.isFinite(count) && count > 0 ? count : null;
}

function isExtraDoseLog(log) {
  const expected = expectedPillsForMedication(log.medications);
  const taken = pillsTakenForLog(log);

  return taken !== null && taken > expected;
}

function formatLastActivity(log, slotsByPatient) {
  const slot = slotsByPatient[0];

  if (log) {
    const medicationName = log.medications?.name || "Medication";
    if (isExtraDoseLog(log)) return `${medicationName} possible overdose - ${formatAlertTime(log.taken_at || log.scheduled_for)}`;
    if (log.status === "missed") return `${medicationName} missed - ${formatAlertTime(log.scheduled_for)}`;
    if (log.status === "taken" || log.taken_at) return `${medicationName} taken - ${formatAlertTime(log.taken_at || log.scheduled_for)}`;
    return `${medicationName} scheduled - ${formatAlertTime(log.scheduled_for)}`;
  }

  if (slot?.last_event_at) {
    return `${slot.label || "Box"} synced - ${formatAlertTime(slot.last_event_at)}`;
  }

  return "No activity yet";
}

function adherenceForLogs(logs) {
  if (!logs.length) return 0;

  const completed = logs.filter((log) => log.status === "taken" || log.taken_at).length;
  return Math.round((completed / logs.length) * 100);
}

function patientStatus({ extraDoseToday, missedToday, lowSlots }) {
  if (extraDoseToday.length) {
    return { status: "Possible overdose", tone: "warn" };
  }

  if (missedToday.length) {
    return { status: "Missed dose", tone: "warn" };
  }

  if (lowSlots.length) {
    return { status: "Needs refill", tone: "warn" };
  }

  return { status: "On track", tone: "success" };
}

function nextDoseForPatient(logs, medications) {
  const now = new Date();
  const upcomingLog = logs
    .filter((log) => log.status === "scheduled" && new Date(log.scheduled_for) >= now)
    .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))[0];

  if (upcomingLog) return upcomingLog.scheduled_for;

  return medications
    .filter((medication) => medication.next_dose_at && new Date(medication.next_dose_at) >= now)
    .sort((a, b) => new Date(a.next_dose_at) - new Date(b.next_dose_at))[0]?.next_dose_at || null;
}

function pillInventoryForPatient(slots, medications) {
  const liveSlots = slots.filter((slot) => typeof slot.current_pill_count === "number");

  if (liveSlots.length) {
    const total = liveSlots.reduce((sum, slot) => sum + slot.current_pill_count, 0);
    const detail = liveSlots
      .sort((a, b) => a.slot_number - b.slot_number)
      .map((slot) => `${slot.label || `Box ${slot.slot_number}`}: ${slot.current_pill_count}`)
      .join(" | ");

    return {
      total,
      detail: detail || "Live box data",
    };
  }

  const medicationCounts = medications
    .map((medication) => Number(medication.remaining_pills))
    .filter((count) => Number.isFinite(count));
  const total = medicationCounts.reduce((sum, count) => sum + count, 0);

  return {
    total,
    detail: medicationCounts.length ? "Medication schedule estimate" : "No pill data yet",
  };
}

function buildAlerts({ patientsById, logs, slots }) {
  const since = new Date(Date.now() - MS_PER_DAY);
  const logAlerts = logs
    .filter((log) => new Date(log.updated_at || log.taken_at || log.scheduled_for) >= since)
    .filter((log) => log.status === "missed" || log.status === "taken" || log.taken_at || isExtraDoseLog(log))
    .map((log) => {
      const patient = patientsById[log.user_id];
      const medicationName = log.medications?.name || "medication";
      const hasExtraDose = isExtraDoseLog(log);
      const expected = expectedPillsForMedication(log.medications);
      const taken = pillsTakenForLog(log);
      const alertDate = log.status === "missed" ? log.scheduled_for : log.taken_at || log.updated_at || log.scheduled_for;

      return {
        id: `log-${log.id}`,
        date: alertDate,
        time: formatAlertTime(alertDate),
        label:
          hasExtraDose
            ? `${patient?.name || "Patient"} took ${formatPillCount(taken)} ${pillWord(taken)} instead of ${formatPillCount(expected)} ${pillWord(expected)} of ${medicationName}`
            : log.status === "missed"
            ? `${patient?.name || "Patient"} missed ${medicationName}`
            : `${patient?.name || "Patient"} took ${medicationName}`,
        tone: log.status === "missed" || hasExtraDose ? "warn" : "success",
      };
    });

  const slotAlerts = slots
    .filter((slot) => slot.status === "low" || slot.status === "empty")
    .map((slot) => {
      const patient = patientsById[slot.user_id];
      const alertDate = slot.last_event_at || slot.updated_at || new Date().toISOString();

      return {
        id: `slot-${slot.id}`,
        date: alertDate,
        time: formatAlertTime(alertDate),
        label: `${patient?.name || "Patient"} ${slot.label || "box"} needs refill`,
        tone: "warn",
      };
    });

  return [...logAlerts, ...slotAlerts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);
}

export async function getCaregiverDashboardData() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw toDatabaseError(sessionError);
  }

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in to view the caregiver dashboard.");
  }

  const caregiverEmail = user.email || "";
  const { data: caregiverProfile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw toDatabaseError(profileError);
  }

  const { data: invites, error: invitesError } = await supabase
    .from("caregiver_invites")
    .select("id,patient_id,status,requested_by,created_at,updated_at,caregiver_email")
    .ilike("caregiver_email", caregiverEmail)
    .order("created_at", { ascending: false });

  if (invitesError) {
    throw toDatabaseError(invitesError);
  }

  const acceptedInvites = (invites || []).filter((invite) => invite.status === "accepted");
  const acceptedPatientIds = [...new Set(acceptedInvites
    .filter((invite) => invite.status === "accepted")
    .map((invite) => invite.patient_id))];
  const pendingInvites = (invites || []).filter(
    (invite) => invite.status === "pending" && invite.requested_by === "patient"
  );
  const sentRequests = (invites || []).filter(
    (invite) => invite.status === "pending" && invite.requested_by === "caregiver"
  );
  const visiblePendingPatientIds = [...new Set([...pendingInvites, ...sentRequests].map((invite) => invite.patient_id))];
  const visibleProfileIds = [...new Set([...acceptedPatientIds, ...visiblePendingPatientIds])];
  let visibleProfiles = [];

  if (visibleProfileIds.length) {
    const { data: profileRows, error: visibleProfilesError } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", visibleProfileIds);

    if (visibleProfilesError) {
      throw toDatabaseError(visibleProfilesError);
    }

    visibleProfiles = profileRows || [];
  }

  const profileForPatient = (patientId) => visibleProfiles.find((profile) => profile.id === patientId);
  const mapConnectionInvite = (invite) => {
    const profile = profileForPatient(invite.patient_id);
    const name = profile?.full_name || profile?.email?.split("@")[0] || "Patient";

    return {
      id: invite.id,
      patientId: invite.patient_id,
      patientName: name,
      patientEmail: profile?.email || "",
      initials: initialsForName(name, profile?.email),
      status: invite.status,
      requestedBy: invite.requested_by,
      createdAt: invite.created_at,
    };
  };

  if (!acceptedPatientIds.length) {
    return {
      caregiverName: caregiverProfile?.full_name || user.user_metadata?.full_name || caregiverEmail.split("@")[0] || "Caregiver",
      patients: [],
      alerts: [],
      pendingInvites: pendingInvites.map(mapConnectionInvite),
      sentRequests: sentRequests.map(mapConnectionInvite),
      onTrackCount: 0,
      needsAttentionCount: 0,
    };
  }

  const sinceThirtyDays = new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
  const [profilesResult, medicationsResult, doseLogsResult, slotsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", acceptedPatientIds),
    supabase
      .from("medications")
      .select("id,user_id,name,dosage,instructions,next_dose_at,remaining_pills,active")
      .in("user_id", acceptedPatientIds)
      .eq("active", true),
    supabase
      .from("dose_logs")
      .select("id,user_id,medication_id,scheduled_for,taken_at,status,updated_at,pills_before,pills_after,pills_difference,medications(name,dosage)")
      .in("user_id", acceptedPatientIds)
      .gte("scheduled_for", sinceThirtyDays)
      .order("scheduled_for", { ascending: false }),
    supabase
      .from("device_slots")
      .select("id,user_id,label,slot_number,status,current_pill_count,last_event_at,updated_at")
      .in("user_id", acceptedPatientIds)
      .order("slot_number", { ascending: true }),
  ]);

  const firstError = [
    profilesResult.error,
    medicationsResult.error,
    doseLogsResult.error,
    slotsResult.error,
  ].find(Boolean);

  if (firstError) {
    throw toDatabaseError(firstError);
  }

  const profiles = profilesResult.data?.length ? profilesResult.data : visibleProfiles;
  const medications = medicationsResult.data || [];
  const logs = doseLogsResult.data || [];
  const slots = slotsResult.data || [];
  const todayStart = startOfDay(new Date());

  const patients = acceptedPatientIds.map((patientId) => {
    const profile = profiles.find((item) => item.id === patientId);
    const patientLogs = logs.filter((log) => log.user_id === patientId);
    const patientMedications = medications.filter((medication) => medication.user_id === patientId);
    const patientSlots = slots.filter((slot) => slot.user_id === patientId);
    const acceptedInvite = acceptedInvites.find((invite) => invite.patient_id === patientId);
    const missedToday = patientLogs.filter(
      (log) => log.status === "missed" && new Date(log.scheduled_for) >= todayStart
    );
    const extraDoseToday = patientLogs.filter(
      (log) => isExtraDoseLog(log) && new Date(log.scheduled_for) >= todayStart
    );
    const lowSlots = patientSlots.filter((slot) => slot.status === "low" || slot.status === "empty");
    const status = patientStatus({ extraDoseToday, missedToday, lowSlots });
    const inventory = pillInventoryForPatient(patientSlots, patientMedications);
    const name = profile?.full_name || profile?.email?.split("@")[0] || "Patient";
    const latestLog = [...patientLogs].sort(
      (a, b) => new Date(b.updated_at || b.taken_at || b.scheduled_for) - new Date(a.updated_at || a.taken_at || a.scheduled_for)
    )[0];

    return {
      id: patientId,
      connectionId: acceptedInvite?.id || null,
      name,
      initials: initialsForName(name, profile?.email),
      status: status.status,
      tone: status.tone,
      nextDose: formatDoseTime(nextDoseForPatient(patientLogs, patientMedications)),
      adherence: adherenceForLogs(patientLogs),
      remainingPills: inventory.total,
      remainingPillsDetail: inventory.detail,
      lastActivity: formatLastActivity(latestLog, patientSlots),
    };
  });

  const patientsById = patients.reduce((result, patient) => {
    result[patient.id] = patient;
    return result;
  }, {});
  const alerts = buildAlerts({ patientsById, logs, slots });

  return {
    caregiverName: caregiverProfile?.full_name || user.user_metadata?.full_name || caregiverEmail.split("@")[0] || "Caregiver",
    patients,
    alerts,
    pendingInvites: pendingInvites.map(mapConnectionInvite),
    sentRequests: sentRequests.map(mapConnectionInvite),
    onTrackCount: patients.filter((patient) => patient.tone === "success").length,
    needsAttentionCount: patients.filter((patient) => patient.tone === "warn").length,
  };
}
