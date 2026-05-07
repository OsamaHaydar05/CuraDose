export default function PillsView({ medications, setMedications, onSave }) {
  const updateMed = (i, field, value) => {
    setMedications((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m))
    );
  };

  return (
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
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontSize: 14,
                  }}
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
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontSize: 14,
                  }}
                />
              </label>
            </div>
          </div>
        ))}

        <button onClick={onSave} className="btn btn--primary">
          Save Medications
        </button>
      </div>
    </section>
  );
}
