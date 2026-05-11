import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "../services/authService";
import {
  acceptCaregiverInvite,
  disconnectPatientConnection,
  declineCaregiverInvite,
  requestPatientConnection,
} from "../services/caregiverService";
import { getCaregiverDashboardData } from "../services/caregiverDashboardService";
import { supabase } from "../services/supabaseConfig";
import "../styles/CaregiverDashboardView.css";

const navItems = ["Overview", "Patients", "Alerts", "Settings"];

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
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [caregiverName, setCaregiverName] = useState("Caregiver");
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [patientEmail, setPatientEmail] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [isSavingConnection, setIsSavingConnection] = useState(false);
  const [summary, setSummary] = useState({ onTrackCount: 0, needsAttentionCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) || patients[0] || null;
  const onTrackCount = summary.onTrackCount;
  const needsAttentionCount = summary.needsAttentionCount;

  const loadDashboard = async () => {
    setError("");

    try {
      const data = await getCaregiverDashboardData();
      setCaregiverName(data.caregiverName);
      setPatients(data.patients);
      setAlerts(data.alerts);
      setPendingInvites(data.pendingInvites || []);
      setSentRequests(data.sentRequests || []);
      setSummary({
        onTrackCount: data.onTrackCount,
        needsAttentionCount: data.needsAttentionCount,
      });
      setSelectedPatientId((currentId) => {
        if (data.patients.some((patient) => patient.id === currentId)) return currentId;
        return data.patients[0]?.id || null;
      });
    } catch (err) {
      setError(err.message || "Unable to load caregiver dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let refreshTimer = null;

    const refreshDashboard = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadDashboard, 250);
    };

    loadDashboard();

    const refreshInterval = window.setInterval(loadDashboard, 15 * 1000);
    const channel = supabase
      .channel("caregiver-dashboard-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "caregiver_invites" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "dose_logs" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "device_slots" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "medications" }, refreshDashboard)
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!connectionMessage && !connectionError) return undefined;

    const clearTimer = window.setTimeout(() => {
      setConnectionMessage("");
      setConnectionError("");
    }, 3500);

    return () => window.clearTimeout(clearTimer);
  }, [connectionMessage, connectionError]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handlePatientRequest = async (event) => {
    event.preventDefault();
    setConnectionMessage("");
    setConnectionError("");
    setIsSavingConnection(true);

    try {
      await requestPatientConnection(patientEmail);
      setPatientEmail("");
      setConnectionMessage("Patient request sent. The patient can approve it in Settings.");
      await loadDashboard();
    } catch (err) {
      setConnectionError(err.message || "Unable to request patient access.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleInviteResponse = async (inviteId, status) => {
    setConnectionMessage("");
    setConnectionError("");
    setIsSavingConnection(true);

    try {
      if (status === "accepted") {
        await acceptCaregiverInvite(inviteId);
      } else {
        await declineCaregiverInvite(inviteId);
      }

      setConnectionMessage(status === "accepted" ? "Patient connected." : "Invite declined.");
      await loadDashboard();
    } catch (err) {
      setConnectionError(err.message || "Unable to update the invite.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleDisconnectPatient = async (patient) => {
    if (!patient?.connectionId) {
      setConnectionError("No caregiver connection was found for this patient.");
      return;
    }

    const confirmed = window.confirm(`Disconnect from ${patient.name}? You will no longer see their patient data.`);
    if (!confirmed) return;

    setConnectionMessage("");
    setConnectionError("");
    setIsSavingConnection(true);

    try {
      await disconnectPatientConnection(patient.connectionId);
      setConnectionMessage(`${patient.name} was disconnected.`);
      await loadDashboard();
    } catch (err) {
      setConnectionError(err.message || "Unable to disconnect this patient.");
    } finally {
      setIsSavingConnection(false);
    }
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

        {error ? <p className="care-error" role="alert">{error}</p> : null}

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
                {patients.length ? (
                  patients.map((patient) => (
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
                        <small>Next dose - {patient.nextDose} | {patient.remainingPills} pills left</small>
                      </span>
                      <em className={`care-pill care-pill--${patient.tone}`}>{patient.status}</em>
                    </button>
                  ))
                ) : (
                  <p className="care-empty-state">
                    {isLoading ? "Loading patients..." : "No accepted patient invites yet."}
                  </p>
                )}
              </div>
            </section>

            {pendingInvites.length || sentRequests.length ? (
              <section className="care-panel">
                <div className="care-panel-head">
                  <h2>Connection Requests</h2>
                  <span>{pendingInvites.length + sentRequests.length} pending</span>
                </div>
                <div className="care-connection-list">
                  {pendingInvites.map((invite) => (
                    <article className="care-connection-row" key={invite.id}>
                      <span className="care-avatar">{invite.initials}</span>
                      <div>
                        <strong>{invite.patientName}</strong>
                        <small>{invite.patientEmail || "Patient invited you"}</small>
                      </div>
                      <div className="care-connection-actions">
                        <button
                          type="button"
                          onClick={() => handleInviteResponse(invite.id, "accepted")}
                          disabled={isSavingConnection}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInviteResponse(invite.id, "declined")}
                          disabled={isSavingConnection}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ))}
                  {sentRequests.map((request) => (
                    <article className="care-connection-row" key={request.id}>
                      <span className="care-avatar">{request.initials}</span>
                      <div>
                        <strong>{request.patientName}</strong>
                        <small>{request.patientEmail || "Waiting for patient approval"}</small>
                      </div>
                      <em className="care-pill care-pill--muted">Pending</em>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="care-panel">
              <div className="care-panel-head">
                <h2>Recent Alerts</h2>
                <span>Last 24h</span>
              </div>
              <ul className="care-alert-list">
                {alerts.length ? (
                  alerts.map((alert) => (
                    <li key={alert.id}>
                      <span className={`care-alert-dot care-alert-dot--${alert.tone}`} />
                      <p>{alert.label}</p>
                      <time>{alert.time}</time>
                    </li>
                  ))
                ) : (
                  <li className="care-empty-row">No recent alerts.</li>
                )}
              </ul>
            </section>
          </div>
        ) : null}

        {activeView === "Patients" ? (
          <div className="care-stack">
            <section className="care-panel">
              <div className="care-panel-head">
                <h2>Add a Patient</h2>
                <span>Patient approval required</span>
              </div>
              <form className="care-connection-form" onSubmit={handlePatientRequest}>
                <label htmlFor="patient-request-email">Patient email</label>
                <div>
                  <input
                    id="patient-request-email"
                    type="email"
                    placeholder="patient@example.com"
                    value={patientEmail}
                    onChange={(event) => setPatientEmail(event.target.value)}
                    required
                  />
                  <button type="submit" disabled={isSavingConnection}>
                    {isSavingConnection ? "Sending..." : "Request access"}
                  </button>
                </div>
              </form>
              {connectionMessage ? <p className="care-success">{connectionMessage}</p> : null}
              {connectionError ? <p className="care-error" role="alert">{connectionError}</p> : null}
            </section>

            {pendingInvites.length || sentRequests.length ? (
              <section className="care-panel">
                <div className="care-panel-head">
                  <h2>Pending Connections</h2>
                  <span>{pendingInvites.length + sentRequests.length} total</span>
                </div>
                <div className="care-connection-list">
                  {pendingInvites.map((invite) => (
                    <article className="care-connection-row" key={invite.id}>
                      <span className="care-avatar">{invite.initials}</span>
                      <div>
                        <strong>{invite.patientName}</strong>
                        <small>Invited you to connect</small>
                      </div>
                      <div className="care-connection-actions">
                        <button
                          type="button"
                          onClick={() => handleInviteResponse(invite.id, "accepted")}
                          disabled={isSavingConnection}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInviteResponse(invite.id, "declined")}
                          disabled={isSavingConnection}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ))}
                  {sentRequests.map((request) => (
                    <article className="care-connection-row" key={request.id}>
                      <span className="care-avatar">{request.initials}</span>
                      <div>
                        <strong>{request.patientName}</strong>
                        <small>{request.patientEmail || "Waiting for patient approval"}</small>
                      </div>
                      <em className="care-pill care-pill--muted">Pending</em>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="care-panel">
              <div className="care-panel-head">
                <h2>Select a Patient</h2>
                <span>{patients.length} total</span>
              </div>
              <div className="care-patient-list">
                {patients.length ? (
                  patients.map((patient) => (
                    <button
                      type="button"
                      key={patient.id}
                      className={patient.id === selectedPatientId ? "care-patient-row care-patient-row--active" : "care-patient-row"}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <span className="care-avatar">{patient.initials}</span>
                      <span>
                        <strong>{patient.name}</strong>
                        <small>Adherence - {patient.adherence}% | {patient.remainingPills} pills left</small>
                      </span>
                      <em className={`care-pill care-pill--${patient.tone}`}>{patient.status}</em>
                    </button>
                  ))
                ) : (
                  <p className="care-empty-state">
                    {isLoading ? "Loading patients..." : "No accepted patient invites yet."}
                  </p>
                )}
              </div>
            </section>

            {selectedPatient ? (
              <section className="care-panel">
                <div className="care-panel-head">
                  <h2>{selectedPatient.name}</h2>
                  <div className="care-panel-actions">
                    <em className={`care-pill care-pill--${selectedPatient.tone}`}>{toneLabel(selectedPatient.tone)}</em>
                    <button
                      type="button"
                      className="care-schedule-button"
                      onClick={() => navigate(`/medications?patientId=${selectedPatient.id}`)}
                    >
                      Medication Schedule
                    </button>
                    <button
                      type="button"
                      className="care-danger-button"
                      onClick={() => handleDisconnectPatient(selectedPatient)}
                      disabled={isSavingConnection}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
                {connectionMessage ? <p className="care-success">{connectionMessage}</p> : null}
                {connectionError ? <p className="care-error" role="alert">{connectionError}</p> : null}
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
                    <span>Remaining Pills</span>
                    <strong>{selectedPatient.remainingPills}</strong>
                    <p>{selectedPatient.remainingPillsDetail}</p>
                  </article>
                  <article className="care-card">
                    <span>Last Activity</span>
                    <strong className="care-card-small">{selectedPatient.lastActivity}</strong>
                    <p>Latest patient update</p>
                  </article>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {activeView === "Alerts" ? (
          <section className="care-panel">
            <div className="care-panel-head">
              <h2>All Alerts</h2>
              <span>{alerts.length} items</span>
            </div>
            <ul className="care-alert-list">
              {alerts.length ? (
                alerts.map((alert) => (
                  <li key={alert.id}>
                    <span className={`care-alert-dot care-alert-dot--${alert.tone}`} />
                    <p>{alert.label}</p>
                    <em className={`care-pill care-pill--${alert.tone}`}>{alert.time}</em>
                  </li>
                ))
              ) : (
                <li className="care-empty-row">No alerts for connected patients.</li>
              )}
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
