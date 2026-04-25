import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { inviteCaregiver } from "../presenters/CaregiverPresenter";
import "../styles/CaregiverView.css";
import "../styles/LoginView.css";

const permissions = [
  {
    icon: "🔔",
    label: "Medication Reminders",
    desc: "Get notified if you miss a dose",
  },
  {
    icon: "📈",
    label: "Progress Updates",
    desc: "See adherence & health trends",
  },
  {
    icon: "💊",
    label: "Inventory Alerts",
    desc: "Know when it's time to refill",
  },
];

export default function CaregiverView() {
  const navigate = useNavigate();
  const [inviteChoice, setInviteChoice] = useState("yes");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const normalizedEmail = inviteChoice === "yes" ? caregiverEmail.trim() : "";
      await inviteCaregiver(normalizedEmail);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to complete account setup right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="cg-page">
        <header className="reg-header">
          <button
            className="reg-back-btn"
            type="button"
            onClick={() => navigate("/create-account/health-goals")}
            aria-label="Back"
          >
            &lt;
          </button>
          <span className="reg-header-title">Create Account</span>
        </header>

        <section className="cg-hero">
          <h1 className="cg-hero-title">
            <span>Invite a </span>
            <span className="cg-hero-accent">Caregiver</span>
          </h1>
          <p className="cg-hero-subtitle">Stay connected. Get support.</p>
        </section>

        <section className="reg-stepper" aria-label="Registration progress">
          <article className="reg-step reg-step--done cg-step-muted">
            <span className="reg-step-circle">
              <svg viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M3 8.3l3 3L13 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="reg-step-label">Your Info</span>
          </article>
          <article className="reg-step reg-step--done cg-step-muted">
            <span className="reg-step-circle">
              <svg viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M3 8.3l3 3L13 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="reg-step-label">Health &amp; Goals</span>
          </article>
          <article className="reg-step reg-step--active">
            <span className="reg-step-circle">3</span>
            <span className="reg-step-label">Caregiver (Optional)</span>
          </article>
        </section>

        <section className="cg-banner">
          <div className="cg-banner-text">
            <h2>You don&apos;t have to do this alone.</h2>
            <p>A caregiver can help you stay on track and give you peace of mind.</p>
          </div>
          <div className="cg-banner-illustration" aria-hidden>
            <svg viewBox="0 0 180 120">
              <rect x="0" y="0" width="180" height="120" rx="12" fill="#dceee6" />
              <circle cx="58" cy="40" r="16" fill="#f5c9a7" />
              <path d="M38 48c7 14 28 14 35 0l-2 31H40z" fill="#1a4b6e" />
              <path d="M42 34c4-9 19-12 27-4 1 2 2 5 2 8-8-4-19-6-29-4z" fill="#5d3a2f" />
              <circle cx="111" cy="44" r="15" fill="#f5d9bf" />
              <path d="M95 51c6 13 24 13 31 0l-2 28H97z" fill="#9ea6af" />
              <path d="M99 36c4-7 17-9 24-2 2 2 3 4 3 8-8-4-17-5-27-4z" fill="#c8ccd2" />
              <path d="M49 72c16 20 47 20 63 0l11 34H39z" fill="#1a5f8a" opacity="0.78" />
              <path d="M139 20a10 10 0 0110 10c0 8-10 12-10 12s-10-4-10-12a10 10 0 0110-10z" fill="#1a5f8a" />
            </svg>
          </div>
        </section>

        <h2 className="cg-invite-label">Add a Caregiver?</h2>

        <section className="cg-invite-grid" aria-label="Caregiver preference">
          <button
            type="button"
            className={`cg-invite-tile ${inviteChoice === "yes" ? "cg-invite-tile--active" : ""}`}
            onClick={() => setInviteChoice("yes")}
          >
            <span className={`cg-invite-check ${inviteChoice === "yes" ? "cg-invite-check--active" : ""}`}>
              {inviteChoice === "yes" ? "✓" : ""}
            </span>
            <span className="cg-invite-icon" aria-hidden>
              👥
            </span>
            <p className="cg-invite-title">Yes, Invite a Caregiver</p>
            <p className="cg-invite-desc">They&apos;ll get updates and important notifications.</p>
          </button>

          <button
            type="button"
            className={`cg-invite-tile ${inviteChoice === "later" ? "cg-invite-tile--active" : ""}`}
            onClick={() => setInviteChoice("later")}
          >
            <span className="cg-invite-icon" aria-hidden>
              👤
            </span>
            <p className="cg-invite-title">I&apos;ll Do It Later</p>
            <p className="cg-invite-desc">You can always add one in your settings.</p>
          </button>
        </section>

        <section className={`cg-card ${inviteChoice !== "yes" ? "cg-card--faded" : ""}`}>
          <header className="cg-card-header">
            <span className="cg-card-icon" aria-hidden>
              ✉
            </span>
            <div>
              <h3>Caregiver&apos;s Email</h3>
              <p>We&apos;ll send them an invitation.</p>
            </div>
          </header>
          <label className="cg-email-input-wrap" htmlFor="caregiver-email">
            <span className="cg-email-icon" aria-hidden>
              ✉
            </span>
            <input
              id="caregiver-email"
              className="cg-email-input"
              type="email"
              placeholder="name@example.com"
              value={caregiverEmail}
              onChange={(event) => setCaregiverEmail(event.target.value)}
              disabled={inviteChoice !== "yes"}
            />
          </label>
        </section>

        <section className="cg-card">
          <header className="cg-card-header">
            <span className="cg-card-icon" aria-hidden>
              🛡
            </span>
            <div>
              <h3>What can they see?</h3>
              <p>You&apos;re always in control.</p>
            </div>
          </header>

          <div className="cg-perm-grid">
            {permissions.map((item) => (
              <article className="cg-perm-tile" key={item.label}>
                <span className="cg-perm-icon" aria-hidden>
                  {item.icon}
                </span>
                <p className="cg-perm-title">{item.label}</p>
                <p className="cg-perm-desc">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {error ? <p className="auth-error">{error}</p> : null}

        <footer className="cg-footer">
          <button className="cg-skip-link" type="button" onClick={() => navigate("/dashboard")}>
            Skip for Now
          </button>
          <button className="btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
          <p className="cg-security-caption">
            <span aria-hidden>🔒</span>
            Your information is secure and only shared with people you choose.
          </p>
        </footer>
      </section>
    </main>
  );
}
