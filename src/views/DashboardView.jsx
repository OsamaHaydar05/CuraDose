import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardData } from "../services/dashboardService";
import { signOut } from "../services/authService";
import { supabase } from "../services/supabaseConfig";
import {
  clearDoseNotificationTimers,
  disableDoseNotifications,
  getDoseNotificationState,
  requestDoseNotificationPermission,
  scheduleDoseNotifications,
} from "../services/notificationService";
import "../styles/DashboardView.css";

const fallbackWeeklyProgress = [
  { day: "Mon", value: 0, total: 0 },
  { day: "Tue", value: 0, total: 0 },
  { day: "Wed", value: 0, total: 0 },
  { day: "Thu", value: 0, total: 0 },
  { day: "Fri", value: 0, total: 0 },
  { day: "Sat", value: 0, total: 0 },
  { day: "Sun", value: 0, total: 0 },
];

const navItems = ["Home", "Pills", "Profile", "Settings"];
const DISMISSED_DOSE_ALERT_KEY = "curadose-dismissed-dose-alert";

function readDismissedDoseAlertId() {
  try {
    return window.localStorage.getItem(DISMISSED_DOSE_ALERT_KEY) || "";
  } catch {
    return "";
  }
}

function saveDismissedDoseAlertId(alertId) {
  try {
    window.localStorage.setItem(DISMISSED_DOSE_ALERT_KEY, alertId);
  } catch {
    // Dismissal is only a convenience; the alert still works without storage.
  }
}

function DashboardIcon({ name }) {
  const commonProps = {
    className: "patient-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (name === "capsule" || name === "pill") {
    return (
      <svg {...commonProps}>
        <path d="M7.4 16.6 16.6 7.4a4 4 0 0 1 5.7 5.7l-9.2 9.2a4 4 0 1 1-5.7-5.7Z" />
        <path d="m12 12 4 4" />
      </svg>
    );
  }

  if (name === "bottle") {
    return (
      <svg {...commonProps}>
        <path d="M9 3h6v4H9V3Z" />
        <path d="M7.5 8.5h9v11A1.5 1.5 0 0 1 15 21H9a1.5 1.5 0 0 1-1.5-1.5v-11Z" />
        <path d="M10 13h4" />
      </svg>
    );
  }

  if (name === "clock" || name === "history") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
        {name === "history" ? <path d="M7 6H3V2" /> : null}
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...commonProps}>
        <path d="M20.4 5.8a5 5 0 0 0-7.1 0L12 7.1l-1.3-1.3a5 5 0 1 0-7.1 7.1l8.4 8.4 8.4-8.4a5 5 0 0 0 0-7.1Z" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="m3 11 9-8 9 8" />
        <path d="M5.5 10v11h13V10" />
        <path d="M10 21v-6h4v6" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 3.1h5l.3-3.1a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg {...commonProps}>
        <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...commonProps}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  if (name === "signal") {
    return (
      <svg {...commonProps}>
        <path d="M4 18h.01" />
        <path d="M8 18a4 4 0 0 1 8 0" />
        <path d="M5 12a10 10 0 0 1 14 0" />
        <path d="M2 7a15 15 0 0 1 20 0" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...commonProps}>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M8 12h10" />
      </svg>
    );
  }

  if (name === "warning") {
    return (
      <svg {...commonProps}>
        <path d="M12 4 3.5 19h17L12 4Z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </svg>
    );
  }

  return null;
}

function ChartLine({ weeklyProgress, weeklyScore }) {
  const days = weeklyProgress.length ? weeklyProgress : fallbackWeeklyProgress;
  const points = days
    .map((item, index) => `${index * 42 + 12},${110 - item.value}`)
    .join(" ");
  const activeDay = new Date().toLocaleDateString([], { weekday: "short" });

  return (
    <div className="dashboard-chart patient-chart" aria-label="Weekly progress chart">
      <div className="dashboard-chart-score">
        <strong>{weeklyScore}%</strong>
        <span>Week</span>
      </div>
      <svg viewBox="0 0 276 76" role="img" aria-label="Weekly adherence trend">
        <path className="dashboard-chart-grid" d="M0 18h276M0 52h276" />
        <polyline className="dashboard-chart-area" points={`12,76 ${points} 264,76`} />
        <polyline className="dashboard-chart-line" points={points} />
        {days.map((item, index) => (
          <circle
            key={item.day}
            className={item.day === activeDay ? "dashboard-chart-dot dashboard-chart-dot--active" : "dashboard-chart-dot"}
            cx={index * 42 + 12}
            cy={110 - item.value}
            r={item.day === activeDay ? 6 : 4}
          />
        ))}
      </svg>
      <div className="dashboard-chart-days">
        {days.map((item) => (
          <span className={item.day === activeDay ? "dashboard-chart-day--active" : ""} key={item.day}>
            {item.day}
          </span>
        ))}
      </div>
    </div>
  );
}

function navIconFor(label) {
  if (label === "Pills") return "pill";
  if (label === "Profile") return "user";
  if (label === "Settings") return "settings";
  return "home";
}

function statusTone(status) {
  if (status === "ready") return "success";
  if (status === "low" || status === "empty") return "warn";
  return "muted";
}

function overviewCardById(cards, id) {
  return cards.find((card) => card.id === id) || null;
}

export default function DashboardView() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeView, setActiveView] = useState("Home");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [notificationState, setNotificationState] = useState(() => getDoseNotificationState());
  const [notificationMessage, setNotificationMessage] = useState("");
  const [dismissedDoseAlertId, setDismissedDoseAlertId] = useState(readDismissedDoseAlertId);

  const syncDoseNotifications = async () => {
    const currentState = getDoseNotificationState();

    if (!currentState.enabled) {
      setNotificationState(currentState);
      return currentState;
    }

    try {
      const nextState = await scheduleDoseNotifications();
      setNotificationState(nextState);
      return nextState;
    } catch (err) {
      const fallbackState = {
        ...currentState,
        description: err.message || "Unable to sync reminders right now.",
      };
      setNotificationState(fallbackState);
      return fallbackState;
    }
  };

  const loadDashboard = async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await getDashboardData();
      setDashboardData(data);
      await syncDoseNotifications();
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let refreshTimer = null;

    const refreshDashboard = () => {
      if (!isMounted) return;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        loadDashboard();
      }, 250);
    };

    loadDashboard();
    syncDoseNotifications();

    const reminderSync = window.setInterval(syncDoseNotifications, 60 * 1000);
    const dashboardSync = window.setInterval(loadDashboard, 10 * 1000);
    const dashboardChannel = supabase
      .channel("dashboard-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_slots" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "dose_logs" }, refreshDashboard)
      .subscribe();

    return () => {
      isMounted = false;
      window.clearTimeout(refreshTimer);
      window.clearInterval(reminderSync);
      window.clearInterval(dashboardSync);
      supabase.removeChannel(dashboardChannel);
      clearDoseNotificationTimers();
    };
  }, []);

  const handleLogout = async () => {
    setError("");

    try {
      await signOut();
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to log out right now.");
    }
  };

  const handleNotificationsToggle = async () => {
    setNotificationMessage("");
    setIsUpdatingNotifications(true);

    try {
      if (notificationState.enabled) {
        const nextState = disableDoseNotifications();
        setNotificationState(nextState);
        setNotificationMessage("Dose reminders are off for this device.");
        return;
      }

      const permissionState = await requestDoseNotificationPermission();

      if (permissionState.permission !== "granted") {
        setNotificationState(permissionState);
        setNotificationMessage("Allow notifications in your browser to receive dose reminders.");
        return;
      }

      const nextState = await scheduleDoseNotifications();
      setNotificationState(nextState);
      setNotificationMessage(
        nextState.scheduledCount
          ? "Your next dose reminder is ready."
          : "Reminders are on. Add an upcoming dose to schedule the first alert."
      );
    } catch (err) {
      setNotificationMessage(err.message || "Unable to update reminders right now.");
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const notificationButtonLabel = notificationState.enabled ? "Turn off" : "Enable";
  const notificationDescription = notificationState.nextReminderText
    ? `Next reminder: ${notificationState.nextReminderText}`
    : notificationState.description;
  const notificationButtonDisabled =
    isUpdatingNotifications || notificationState.status === "unsupported" || notificationState.status === "denied";

  const data = dashboardData || {
    user: { firstName: "there", avatarInitial: "C", email: "" },
    streakDays: 0,
    nextDose: {
      medicationName: "Loading medication",
      doseText: "Syncing with Supabase",
      timeText: "Please wait",
      medicationId: null,
      canTakeDose: false,
      statusLabel: "Syncing",
    },
    overviewCards: [],
    extraDoseAlert: null,
    missedDoseAlert: null,
    weeklyProgress: fallbackWeeklyProgress,
    weeklyScore: 0,
    deviceStatus: {
      title: "CuraDose Lock Box",
      subtitle: "Software ready for the locking medication box",
      slots: [
        {
          id: "loading-slot-1",
          slotNumber: 1,
          label: "Box 1: Yellow",
          medicationName: "Loading",
          pillCount: 0,
          boxStatusText: "Not connected",
          status: "setup_needed",
          statusLabel: "Setup needed",
          syncText: "No device sync yet",
        },
        {
          id: "loading-slot-2",
          slotNumber: 2,
          label: "Box 2: Blue",
          medicationName: "Loading",
          pillCount: 0,
          boxStatusText: "Not connected",
          status: "setup_needed",
          statusLabel: "Setup needed",
          syncText: "No device sync yet",
        },
      ],
    },
    healthTip: {
      title: "Health Tip",
      headline: "Drink water with your medication",
      body: "It helps your body absorb it better.",
    },
  };

  const currentDoseAlertDismissalId = [data.extraDoseAlert?.id, data.missedDoseAlert?.id].filter(Boolean).join("|");
  const visibleDoseAlert =
    currentDoseAlertDismissalId && currentDoseAlertDismissalId !== dismissedDoseAlertId
      ? data.extraDoseAlert || data.missedDoseAlert
      : null;
  const dosesCard = overviewCardById(data.overviewCards, "doses");
  const inventoryCard = overviewCardById(data.overviewCards, "inventory");
  const caregiverCard = overviewCardById(data.overviewCards, "caregiver");
  const slots = data.deviceStatus.slots || [];
  const hasLiveSlots = slots.some((slot) => slot.source === "device");
  const needsRefill = slots.some((slot) => slot.status === "low" || slot.status === "empty");
  const boxStatus = needsRefill ? "Needs refill" : hasLiveSlots ? "Synced" : "Setup needed";
  const notificationBadge = notificationState.enabled ? "Reminders on" : "Reminders off";

  const handleDismissDoseAlert = () => {
    if (!visibleDoseAlert?.id) return;

    saveDismissedDoseAlertId(currentDoseAlertDismissalId);
    setDismissedDoseAlertId(currentDoseAlertDismissalId);
  };

  return (
    <main className="patient-dashboard" aria-label="CuraDose patient dashboard">
      <aside className="patient-sidebar">
        <div className="patient-brand">
          <span className="patient-brand-icon">
            <DashboardIcon name="pill" />
          </span>
          <div>
            <strong>CuraDose</strong>
            <span>Smart Medication</span>
          </div>
        </div>

        <nav className="patient-nav" aria-label="Patient dashboard sections">
          {navItems.map((label) => (
            <button
              key={label}
              type="button"
              className={activeView === label ? "patient-nav-item patient-nav-item--active" : "patient-nav-item"}
              onClick={() => setActiveView(label)}
            >
              <DashboardIcon name={navIconFor(label)} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="patient-device-status">
          <div>
            <span className={hasLiveSlots ? "patient-dot patient-dot--ok" : "patient-dot patient-dot--muted"} />
            Pi sync
          </div>
          <strong>{hasLiveSlots ? "Live slot data" : "Waiting for device"}</strong>
        </div>
      </aside>

      <section className="patient-main">
        <header className="patient-header">
          <div>
            <span>{activeView === "Home" ? "Welcome back" : activeView}</span>
            <h1>{activeView === "Home" ? `Hello, ${data.user.firstName}` : activeView}</h1>
          </div>
          <div className="patient-header-actions">
            <span className="patient-badge">
              <DashboardIcon name="signal" />
              {isLoading ? "Syncing" : "Synced"}
            </span>
            <button
              type="button"
              className={notificationState.enabled ? "patient-icon-button patient-icon-button--active" : "patient-icon-button"}
              onClick={handleNotificationsToggle}
              disabled={notificationButtonDisabled}
              aria-label={notificationState.enabled ? "Turn off dose reminders" : "Enable dose reminders"}
              title={notificationBadge}
            >
              <DashboardIcon name="bell" />
            </button>
            <button type="button" className="patient-icon-button" onClick={handleLogout} aria-label="Log out">
              <DashboardIcon name="logout" />
            </button>
          </div>
        </header>

        {error ? <p className="patient-error" role="alert">{error}</p> : null}

        {visibleDoseAlert ? (
          <section className="patient-missed-alert" role="alert" aria-label="Dose safety alert">
            <span className="patient-alert-icon">
              <DashboardIcon name="warning" />
            </span>
            <div>
              <h2>{visibleDoseAlert.title}</h2>
              <p>{visibleDoseAlert.message}</p>
              <strong>{visibleDoseAlert.details}</strong>
            </div>
            <button type="button" onClick={handleDismissDoseAlert}>Clear</button>
          </section>
        ) : null}

        {activeView === "Home" ? (
          <div className="patient-stack">
            <section className="patient-cards" aria-label="Dashboard overview">
              <article className="patient-card">
                <div className="patient-card-head">
                  <span>Box Status</span>
                  <DashboardIcon name="lock" />
                </div>
                <div className="patient-card-status">
                  <span className={needsRefill ? "patient-dot patient-dot--warn" : "patient-dot patient-dot--ok"} />
                  <strong>{boxStatus}</strong>
                </div>
                <p>{data.deviceStatus.subtitle}</p>
                <button type="button" className="patient-primary-button" onClick={() => setActiveView("Pills")}>
                  View boxes
                </button>
              </article>

              <article className="patient-card">
                <div className="patient-card-head">
                  <span>Next Pill</span>
                  <DashboardIcon name="clock" />
                </div>
                <strong className="patient-card-value">{data.nextDose.timeText}</strong>
                <p>{data.nextDose.medicationName}</p>
                {data.nextDose.doseText ? <small>{data.nextDose.doseText}</small> : null}
                <span className="patient-sync-note">{data.nextDose.statusLabel}</span>
              </article>

              <article className="patient-card">
                <div className="patient-card-head">
                  <span>Weekly Adherence</span>
                  <DashboardIcon name="history" />
                </div>
                <strong className="patient-card-value">{data.weeklyScore}%</strong>
                <p>{dosesCard ? `${dosesCard.value} doses today` : "No doses scheduled today"}</p>
                <div className="patient-progress">
                  <span style={{ width: `${data.weeklyScore}%` }} />
                </div>
              </article>

              <article className="patient-card">
                <div className="patient-card-head">
                  <span>Remaining Pills</span>
                  <DashboardIcon name="bottle" />
                </div>
                <strong className="patient-card-value">{inventoryCard?.value || "0 Pills"}</strong>
                <p>{inventoryCard?.detail || "No slot data"}</p>
              </article>

              <article className="patient-card">
                <div className="patient-card-head">
                  <span>Caregiver</span>
                  <DashboardIcon name="heart" />
                </div>
                <strong className="patient-card-value">{caregiverCard?.value || "Not added"}</strong>
                <p>{caregiverCard?.detail || "Invite a caregiver"}</p>
              </article>

              <article className="patient-card">
                <div className="patient-card-head">
                  <span>Dose Reminders</span>
                  <DashboardIcon name="bell" />
                </div>
                <strong className="patient-card-value">{notificationBadge}</strong>
                <p>{notificationDescription}</p>
                {notificationMessage ? <small>{notificationMessage}</small> : null}
              </article>
            </section>

            <section className="patient-panel">
              <div className="patient-panel-head">
                <h2>Compartments</h2>
                <button type="button" onClick={() => setActiveView("Pills")}>Manage</button>
              </div>
              <div className="patient-compartments">
                {slots.map((slot) => (
                  <article className="patient-compartment" key={slot.id}>
                    <div className="patient-compartment-num">{slot.slotNumber}</div>
                    <div className="patient-compartment-info">
                      <strong>{slot.label}</strong>
                      <span>{slot.medicationName}</span>
                      <small>{slot.syncText}</small>
                    </div>
                    <div className="patient-compartment-metric">
                      <strong>{slot.pillCount}</strong>
                      <span>pills</span>
                    </div>
                    <em className={`patient-pill patient-pill--${statusTone(slot.status)}`}>{slot.statusLabel}</em>
                  </article>
                ))}
              </div>
            </section>

            <section className="patient-panel">
              <div className="patient-panel-head">
                <h2>Weekly Progress</h2>
                <span>{isLoading ? "Syncing..." : "Synced with medication history"}</span>
              </div>
              <ChartLine weeklyProgress={data.weeklyProgress} weeklyScore={data.weeklyScore} />
            </section>

            <section className="patient-panel patient-tip-panel">
              <div>
                <span>{data.healthTip.title}</span>
                <h2>{data.healthTip.headline}</h2>
                <p>{data.healthTip.body}</p>
              </div>
              <button type="button" onClick={() => navigate("/medications")}>Medication Schedule</button>
            </section>
          </div>
        ) : null}

        {activeView === "Pills" ? (
          <div className="patient-stack">
            <section className="patient-panel">
              <div className="patient-panel-head">
                <h2>Medication Schedule</h2>
                <button type="button" onClick={() => navigate("/medications")}>Open schedule</button>
              </div>
              <p className="patient-panel-copy">Add or edit the two medications assigned to the CuraDose compartments.</p>
            </section>

            <section className="patient-panel">
              <div className="patient-panel-head">
                <h2>Live Box Data</h2>
                <span>2 compartments</span>
              </div>
              <div className="patient-compartments patient-compartments--large">
                {slots.map((slot) => (
                  <article className="patient-compartment patient-compartment--large" key={slot.id}>
                    <div className="patient-compartment-num">{slot.slotNumber}</div>
                    <div className="patient-compartment-info">
                      <strong>{slot.label}</strong>
                      <span>{slot.medicationName}</span>
                      <small>{slot.boxStatusText} - {slot.syncText}</small>
                    </div>
                    <div className="patient-compartment-metric">
                      <strong>{slot.pillCount}</strong>
                      <span>remaining</span>
                    </div>
                    <em className={`patient-pill patient-pill--${statusTone(slot.status)}`}>{slot.statusLabel}</em>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "Profile" ? (
          <section className="patient-panel">
            <div className="patient-panel-head">
              <h2>Profile</h2>
              <button type="button" onClick={() => navigate("/profile")}>Open profile</button>
            </div>
            <div className="patient-profile-row">
              <span className="patient-avatar">{data.user.avatarInitial}</span>
              <div>
                <strong>{data.user.name || data.user.firstName}</strong>
                <p>{data.user.email}</p>
                <small>{data.streakDays} day streak</small>
              </div>
            </div>
          </section>
        ) : null}

        {activeView === "Settings" ? (
          <div className="patient-stack">
            <section className="patient-panel">
              <div className="patient-panel-head">
                <h2>Settings</h2>
                <button type="button" onClick={() => navigate("/settings")}>Open full settings</button>
              </div>
              <ul className="patient-settings-list">
                <li><span>Notifications</span><strong>{notificationBadge}</strong></li>
                <li><span>Pi sync</span><strong>{hasLiveSlots ? "Connected" : "Waiting"}</strong></li>
                <li><span>Caregiver</span><strong>{caregiverCard?.value || "Not added"}</strong></li>
              </ul>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
