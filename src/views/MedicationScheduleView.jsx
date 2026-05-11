import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ACCESS_MODE,
  READ_ONLY_MESSAGE,
  addMedication,
  editMedication,
  formatScheduleTimeForDisplay,
  formatScheduleTimesForDisplay,
  loadMedicationSchedule,
  removeMedication,
  scheduleTimesForDraft,
  timeFieldLabelsForFrequency,
} from "../presenters/MedicationPresenter";
import "../styles/DashboardView.css";
import "../styles/MedicationScheduleView.css";

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "Weekly",
  "As needed",
];

const EMPTY_DRAFT = {
  name: "",
  dosage: "",
  scheduleTime: "",
  scheduleTimes: [""],
  frequency: FREQUENCY_OPTIONS[0],
  instructions: "",
};
const MAX_SCHEDULED_MEDICATIONS = 2;
const SCHEDULE_LIMIT_MESSAGE = "CuraDose has two compartments. Remove a medication before adding another.";

function ScheduleIcon({ name }) {
  const commonProps = {
    className: "med-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (name === "back") {
    return (
      <svg {...commonProps}>
        <path d="m14 6-6 6 6 6" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...commonProps}>
        <path d="M14 4l6 6-11 11H3v-6L14 4Z" />
        <path d="M13 5l6 6" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...commonProps}>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M6 7l1 13h10l1-13" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
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

  if (name === "clock") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  }

  if (name === "capsule") {
    return (
      <svg {...commonProps}>
        <path d="M7.4 16.6 16.6 7.4a4 4 0 0 1 5.7 5.7l-9.2 9.2a4 4 0 1 1-5.7-5.7Z" />
        <path d="m12 12 4 4" />
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

  return null;
}

function MedicationCard({ medication, canWrite, onEdit, onDelete, onReadOnlyAttempt, isDeleting }) {
  const scheduledTimes = medication.schedule_times?.length ? medication.schedule_times : [medication.schedule_time].filter(Boolean);

  return (
    <article className="med-card" aria-label={medication.name}>
      <div className="med-card-icon">
        <ScheduleIcon name="capsule" />
      </div>

      <div className="med-card-body">
        <div className="med-card-heading">
          <h3>{medication.name}</h3>
          {medication.dosage ? <span className="med-card-dosage">{medication.dosage}</span> : null}
        </div>

        <dl className="med-card-meta">
          <div>
            <dt>Times</dt>
            <dd>
              <ScheduleIcon name="clock" />
              {formatScheduleTimesForDisplay(scheduledTimes)}
            </dd>
          </div>
          <div>
            <dt>Frequency</dt>
            <dd>{medication.frequency || "Not set"}</dd>
          </div>
        </dl>

        {medication.instructions ? <p className="med-card-instructions">{medication.instructions}</p> : null}
      </div>

      <div className="med-card-actions">
        {canWrite ? (
          <>
            <button
              type="button"
              className="med-icon-button med-icon-button--ghost"
              onClick={() => onEdit(medication)}
              aria-label={`Edit ${medication.name}`}
              title="Edit"
            >
              <ScheduleIcon name="edit" />
            </button>
            <button
              type="button"
              className="med-icon-button med-icon-button--danger"
              onClick={() => onDelete(medication)}
              aria-label={`Delete ${medication.name}`}
              title="Delete"
              disabled={isDeleting}
            >
              <ScheduleIcon name="trash" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="med-icon-button med-icon-button--locked"
            onClick={onReadOnlyAttempt}
            aria-label="Read only"
            title={READ_ONLY_MESSAGE}
          >
            <ScheduleIcon name="lock" />
          </button>
        )}
      </div>
    </article>
  );
}

function MedicationFormModal({ open, draft, errors, isSaving, isEditing, onChange, onClose, onSubmit }) {
  if (!open) return null;

  const timeLabels = timeFieldLabelsForFrequency(draft.frequency);
  const visibleScheduleTimes = timeLabels.map((_, index) => draft.scheduleTimes?.[index] || "");
  const generatedScheduleTimes = scheduleTimesForDraft(draft);

  const updateFrequency = (frequency) => {
    const labels = timeFieldLabelsForFrequency(frequency);
    const scheduleTimes = labels.map((_, index) => draft.scheduleTimes?.[index] || "");
    onChange({
      ...draft,
      frequency,
      scheduleTime: scheduleTimes[0] || "",
      scheduleTimes,
    });
  };

  const updateScheduleTime = (index, value) => {
    const scheduleTimes = [...visibleScheduleTimes];
    scheduleTimes[index] = value;
    onChange({
      ...draft,
      scheduleTime: scheduleTimes[0] || "",
      scheduleTimes,
    });
  };

  return (
    <div className="med-modal-overlay" role="dialog" aria-modal="true" aria-label="Medication editor">
      <form
        className="med-modal"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <header className="med-modal-header">
          <h2>{isEditing ? "Edit Medication" : "Add Medication"}</h2>
          <button type="button" className="med-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <label className="med-field">
          <span>Name</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="e.g. Metformin"
            autoFocus
            required
          />
          {errors.name ? <small className="med-field-error">{errors.name}</small> : null}
        </label>

        <label className="med-field">
          <span>Pills per dose</span>
          <input
            type="text"
            value={draft.dosage}
            onChange={(event) => onChange({ ...draft, dosage: event.target.value })}
            placeholder="e.g. 1 pill"
          />
        </label>

        <div className="med-field-row">
          <label className="med-field">
            <span>Frequency</span>
            <select
              value={draft.frequency}
              onChange={(event) => updateFrequency(event.target.value)}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {timeLabels.length ? (
          <div className="med-time-grid">
            {timeLabels.map((label, index) => (
              <label className="med-field" key={label}>
                <span>{label}</span>
                <input
                  type="time"
                  value={visibleScheduleTimes[index] || ""}
                  onChange={(event) => updateScheduleTime(index, event.target.value)}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="med-time-note">No fixed reminder time is needed for as-needed medication.</p>
        )}
        {errors.scheduleTimes ? <small className="med-field-error">{errors.scheduleTimes}</small> : null}
        {generatedScheduleTimes.length > visibleScheduleTimes.filter(Boolean).length ? (
          <p className="med-time-note">
            Scheduled at {generatedScheduleTimes.map(formatScheduleTimeForDisplay).join(", ")}.
          </p>
        ) : null}

        <label className="med-field">
          <span>Instructions</span>
          <textarea
            value={draft.instructions}
            onChange={(event) => onChange({ ...draft, instructions: event.target.value })}
            placeholder="e.g. Take with food"
            rows={3}
          />
        </label>

        <footer className="med-modal-footer">
          <button type="button" className="med-button med-button--ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="med-button med-button--primary" disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Medication"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function MedicationScheduleView() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState({ mode: ACCESS_MODE.MANAGED, canWrite: false, readOnlyMessage: "" });
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editorState, setEditorState] = useState({ open: false, draft: EMPTY_DRAFT, editingId: null });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadSchedule = async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await loadMedicationSchedule();
      setUser(data.user);
      setAccess(data.access);
      setMedications(data.medications);
    } catch (err) {
      setError(err.message || "Unable to load your medication schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const sortedMedications = useMemo(() => {
    return [...medications].sort((a, b) => {
      if (a.schedule_time && b.schedule_time) {
        return a.schedule_time.localeCompare(b.schedule_time);
      }
      if (a.schedule_time) return -1;
      if (b.schedule_time) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [medications]);

  const handleOpenAdd = () => {
    if (!access.canWrite) {
      setFeedback(READ_ONLY_MESSAGE);
      return;
    }

    if (medications.length >= MAX_SCHEDULED_MEDICATIONS) {
      setFeedback(SCHEDULE_LIMIT_MESSAGE);
      return;
    }

    setFeedback("");
    setEditorState({ open: true, draft: EMPTY_DRAFT, editingId: null });
  };

  const handleOpenEdit = (medication) => {
    if (!access.canWrite) {
      setFeedback(READ_ONLY_MESSAGE);
      return;
    }

    setFeedback("");
    setEditorState({
      open: true,
      editingId: medication.id,
      draft: {
        name: medication.name || "",
        dosage: medication.dosage || "",
        scheduleTime: (medication.schedule_time || "").slice(0, 5),
        scheduleTimes: (medication.schedule_times?.length ? medication.schedule_times : [medication.schedule_time])
          .filter(Boolean)
          .map((time) => time.slice(0, 5)),
        frequency: medication.frequency || FREQUENCY_OPTIONS[0],
        instructions: medication.instructions || "",
      },
    });
  };

  const handleCloseEditor = () => {
    if (isSaving) return;
    setEditorState({ open: false, draft: EMPTY_DRAFT, editingId: null });
  };

  const handleDraftChange = (nextDraft) => {
    setEditorState((previous) => ({ ...previous, draft: nextDraft }));
  };

  const handleSubmitEditor = async () => {
    setError("");
    setFeedback("");
    setIsSaving(true);

    try {
      if (editorState.editingId) {
        await editMedication(access, editorState.editingId, editorState.draft);
        setFeedback("Medication updated.");
      } else {
        await addMedication(access, editorState.draft);
        setFeedback("Medication added.");
      }

      setEditorState({ open: false, draft: EMPTY_DRAFT, editingId: null });
      await loadSchedule();
    } catch (err) {
      setError(err.message || "Unable to save this medication.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (medication) => {
    if (!access.canWrite) {
      setFeedback(READ_ONLY_MESSAGE);
      return;
    }

    const confirmed = window.confirm(`Delete ${medication.name} from your schedule?`);
    if (!confirmed) return;

    setError("");
    setFeedback("");
    setDeletingId(medication.id);

    try {
      await removeMedication(access, medication.id);
      setFeedback(`${medication.name} removed.`);
      await loadSchedule();
    } catch (err) {
      setError(err.message || "Unable to delete this medication.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReadOnlyAttempt = () => {
    setFeedback(READ_ONLY_MESSAGE);
  };

  const errors = useMemo(() => {
    if (!editorState.open) return {};
    const draft = editorState.draft;
    const issues = {};
    if (!draft.name?.trim()) issues.name = "Name is required.";
    return issues;
  }, [editorState]);

  const isManaged = access.mode === ACCESS_MODE.MANAGED;
  const isCaregiver = access.mode === ACCESS_MODE.CAREGIVER;
  const isAtMedicationLimit = medications.length >= MAX_SCHEDULED_MEDICATIONS;

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell med-shell" aria-label="Medication schedule">
        <header className="med-header">
          <button
            type="button"
            className="med-back-button"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ScheduleIcon name="back" />
          </button>
          <div className="med-header-title">
            <span className="med-header-eyebrow">CuraDose</span>
            <h1>Medication Schedule</h1>
          </div>
          {access.canWrite ? (
            <button
              type="button"
              className="med-add-button"
              onClick={handleOpenAdd}
              aria-label="Add medication"
              title={isAtMedicationLimit ? SCHEDULE_LIMIT_MESSAGE : "Add medication"}
              disabled={isAtMedicationLimit}
            >
              <ScheduleIcon name="plus" />
              <span>Add</span>
            </button>
          ) : (
            <span className="med-readonly-pill" aria-label="Read only">
              <ScheduleIcon name="lock" />
              Read only
            </span>
          )}
        </header>

        {isManaged ? (
          <section className="med-banner med-banner--managed" role="status">
            <span className="med-banner-icon" aria-hidden>
              <ScheduleIcon name="users" />
            </span>
            <div>
              <strong>Managed by your caregiver</strong>
              <p>{READ_ONLY_MESSAGE}</p>
              {user?.caregiverEmail ? <small>Caregiver: {user.caregiverEmail}</small> : null}
            </div>
          </section>
        ) : null}

        {isCaregiver ? (
          <section className="med-banner med-banner--caregiver" role="status">
            <span className="med-banner-icon" aria-hidden>
              <ScheduleIcon name="users" />
            </span>
            <div>
              <strong>Caregiver mode</strong>
              <p>You have full write access to this medication schedule.</p>
            </div>
          </section>
        ) : null}

        {error ? <p className="dashboard-error" role="alert">{error}</p> : null}
        {feedback ? <p className="med-feedback" role="status">{feedback}</p> : null}
        {!isLoading && access.canWrite && isAtMedicationLimit ? (
          <section className="med-banner med-banner--limit" role="status">
            <span className="med-banner-icon" aria-hidden>
              <ScheduleIcon name="capsule" />
            </span>
            <div>
              <strong>Two compartments in use</strong>
              <p>Only two medications can be scheduled at a time because the lock box has two compartments.</p>
            </div>
          </section>
        ) : null}

        <section className="med-list-section" aria-label="Medications">
          {isLoading ? (
            <p className="med-empty-state">Loading your medications…</p>
          ) : sortedMedications.length === 0 ? (
            <article className="med-empty-state med-empty-state--card">
              <span className="med-empty-icon" aria-hidden>
                <ScheduleIcon name="capsule" />
              </span>
              <h2>No medications yet</h2>
              {access.canWrite ? (
                <>
                  <p>Add your first medication to start tracking your schedule.</p>
                  <button type="button" className="med-button med-button--primary" onClick={handleOpenAdd}>
                    <ScheduleIcon name="plus" />
                    Add Medication
                  </button>
                </>
              ) : (
                <p>{READ_ONLY_MESSAGE}</p>
              )}
            </article>
          ) : (
            <div className="med-list">
              {sortedMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  canWrite={access.canWrite}
                  isDeleting={deletingId === medication.id}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onReadOnlyAttempt={handleReadOnlyAttempt}
                />
              ))}
            </div>
          )}
        </section>
      </section>

      <MedicationFormModal
        open={editorState.open}
        draft={editorState.draft}
        errors={errors}
        isSaving={isSaving}
        isEditing={Boolean(editorState.editingId)}
        onChange={handleDraftChange}
        onClose={handleCloseEditor}
        onSubmit={handleSubmitEditor}
      />
    </main>
  );
}
