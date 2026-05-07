import { Bell, Lock, Wifi } from "lucide-react";

const settings = [
  { label: "Notifications", icon: Bell, value: "Enabled" },
  { label: "Auto-lock", icon: Lock, value: "5 min" },
  { label: "Wi-Fi", icon: Wifi, value: "Connected" },
];

export default function SettingsView() {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Settings</h2>
      </div>

      <ul className="history">
        {settings.map((s, i) => {
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
  );
}
