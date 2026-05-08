import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "../services/authService";
import "../styles/CaregiverDashboardView.css";

const navItems = ["Overview", "Patients", "Alerts", "Settings"];

const patients = [
  {
    id: 1,
    name: "Anna Karlsson",
    initials: "AK",
    status: "On track",
    tone: "success",
    nextDose: "20:00",
    adherence: 92,
    lastActivity: "Pill taken - 08:05",
  },
  {
    id: 2,
    name: "Erik Lindgren",
    initials: "EL",
    status: "Missed dose",
    tone: "warn",
    nextDose: "12:00",
    adherence: 74,
    lastActivity: "Reminder sent - 07:58",
  },
  {
    id: 3,
    name: "Maria Sjoberg",
    initials: "MS",
    status: "On track",
    tone: "success",
    nextDose: "21:30",
    adherence: 88,
    lastActivity: "Box opened - Yesterday",
  },
];

const alerts = [
  { time: "09:12", label: "Erik Lindgren missed morning dose", tone: "warn" },
  { time: "08:00", label: "Anna Karlsson took morning dose", tone: "success" },
  { time: "07:30", label: "Maria Sjoberg box refilled", tone: "success" },
  { time: "Yesterday", label: "Erik Lindgren low adherence trend", tone: "warn" },
];

function CareIcon({ name }) {
  const commonProps = {
    className: "care-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (name === "heart") {
    return (
      <svg {...commonProps}>
        <path d="M20.4 5.8a5 5 0 0 0-7.1 0L12 7.1l-1.3-1.3a5 5 0 1 0-7.1 7.1l8.4 8.4 8.4-8.4a5 5 0 0 0 0-7.1Z" />
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

  if (name === "bell") {
    return (
      <svg {...commonProps}>
        <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
        <path d="M10 21h4" />
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

  if (name === "logout") {
    return (
      <svg {...commonProps}>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M8 12h10" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </svg>
  );
}

function toneLabel(tone) {
  return tone === "warn" ? "Needs attention" : "On track";
}

export default function CaregiverDashboardView() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Overview");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0].id);
  const [caregiverName, setCaregiverName] = useState("Caregiver");
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) || patients[0];
  const onTrackCount = patients.filter((patient) => patient.tone === "success").length;
  const needsAttentionCount = patients.filter((patient) => patient.tone === "warn").length;

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Caregiver";
        setCaregiverName(name);
      })
      .catch(() => {
        if (isMounted) setCaregiverName("Caregiver");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <main className="care-dashboard" aria-label="Caregiver dashboard">
      <aside className="care-sidebar">
        <div className="care-brand">
          <span className="care-brand-icon">
            <CareIcon name="heart" />
          </span>
          <div>
            <strong>CuraDose</strong>
            <span>Caregiver Portal</span>
          </div>
        </div>

        <nav className="care-nav" aria-label="Caregiver sections">
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className={activeView === item ? "care-nav-item care-nav-item--active" : "care-nav-item"}
              onClick={() => setActiveView(item)}
            >
              <CareIcon name={item === "Patients" ? "users" : item === "Alerts" ? "bell" : item === "Settings" ? "settings" : "heart"} />
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="care-live-card">
          <span className="care-live-dot" />
          Live monitoring
          <strong>{patients.length} patients connected</strong>
        </div>
      </aside>

      <section className="care-main">
        <header className="care-header">
          <div>
            <span>{activeView === "Overview" ? "Welcome back" : activeView}</span>
            <h1>{activeView === "Overview" ? `Hello, ${caregiverName}` : activeView}</h1>
          </div>
          <div className="care-header-actions">
            <Link className="care-link-button" to="/profile">Profile</Link>
            <Link className="care-link-button" to="/settings">Settings</Link>
            <button type="button" className="care-icon-button" onClick={handleLogout} aria-label="Log out">
              <CareIcon name="logout" />
            </button>
          </div>
        </header>

        {activeView === "Overview" ? (
          <div className="care-stack">
            <section className="care-stats" aria-label="Caregiver overview">
              <article className="care-card">
                <span>Patients</span>
                <strong>{patients.length}</strong>
                <p>Currently monitored</p>
              </article>
              <article className="care-card">
                <span>On Track</span>
                <strong>{onTrackCount}</strong>
                <p>Following schedule</p>
              </article>
              <article className="care-card care-card--warn">
                <span>Needs Attention</span>
                <strong>{needsAttentionCount}</strong>
                <p>Missed or delayed doses</p>
              </article>
            </section>

            <section className="care-panel">
              <div className="care-panel-head">
                <h2>Patients</h2>
                <button type="button" onClick={() => setActiveView("Patients")}>Manage</button>
              </div>
              <div className="care-patient-list">
                {patients.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    className="care-patient-row"
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setActiveView("Patients");
                    }}
                  >
                    <span className="care-avatar">{patient.initials}</span>
                    <span>
                      <strong>{patient.name}</strong>
                      <small>Next dose - {patient.nextDose}</small>
                    </span>
                    <em className={`care-pill care-pill--${patient.tone}`}>{patient.status}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="care-panel">
              <div className="care-panel-head">
                <h2>Recent Alerts</h2>
                <span>Last 24h</span>
              </div>
              <ul className="care-alert-list">
                {alerts.map((alert) => (
                  <li key={`${alert.time}-${alert.label}`}>
                    <span className={`care-alert-dot care-alert-dot--${alert.tone}`} />
                    <p>{alert.label}</p>
                    <time>{alert.time}</time>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {activeView === "Patients" ? (
          <div className="care-stack">
            <section className="care-panel">
              <div className="care-panel-head">
                <h2>Select a Patient</h2>
                <span>{patients.length} total</span>
              </div>
              <div className="care-patient-list">
                {patients.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    className={patient.id === selectedPatientId ? "care-patient-row care-patient-row--active" : "care-patient-row"}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <span className="care-avatar">{patient.initials}</span>
                    <span>
                      <strong>{patient.name}</strong>
                      <small>Adherence - {patient.adherence}%</small>
                    </span>
                    <em className={`care-pill care-pill--${patient.tone}`}>{patient.status}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="care-panel">
              <div className="care-panel-head">
                <h2>{selectedPatient.name}</h2>
                <em className={`care-pill care-pill--${selectedPatient.tone}`}>{toneLabel(selectedPatient.tone)}</em>
              </div>
              <div className="care-stats">
                <article className="care-card">
                  <span>Next Dose</span>
                  <strong>{selectedPatient.nextDose}</strong>
                  <p>Scheduled today</p>
                </article>
                <article className="care-card">
                  <span>Adherence</span>
                  <strong>{selectedPatient.adherence}%</strong>
                  <p>Last 30 days</p>
                </article>
                <article className="care-card">
                  <span>Last Activity</span>
                  <strong className="care-card-small">{selectedPatient.lastActivity}</strong>
                  <p>Latest patient update</p>
                </article>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "Alerts" ? (
          <section className="care-panel">
            <div className="care-panel-head">
              <h2>All Alerts</h2>
              <span>{alerts.length} items</span>
            </div>
            <ul className="care-alert-list">
              {alerts.map((alert) => (
                <li key={`${alert.time}-${alert.label}`}>
                  <span className={`care-alert-dot care-alert-dot--${alert.tone}`} />
                  <p>{alert.label}</p>
                  <em className={`care-pill care-pill--${alert.tone}`}>{alert.time}</em>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {activeView === "Settings" ? (
          <section className="care-panel">
            <div className="care-panel-head">
              <h2>Settings</h2>
              <Link to="/settings">Open full settings</Link>
            </div>
            <ul className="care-alert-list">
              <li><span className="care-alert-dot care-alert-dot--success" /><p>Alert notifications</p><time>Enabled</time></li>
              <li><span className="care-alert-dot care-alert-dot--success" /><p>Patient privacy</p><time>Strict</time></li>
              <li><span className="care-alert-dot care-alert-dot--success" /><p>Connection</p><time>Connected</time></li>
            </ul>
          </section>
        ) : null}
      </section>
    </main>
  );
}
