import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "../services/authService";
import {
  acceptCaregiverInvite,
  createCaregiverInvite,
  declineCaregiverInvite,
  getCaregiverConnections,
} from "../services/caregiverService";
import "../styles/SettingsView.css";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function SettingsIcon({ name }) {
  const commonProps = {
    className: "settings-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

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

  if (name === "wifi") {
    return (
      <svg {...commonProps}>
        <path d="M4 18h.01" />
        <path d="M8 18a4 4 0 0 1 8 0" />
        <path d="M5 12a10 10 0 0 1 14 0" />
        <path d="M2 7a15 15 0 0 1 20 0" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 3.1h5l.3-3.1a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
    </svg>
  );
}

export default function SettingsView({ theme = "system", setTheme }) {
  const navigate = useNavigate();
  const [dashboardPath, setDashboardPath] = useState("/dashboard");
  const [role, setRole] = useState("patient");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverInvites, setCaregiverInvites] = useState([]);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [isSavingConnection, setIsSavingConnection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettingsData() {
      try {
        const user = await getCurrentUser();
        const connections = await getCaregiverConnections();

        if (!isMounted) return;

        const userRole = connections.role || user?.user_metadata?.role || "patient";
        setRole(userRole);
        setCaregiverInvites(connections.invites);
        setDashboardPath(userRole === "caregiver" || userRole === "family" ? "/caregiver/dashboard" : "/dashboard");
      } catch {
        if (isMounted) setDashboardPath("/dashboard");
      }
    }

    loadSettingsData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshConnections = async () => {
    const connections = await getCaregiverConnections();
    setRole(connections.role);
    setCaregiverInvites(connections.invites);
    setDashboardPath(connections.role === "caregiver" || connections.role === "family" ? "/caregiver/dashboard" : "/dashboard");
  };

  const handleCaregiverInvite = async (event) => {
    event.preventDefault();
    setConnectionMessage("");
    setConnectionError("");
    setIsSavingConnection(true);

    try {
      await createCaregiverInvite(caregiverEmail);
      setCaregiverEmail("");
      setConnectionMessage("Caregiver invite sent. They can accept it from their caregiver dashboard.");
      await refreshConnections();
    } catch (error) {
      setConnectionError(error.message || "Unable to send caregiver invite.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleConnectionResponse = async (inviteId, status) => {
    setConnectionMessage("");
    setConnectionError("");
    setIsSavingConnection(true);

    try {
      if (status === "accepted") {
        await acceptCaregiverInvite(inviteId);
      } else {
        await declineCaregiverInvite(inviteId);
      }

      setConnectionMessage(status === "accepted" ? "Caregiver connected." : "Connection request declined.");
      await refreshConnections();
    } catch (error) {
      setConnectionError(error.message || "Unable to update the connection.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <main className="settings-page">
      <section className="settings-shell" aria-label="Settings">
        <header className="settings-header">
          <div>
            <span>CuraDose</span>
            <h1>Settings</h1>
          </div>
          <Link to={dashboardPath}>Dashboard</Link>
        </header>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-card-icon">
              <SettingsIcon name="theme" />
            </span>
            <div>
              <h2>Appearance</h2>
              <p>Choose how CuraDose looks on this device.</p>
            </div>
          </div>
          <div className="settings-theme-control" role="group" aria-label="Color theme">
            {themeOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={theme === option.value ? "settings-theme-option settings-theme-option--active" : "settings-theme-option"}
                onClick={() => setTheme?.(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-card-icon">
              <SettingsIcon name="bell" />
            </span>
            <div>
              <h2>Notifications</h2>
              <p>Dose reminders are managed from the dashboard reminder card.</p>
            </div>
          </div>
          <Link className="settings-action-link" to={dashboardPath}>Open reminders</Link>
        </section>

        {role === "patient" ? (
          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-card-icon">
                <SettingsIcon name="lock" />
              </span>
              <div>
                <h2>Caregiver Access</h2>
                <p>Invite someone you trust, or approve a caregiver who requested access.</p>
              </div>
            </div>

            <form className="settings-connection-form" onSubmit={handleCaregiverInvite}>
              <label htmlFor="caregiver-invite-email">Caregiver email</label>
              <div>
                <input
                  id="caregiver-invite-email"
                  type="email"
                  placeholder="caregiver@example.com"
                  value={caregiverEmail}
                  onChange={(event) => setCaregiverEmail(event.target.value)}
                  required
                />
                <button type="submit" disabled={isSavingConnection}>
                  {isSavingConnection ? "Sending..." : "Invite"}
                </button>
              </div>
            </form>

            {connectionMessage ? <p className="settings-success">{connectionMessage}</p> : null}
            {connectionError ? <p className="settings-error" role="alert">{connectionError}</p> : null}

            <div className="settings-connection-list" aria-label="Caregiver connections">
              {caregiverInvites.length ? (
                caregiverInvites.map((invite) => (
                  <article key={invite.id} className="settings-connection-row">
                    <div>
                      <strong>{invite.caregiver_email}</strong>
                      <span>
                        {invite.status === "accepted"
                          ? "Connected"
                          : invite.requested_by === "caregiver"
                            ? "Wants access to your account"
                            : "Invite pending"}
                      </span>
                    </div>
                    {invite.status === "pending" && invite.requested_by === "caregiver" ? (
                      <div className="settings-connection-actions">
                        <button
                          type="button"
                          onClick={() => handleConnectionResponse(invite.id, "accepted")}
                          disabled={isSavingConnection}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConnectionResponse(invite.id, "declined")}
                          disabled={isSavingConnection}
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <em>{invite.status}</em>
                    )}
                  </article>
                ))
              ) : (
                <p className="settings-empty">No caregiver connections yet.</p>
              )}
            </div>
          </section>
        ) : null}

        <section className="settings-list" aria-label="Device settings">
          <article>
            <SettingsIcon name="lock" />
            <div>
              <strong>Auto-lock</strong>
              <span>Enabled</span>
            </div>
          </article>
          <article>
            <SettingsIcon name="wifi" />
            <div>
              <strong>Pi connection</strong>
              <span>Connected</span>
            </div>
          </article>
        </section>

        <button type="button" className="settings-logout" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}
