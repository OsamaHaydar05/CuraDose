import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Bell, ChevronRight, Clock, Heart, Home, Lock, LogOut,
  MessageCircle, Phone, Pill, ShieldCheck, User, Users, Settings, Wifi,
} from "lucide-react";
import { signOut } from "../services/authService";
import "../styles/DashboardView.css";

const navItems = [
  { label: "Overview", icon: Home },
  { label: "Patients", icon: Users },
  { label: "Alerts", icon: Bell },
  { label: "Settings", icon: Settings },
];

const patientsBase = [
  {
    id: 1,
    name: "Anna Karlsson",
    initials: "AK",
    status: "On track",
    tone: "success",
    nextDose: "20:00",
    adherence: 92,
    lastActivity: "Pill taken · 08:05",
  },
  {
    id: 2,
    name: "Erik Lindgren",
    initials: "EL",
    status: "Missed dose",
    tone: "warn",
    nextDose: "12:00",
    adherence: 74,
    lastActivity: "Reminder sent · 07:58",
  },
  {
    id: 3,
    name: "Maria Sjöberg",
    initials: "MS",
    status: "On track",
    tone: "success",
    nextDose: "21:30",
    adherence: 88,
    lastActivity: "Box opened · Yesterday",
  },
];

const alerts = [
  { time: "09:12", label: "Erik Lindgren missed morning dose", icon: Bell, tone: "warn" },
  { time: "08:00", label: "Anna Karlsson took morning dose", icon: ShieldCheck, tone: "success" },
  { time: "07:30", label: "Maria Sjöberg box refilled", icon: Pill, tone: "success" },
  { time: "Yesterday", label: "Erik Lindgren low adherence trend", icon: Activity, tone: "warn" },
];

export default function DashboardCareView({ caregiverName = "Caregiver" }) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Overview");
  const [selectedPatientId, setSelectedPatientId] = useState(patientsBase[0].id);

  const selectedPatient =
    patientsBase.find((p) => p.id === selectedPatientId) || patientsBase[0];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    navigate("/", { replace: true });
  };

  const onTrack = patientsBase.filter((p) => p.tone === "success").length;
  const needsAttention = patientsBase.filter((p) => p.tone === "warn").length;

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Heart size={20} />
          </div>
          <div className="brand-text">
            <p className="brand-title">CuraDose</p>
            <p className="brand-subtitle">Caregiver Portal</p>
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
            Live monitoring
          </div>
          <p className="device-name">{patientsBase.length} patients connected</p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="header">
          <div>
            <p className="overline">
              {activeView === "Overview" ? "Welcome back" : activeView}
            </p>
            <h1 className="title">
              {activeView === "Overview"
                ? `Hello, ${caregiverName}`
                : activeView === "Patients"
                ? "Your Patients"
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

        {/* OVERVIEW */}
        {activeView === "Overview" && (
          <div className="stack">
            <section className="cards">
              <article className="card">
                <div className="card-head">
                  <span className="card-label">Patients</span>
                  <Users size={16} className="muted-icon" />
                </div>
                <p className="card-value">{patientsBase.length}</p>
                <p className="card-meta">Currently monitored</p>
                <button
                  onClick={() => setActiveView("Patients")}
                  className="btn btn--primary"
                >
                  <Users size={16} />
                  View Patients
                </button>
              </article>

              <article className="card">
                <div className="card-head">
                  <span className="card-label">On Track</span>
                  <ShieldCheck size={16} className="muted-icon" />
                </div>
                <div className="card-status">
                  <span className="dot dot--ok" />
                  <p className="card-value">{onTrack}</p>
                </div>
                <p className="card-meta">Following schedule</p>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${(onTrack / patientsBase.length) * 100}%` }}
                  />
                </div>
              </article>

              <article className="card">
                <div className="card-head">
                  <span className="card-label">Needs Attention</span>
                  <Bell size={16} className="muted-icon" />
                </div>
                <div className="card-status">
                  <span className="dot dot--warn" />
                  <p className="card-value">{needsAttention}</p>
                </div>
                <p className="card-meta">Missed or delayed doses</p>
                <button
                  onClick={() => setActiveView("Alerts")}
                  className="btn btn--primary"
                >
                  <Bell size={16} />
                  Review Alerts
                </button>
              </article>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Patients</h2>
                <button className="link" onClick={() => setActiveView("Patients")}>
                  Manage
                </button>
              </div>
              <div className="compartments">
                {patientsBase.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setActiveView("Patients");
                    }}
                    className="compartment"
                    style={{ textAlign: "left", cursor: "pointer", border: "none" }}
                  >
                    <div className="avatar">{p.initials}</div>
                    <div className="compartment-info">
                      <p className="compartment-name">{p.name}</p>
                      <p className="card-meta">Next dose · {p.nextDose}</p>
                    </div>
                    <span className={`pill pill--${p.tone}`}>{p.status}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="panel-title-row">
                  <Activity size={16} className="primary-icon" />
                  <h2 className="panel-title">Recent Alerts</h2>
                </div>
                <span className="card-meta">Last 24h</span>
              </div>
              <ul className="history">
                {alerts.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <li key={i} className="history-item">
                      <div className="history-icon">
                        <Icon size={16} />
                      </div>
                      <div className="history-row">
                        <p className="history-label">{a.label}</p>
                        <span className="card-meta">{a.time}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}

        {/* PATIENTS */}
        {activeView === "Patients" && (
          <div className="stack">
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Select a patient</h2>
                <span className="card-meta">{patientsBase.length} total</span>
              </div>
              <div className="compartments">
                {patientsBase.map((p) => {
                  const active = p.id === selectedPatientId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className="compartment"
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                        border: active ? "2px solid #4f46e5" : "1px solid transparent",
                      }}
                    >
                      <div className="avatar">{p.initials}</div>
                      <div className="compartment-info">
                        <p className="compartment-name">{p.name}</p>
                        <p className="card-meta">Adherence · {p.adherence}%</p>
                      </div>
                      <span className={`pill pill--${p.tone}`}>{p.status}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="panel-title-row">
                  <User size={16} className="primary-icon" />
                  <h2 className="panel-title">{selectedPatient.name}</h2>
                </div>
                <span className={`pill pill--${selectedPatient.tone}`}>
                  {selectedPatient.status}
                </span>
              </div>

              <div className="cards">
                <article className="card">
                  <div className="card-head">
                    <span className="card-label">Next Dose</span>
                    <Clock size={16} className="muted-icon" />
                  </div>
                  <p className="card-value">{selectedPatient.nextDose}</p>
                  <p className="card-meta">Scheduled today</p>
                </article>

                <article className="card">
                  <div className="card-head">
                    <span className="card-label">Adherence</span>
                    <ShieldCheck size={16} className="muted-icon" />
                  </div>
                  <p className="card-value">{selectedPatient.adherence}%</p>
                  <p className="card-meta">Last 30 days</p>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${selectedPatient.adherence}%` }}
                    />
                  </div>
                </article>

                <article className="card">
                  <div className="card-head">
                    <span className="card-label">Last Activity</span>
                    <Activity size={16} className="muted-icon" />
                  </div>
                  <p className="card-value" style={{ fontSize: 16 }}>
                    {selectedPatient.lastActivity}
                  </p>
                  <div
                    style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
                  >
                    <button className="btn btn--ghost">
                      <MessageCircle size={16} />
                      <span className="btn-label">Message</span>
                    </button>
                    <button className="btn btn--ghost">
                      <Phone size={16} />
                      <span className="btn-label">Call</span>
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}

        {/* ALERTS */}
        {activeView === "Alerts" && (
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title-row">
                <Bell size={16} className="primary-icon" />
                <h2 className="panel-title">All Alerts</h2>
              </div>
              <span className="card-meta">{alerts.length} items</span>
            </div>
            <ul className="history">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={i} className="history-item">
                    <div className="history-icon">
                      <Icon size={16} />
                    </div>
                    <div className="history-row">
                      <p className="history-label">{a.label}</p>
                      <span className={`pill pill--${a.tone}`}>{a.time}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
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
                { label: "Alert notifications", icon: Bell, value: "Enabled" },
                { label: "Patient privacy", icon: Lock, value: "Strict" },
                { label: "Connection", icon: Wifi, value: "Connected" },
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

