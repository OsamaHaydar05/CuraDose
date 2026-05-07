import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Bell, ChevronRight, Clock, Home, Lock, LogOut,
  Pill, Power, Settings, ShieldCheck, User, Wifi,
} from "lucide-react";
import { signOut } from "../services/authService";
import "../styles/DashboardView.css";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Pills", icon: Pill },
  { label: "Profile", icon: User },
  { label: "Settings", icon: Settings },
];

const compartmentsBase = [
  { id: 1, name: "Morning Dose", status: "Taken", tone: "success" },
  { id: 2, name: "Evening Dose", status: "Locked", tone: "muted" },
];

const history = [
  { time: "08:05", label: "Pill removed", icon: Pill },
  { time: "08:00", label: "Box opened", icon: Power },
  { time: "07:58", label: "Reminder sent", icon: Bell },
  { time: "Yesterday", label: "Dose taken", icon: ShieldCheck },
];

export default function DashboardView({ userName = "test" }) {
  const navigate = useNavigate();
  const [boxOpen, setBoxOpen] = useState(false);
  const [activeView, setActiveView] = useState("Home");
  const [medications, setMedications] = useState([
    { name: "", weight: "" },
    { name: "", weight: "" },
  ]);

  const updateMed = (i, field, value) => {
    setMedications((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m))
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    navigate("/", { replace: true });
  };

  const inputStyle = {
    width: "100%",
    marginTop: 4,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
  };

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Pill size={20} />
          </div>
          <div className="brand-text">
            <p className="brand-title">CuraDose</p>
            <p className="brand-subtitle">Smart Medication</p>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeView === label;
            return (
              <button
                key={label}
                onClick={() => setActiveView(label)}
                className={`nav-item ${active ? "nav-item--active" : ""}`}
              >
                <Icon size={20} />
                <span className="nav-label">{label}</span>
                {active && <ChevronRight size={16} className="nav-chevron" />}
              </button>
            );
          })}
        </nav>

        <div className="device-status">
          <div className="device-status-row">
            <span className="dot dot--ping" />
            Device online
          </div>
          <p className="device-name">CuraDose · Unit 04</p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="header">
          <div>
            <p className="overline">
              {activeView === "Home" ? "Welcome back" : activeView}
            </p>
            <h1 className="title">
              {activeView === "Home"
                ? `Hello, ${userName}`
                : activeView === "Pills"
                ? "Your Medications"
                : activeView}
            </h1>
          </div>
          <div className="header-actions">
            <span className="badge">
              <Wifi size={14} /> Synced
            </span>
            <button className="btn btn--ghost" onClick={handleLogout}>
              <LogOut size={16} />
              <span className="btn-label">Log out</span>
            </button>
          </div>
        </header>

        {/* HOME */}
        {activeView === "Home" && (
          <div className="stack">
            <section className="cards">
              <article className="card">
                <div className="card-head">
                  <span className="card-label">Box Status</span>
                  <Lock size={16} className="muted-icon" />
                </div>
                <div className="card-status">
                  <span className={`dot ${boxOpen ? "dot--warn" : "dot--ok"}`} />
                  <p className="card-value">{boxOpen ? "Open" : "Closed"}</p>
                </div>
                <p className="card-meta">
                  {boxOpen ? "Compartments unlocked" : "Securely locked"}
                </p>
                <button
                  onClick={() => setBoxOpen(!boxOpen)}
                  className="btn btn--primary"
                >
                  <Power size={16} />
                  {boxOpen ? "Close Box" : "Open Box"}
                </button>
              </article>

              <article className="card">
                <div className="card-head">
                  <span className="card-label">Next Dose</span>
                  <Clock size={16} className="muted-icon" />
                </div>
                <p className="card-value">20:00</p>
                <p className="card-meta">Evening medication</p>
                <div className="progress">
                  <div className="progress-bar" style={{ width: "66%" }} />
                </div>
                <p className="card-meta">In about 4h 20m</p>
              </article>

              <article className="card">
                <div className="card-head">
                  <span className="card-label">Caregiver</span>
                  <ShieldCheck size={16} className="muted-icon" />
                </div>
                <p className="card-value">Connected</p>
                <p className="card-meta">Remote monitoring active</p>
                <div className="caregiver">
                  <div className="avatar">JD</div>
                  <div className="caregiver-info">
                    <p className="caregiver-name">Dr. Jane Doe</p>
                    <p className="card-meta">Online · 2m ago</p>
                  </div>
                </div>
              </article>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Compartments</h2>
                <button className="link" onClick={() => setActiveView("Pills")}>
                  Manage
                </button>
              </div>
              <div className="compartments">
                {compartmentsBase.map((c, idx) => {
                  const med = medications[idx];
                  return (
                    <div key={c.id} className="compartment">
                      <div className="compartment-num">{c.id}</div>
                      <div className="compartment-info">
                        <p className="compartment-name">{med?.name || c.name}</p>
                        <p className="card-meta">
                          {med?.weight ? `${med.weight} mg` : `Slot #${c.id}`}
                        </p>
                      </div>
                      <span className={`pill pill--${c.tone}`}>{c.status}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="panel-title-row">
                  <Activity size={16} className="primary-icon" />
                  <h2 className="panel-title">Activity Log</h2>
                </div>
                <span className="card-meta">Last 24h</span>
              </div>
              <ul className="history">
                {history.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li key={i} className="history-item">
                      <div className="history-icon">
                        <Icon size={16} />
                      </div>
                      <div className="history-row">
                        <p className="history-label">{item.label}</p>
                        <span className="card-meta">{item.time}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}

        {/* PILLS */}
        {activeView === "Pills" && (
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Configure Compartments</h2>
              <span className="card-meta">2 slots</span>
            </div>

            <div className="stack">
              {medications.map((med, i) => (
                <div
                  key={i}
                  className="compartment"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="compartment-num">{i + 1}</div>
                    <div className="compartment-info">
                      <p className="compartment-name">Compartment {i + 1}</p>
                      <p className="card-meta">
                        {i === 0 ? "Morning Dose" : "Evening Dose"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <label className="card-meta">
                      Medication name
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMed(i, "name", e.target.value)}
                        placeholder="e.g. Paracetamol"
                        style={inputStyle}
                      />
                    </label>
                    <label className="card-meta">
                      Weight (mg)
                      <input
                        type="number"
                        min="0"
                        value={med.weight}
                        onChange={(e) => updateMed(i, "weight", e.target.value)}
                        placeholder="e.g. 500"
                        style={inputStyle}
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setActiveView("Home")}
                className="btn btn--primary"
              >
                Save Medications
              </button>
            </div>
          </section>
        )}

        {/* PROFILE */}
        {activeView === "Profile" && (
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title-row">
                <User size={16} className="primary-icon" />
                <h2 className="panel-title">Profile</h2>
              </div>
            </div>
            <div className="caregiver">
              <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
              <div className="caregiver-info">
                <p className="caregiver-name">{userName}</p>
                <p className="card-meta">Patient · CuraDose Unit 04</p>
              </div>
            </div>
          </section>
        )}

        {/* SETTINGS */}
        {activeView === "Settings" && (
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Settings</h2>
            </div>
            <ul className="history">
              {[
                { label: "Notifications", icon: Bell, value: "Enabled" },
                { label: "Auto-lock", icon: Lock, value: "5 min" },
                { label: "Wi-Fi", icon: Wifi, value: "Connected" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={i} className="history-item">
                    <div className="history-icon">
                      <Icon size={16} />
                    </div>
                    <div className="history-row">
                      <p className="history-label">{s.label}</p>
                      <span className="card-meta">{s.value}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
