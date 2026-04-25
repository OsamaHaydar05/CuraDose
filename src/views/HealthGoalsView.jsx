import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveHealthGoals } from "../presenters/HealthGoalsPresenter";
import { getCurrentSession } from "../services/authService";
import { savePendingHealthGoals } from "../services/onboardingService";
import "../styles/HealthGoalsView.css";
import "../styles/LoginView.css";

const routineRatings = [
  { id: "hard", emoji: "😟", label: "Very Hard" },
  { id: "challenging", emoji: "😕", label: "Challenging" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "easy", emoji: "😊", label: "Very Easy" },
];

const mainGoals = [
  { id: "dose", icon: "🕐", label: "Never Miss\na Dose" },
  { id: "habit", icon: "💊", label: "Build a\nHealthy Habit" },
  { id: "safe", icon: "🛡", label: "Stay Safe &\nIndependent" },
];

export default function HealthGoalsView() {
  const navigate = useNavigate();
  const [rating, setRating] = useState("okay");
  const [selectedGoals, setSelectedGoals] = useState(["dose"]);
  const [confidence, setConfidence] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState(null);

  const sliderPercent = useMemo(() => ((confidence - 1) / 9) * 100, [confidence]);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (isMounted) {
          setHasSession(Boolean(session));
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleGoal = (goalId) => {
    setSelectedGoals((previous) => {
      if (previous.includes(goalId)) {
        return previous.filter((item) => item !== goalId);
      }

      if (previous.length >= 3) {
        return previous;
      }

      return [...previous, goalId];
    });
  };

  const handleContinue = async () => {
    setError("");
    setIsSaving(true);

    try {
      const healthGoals = { rating, goals: selectedGoals, confidence };

      if (hasSession === false) {
        savePendingHealthGoals(healthGoals);
        navigate("/login", {
          state: {
            afterLoginPath: "/create-account/caregiver",
            authMessage: "Please log in to finish saving your health goals.",
          },
        });
        return;
      }

      await saveHealthGoals(rating, selectedGoals, confidence);
      navigate("/create-account/caregiver");
    } catch (err) {
      setError(err.message || "Unable to save your goals right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="login-page">
      <section className="hg-page">
        <header className="reg-header">
          <button
            className="reg-back-btn"
            type="button"
            onClick={() => navigate("/create-account")}
            aria-label="Back"
          >
            &lt;
          </button>
          <span className="reg-header-title">Create Account</span>
        </header>

        <section className="hg-hero">
          <h1 className="hg-hero-title">
            <span>Your </span>
            <span className="hg-hero-accent">Health &amp; Goals</span>
          </h1>
          <p className="hg-hero-subtitle">Help us personalize CuraDose for you.</p>
        </section>

        <section className="reg-stepper" aria-label="Registration progress">
          <article className="reg-step reg-step--done">
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
          <article className="reg-step reg-step--active">
            <span className="reg-step-circle">2</span>
            <span className="reg-step-label">Health &amp; Goals</span>
          </article>
          <article className="reg-step">
            <span className="reg-step-circle">3</span>
            <span className="reg-step-label">Caregiver (Optional)</span>
          </article>
        </section>

        <section className="hg-card">
          <header className="hg-card-header">
            <span className="hg-card-icon" aria-hidden>
              ♡
            </span>
            <div>
              <h2>How would you rate your medication routine today?</h2>
              <p>This helps us understand where you're starting from.</p>
            </div>
          </header>

          <div className="hg-rating-row">
            {routineRatings.map((item) => {
              const isActive = rating === item.id;
              return (
                <button
                  key={item.id}
                  className={`hg-rating-btn ${isActive ? "hg-rating-btn--active" : ""}`}
                  type="button"
                  onClick={() => setRating(item.id)}
                >
                  <span className="hg-rating-emoji">{item.emoji}</span>
                  <span className="hg-rating-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="hg-card hg-card--muted">
          <header className="hg-card-header">
            <span className="hg-card-icon" aria-hidden>
              🎯
            </span>
            <div className="hg-goal-heading">
              <div>
                <h2>What's your main goal?</h2>
                <p>You can choose more than one.</p>
              </div>
              <span className="hg-goal-hint">Select up to 3</span>
            </div>
          </header>

          <div className="hg-goal-grid">
            {mainGoals.map((goal) => {
              const isActive = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  className={`hg-goal-tile ${isActive ? "hg-goal-tile--active" : ""}`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <span className={`hg-goal-check ${isActive ? "hg-goal-check--active" : ""}`}>
                    {isActive ? "✓" : ""}
                  </span>
                  <span className="hg-goal-tile-icon" aria-hidden>
                    {goal.icon}
                  </span>
                  <span className="hg-goal-tile-label">
                    {goal.label.split("\n").map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="hg-card">
          <header className="hg-card-header">
            <span className="hg-card-icon" aria-hidden>
              🚩
            </span>
            <div>
              <h2>How confident do you feel about managing your medication?</h2>
              <p>We'll help you every step of the way.</p>
            </div>
          </header>

          <div className="hg-slider-wrap" style={{ "--slider-fill": `${sliderPercent}%` }}>
            <span className="hg-slider-badge" style={{ left: `${sliderPercent}%` }}>
              {confidence}
            </span>
            <input
              className="hg-slider"
              type="range"
              min="1"
              max="10"
              value={confidence}
              onChange={(event) => setConfidence(Number(event.target.value))}
            />
          </div>

          <div className="hg-slider-labels">
            <span>
              Not Confident
              <br />1
            </span>
            <span>
              Very Confident
              <br />10
            </span>
          </div>
        </section>

        <section className="hg-card hg-card--muted">
          <header className="hg-card-header">
            <span className="hg-card-icon" aria-hidden>
              📈
            </span>
            <div>
              <h2>Why This Matters</h2>
            </div>
          </header>

          <div className="hg-why-body">
            <p className="hg-why-copy">
              Setting goals increases success. Users who set a goal are{" "}
              <strong className="hg-highlight">2.5x more likely</strong> to stick to their treatment.
            </p>

            <div className="hg-chart" aria-hidden>
              <span className="hg-chart-badge">2.5X</span>
              <svg viewBox="0 0 180 95">
                <polygon points="20,70 80,62 148,35 148,80 20,80" className="hg-chart-area" />
                <polyline points="20,70 80,62 148,35" className="hg-chart-line" />
                <circle cx="20" cy="70" r="4" className="hg-chart-dot" />
                <circle cx="80" cy="62" r="4" className="hg-chart-dot" />
                <circle cx="148" cy="35" r="5" className="hg-chart-dot hg-chart-dot--peak" />
                <text x="14" y="92">No Goal Set</text>
                <text x="126" y="92">Goal Set</text>
              </svg>
            </div>
          </div>
        </section>

        {error ? <p className="auth-error">{error}</p> : null}

        <footer className="hg-footer">
          <button
            className="btn-primary"
            type="button"
            onClick={handleContinue}
            disabled={isSaving || hasSession === null}
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
          <p className="hg-footer-caption">You can always update your goals later.</p>
        </footer>
      </section>
    </main>
  );
}
