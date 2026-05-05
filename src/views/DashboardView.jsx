import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardData, markDoseTaken } from "../services/dashboardService";
import { signOut } from "../services/authService";
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

const quickActions = [
  { id: "medications", icon: "capsule", label: "My Medications" },
  { id: "inventory", icon: "bottle", label: "Inventory" },
  { id: "device", icon: "scale", label: "Dispenser" },
  { id: "reminders", icon: "clock", label: "Reminders" },
  { id: "caregiver", icon: "users", label: "Caregiver" },
];

const navItems = [
  { id: "home", icon: "home", label: "Home", active: true },
  { id: "history", icon: "history", label: "History" },
  { id: "scan", icon: "scan", label: "Scan" },
  { id: "caregiver", icon: "users", label: "Caregiver" },
  { id: "settings", icon: "gear", label: "Settings" },
];

function DashboardIcon({ name }) {
  const commonProps = {
    className: "dashboard-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (name === "capsule") {
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

  if (name === "scale") {
    return (
      <svg {...commonProps}>
        <path d="M12 4v4" />
        <path d="M7 8h10" />
        <path d="M6 20h12" />
        <path d="M8 8 5 17h6L8 8Z" />
        <path d="m16 8-3 9h6l-3-9Z" />
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

  if (name === "heart") {
    return (
      <svg {...commonProps}>
        <path d="M20.4 5.8a5 5 0 0 0-7.1 0L12 7.1l-1.3-1.3a5 5 0 1 0-7.1 7.1l8.4 8.4 8.4-8.4a5 5 0 0 0 0-7.1Z" />
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

  if (name === "users") {
    return (
      <svg {...commonProps}>
        <path d="M9.5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M3.5 21a6 6 0 0 1 12 0" />
        <path d="M16 11a3.2 3.2 0 1 0 0-6.4" />
        <path d="M18.5 20a5 5 0 0 0-3.2-4.6" />
      </svg>
    );
  }

  if (name === "gear") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 3.1h5l.3-3.1a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
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

  if (name === "scan") {
    return (
      <svg {...commonProps}>
        <path d="M5 8V5h3" />
        <path d="M16 5h3v3" />
        <path d="M19 16v3h-3" />
        <path d="M8 19H5v-3" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
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

  return null;
}

function MedicationIllustration() {
  return (
    <div className="dashboard-pill-art" aria-hidden>
      <div className="dashboard-pill-tablet">20</div>
      <div className="dashboard-pill-shadow" />
    </div>
  );
}

function ChartLine({ weeklyProgress, weeklyScore }) {
  const days = weeklyProgress.length ? weeklyProgress : fallbackWeeklyProgress;
  const points = days
    .map((item, index) => `${index * 42 + 12},${110 - item.value}`)
    .join(" ");
  const activeDay = new Date().toLocaleDateString([], { weekday: "short" });

  return (
    <div className="dashboard-chart" aria-label="Weekly progress chart">
      <div className="dashboard-chart-score">
        <strong>{weeklyScore}%</strong>
        <span>Up</span>
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

export default function DashboardView() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingDose, setIsTakingDose] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [notificationState, setNotificationState] = useState(() => getDoseNotificationState());
  const [notificationMessage, setNotificationMessage] = useState("");

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
    loadDashboard();
    syncDoseNotifications();

    const reminderSync = window.setInterval(syncDoseNotifications, 60 * 1000);

    return () => {
      window.clearInterval(reminderSync);
      clearDoseNotificationTimers();
    };
  }, []);

  const handleTakeDose = async () => {
    if (!dashboardData?.nextDose?.medicationId) return;

    setError("");
    setIsTakingDose(true);

    try {
      await markDoseTaken({
        doseLogId: dashboardData.nextDose.doseLogId,
        medicationId: dashboardData.nextDose.medicationId,
      });
      await loadDashboard();
      await syncDoseNotifications();
    } catch (err) {
      setError(err.message || "Unable to save this dose.");
    } finally {
      setIsTakingDose(false);
    }
  };

  const handleLogout = async () => {
    setError("");

    try {
      await signOut();
      navigate("/login");
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
    user: { firstName: "there", avatarInitial: "C" },
    streakDays: 0,
    nextDose: {
      medicationName: "Loading medication",
      doseText: "Syncing with Supabase",
      timeText: "Please wait",
      medicationId: null,
    },
    overviewCards: [],
    weeklyProgress: fallbackWeeklyProgress,
    weeklyScore: 0,
    deviceStatus: {
      title: "Smart Dispenser",
      subtitle: "Software ready for the two-box hardware",
      slots: [
        {
          id: "loading-slot-1",
          slotNumber: 1,
          label: "Box 1",
          medicationName: "Loading",
          pillCount: 0,
          dispenserStatusText: "Not connected",
          status: "setup_needed",
          statusLabel: "Setup needed",
          syncText: "No device sync yet",
        },
        {
          id: "loading-slot-2",
          slotNumber: 2,
          label: "Box 2",
          medicationName: "Loading",
          pillCount: 0,
          dispenserStatusText: "Not connected",
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

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell" aria-label="CuraDose dashboard">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <span className="dashboard-brand-mark" aria-hidden>
              <DashboardIcon name="capsule" />
            </span>
            <span>CuraDose</span>
          </div>
          <div className="dashboard-header-actions">
            <button
              className={notificationState.enabled ? "dashboard-icon-btn dashboard-bell dashboard-bell--active" : "dashboard-icon-btn dashboard-bell"}
              type="button"
              onClick={handleNotificationsToggle}
              aria-label={notificationState.enabled ? "Turn off dose reminders" : "Enable dose reminders"}
              title={notificationState.enabled ? "Dose reminders are on" : "Enable dose reminders"}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
                <path d="M10 21h4" />
              </svg>
              <span className="dashboard-bell-dot" />
            </button>
            <button className="dashboard-icon-btn" type="button" onClick={handleLogout} aria-label="Log out">
              <DashboardIcon name="logout" />
            </button>
            <div className="dashboard-avatar" aria-label={`${data.user.firstName} profile`}>
              {data.user.avatarInitial}
            </div>
          </div>
        </header>

        {error ? <p className="dashboard-error">{error}</p> : null}

        <section className="dashboard-greeting">
          <div>
            <p>Good morning,</p>
            <h1>{data.user.firstName}! <span aria-hidden>Hi</span></h1>
            <p>Stay on track. You've got this!</p>
          </div>
          <article className="dashboard-streak" aria-label="Current streak">
            <span>Streak</span>
            <strong>{data.streakDays} Days</strong>
          </article>
        </section>

        <section className="dashboard-dose-card" aria-label="Next dose">
          <div className="dashboard-dose-copy">
            <span className="dashboard-dose-label">
              <DashboardIcon name="clock" />
              Next Dose
            </span>
            <h2>{data.nextDose.medicationName}</h2>
            <p>{data.nextDose.doseText}</p>
            <span className="dashboard-time-pill">
              <DashboardIcon name="clock" />
              {data.nextDose.timeText}
            </span>
          </div>
          <div className="dashboard-dose-action">
            <MedicationIllustration />
            <button
              type="button"
              onClick={handleTakeDose}
              disabled={isLoading || isTakingDose || !data.nextDose.medicationId}
            >
              {isTakingDose ? "Saving..." : "Take Dose"}
            </button>
          </div>
        </section>

        <section className="dashboard-reminder-card" aria-label="Dose reminders">
          <span className="dashboard-reminder-icon">
            <DashboardIcon name="clock" />
          </span>
          <div>
            <h2>Dose reminders</h2>
            <p>{notificationDescription}</p>
            {notificationMessage ? <strong>{notificationMessage}</strong> : null}
          </div>
          <button type="button" onClick={handleNotificationsToggle} disabled={notificationButtonDisabled}>
            {isUpdatingNotifications ? "Saving..." : notificationButtonLabel}
          </button>
        </section>

        <div className="dashboard-carousel-dots" aria-hidden>
          <span className="dashboard-carousel-dot--active" />
          <span />
          <span />
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <h2>Today's Overview</h2>
            <button type="button" onClick={loadDashboard}>Refresh</button>
          </div>
          <div className="dashboard-overview-grid">
            {data.overviewCards.map((card) => (
              <article className="dashboard-overview-card" key={card.id}>
                <span className="dashboard-card-icon">
                  <DashboardIcon name={card.icon} />
                </span>
                <h3>{card.title}</h3>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
                {typeof card.progress === "number" ? (
                  <div className="dashboard-progress-track" aria-hidden>
                    <span style={{ width: `${card.progress}%` }} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section dashboard-device-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>{data.deviceStatus.title}</h2>
              <p>{data.deviceStatus.subtitle}</p>
            </div>
            <span className="dashboard-device-sync">
              <DashboardIcon name="signal" />
              Future Pi sync
            </span>
          </div>
          <div className="dashboard-device-grid">
            {data.deviceStatus.slots.map((slot) => (
              <article className={`dashboard-device-card dashboard-device-card--${slot.status}`} key={slot.id}>
                <div className="dashboard-device-card-header">
                  <span>{slot.label}</span>
                  <strong>{slot.statusLabel}</strong>
                </div>
                <h3>{slot.medicationName}</h3>
                <div className="dashboard-device-metrics">
                  <div>
                    <span>Pills</span>
                    <strong>{slot.pillCount}</strong>
                  </div>
                  <div>
                    <span>Dispenser</span>
                    <strong>{slot.dispenserStatusText}</strong>
                  </div>
                </div>
                <p>{slot.syncText}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section dashboard-progress-section">
          <div className="dashboard-progress-heading">
            <div>
              <h2>Weekly Progress</h2>
              <p>{isLoading ? "Syncing your progress..." : "Synced with your medication history."}</p>
            </div>
          </div>
          <ChartLine weeklyProgress={data.weeklyProgress} weeklyScore={data.weeklyScore} />
        </section>

        <section className="dashboard-tip-card">
          <span className="dashboard-tip-icon" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M9 21h6" />
              <path d="M10 17h4" />
              <path d="M8 14a6 6 0 1 1 8 0c-1.1.9-1.7 1.8-1.9 3H9.9C9.7 15.8 9.1 14.9 8 14Z" />
            </svg>
          </span>
          <div>
            <h2>{data.healthTip.title}</h2>
            <strong>{data.healthTip.headline}</strong>
            <p>{data.healthTip.body}</p>
          </div>
          <div className="dashboard-tip-art" aria-hidden>
            <span />
            <span />
          </div>
        </section>

        <section className="dashboard-section dashboard-actions-section">
          <h2>Quick Actions</h2>
          <div className="dashboard-actions-grid">
            {quickActions.map((action) => (
              <button className="dashboard-action-card" type="button" key={action.id}>
                <DashboardIcon name={action.icon} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <nav className="dashboard-bottom-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <button
              className={item.active ? "dashboard-nav-item dashboard-nav-item--active" : "dashboard-nav-item"}
              type="button"
              key={item.id}
            >
              <DashboardIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
