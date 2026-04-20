import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../presenters/LoginPresenter";
import "../styles/LoginView.css";

const featureItems = [
  { icon: "⏰", label: "Timely Reminders" },
  { icon: "🔒", label: "Smart & Secure" },
  { icon: "🤝", label: "Caregiver Support" },
];

const initialLoginState = { email: "", password: "" };
const initialRegisterState = { name: "", email: "", password: "", role: "patient" };

export default function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const getScreenFromPath = (pathname) => {
    if (pathname === "/create-account") return "register";
    if (pathname === "/login") return "login";
    return "landing";
  };
  const [screen, setScreen] = useState(getScreenFromPath(location.pathname));
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [goal, setGoal] = useState("consistent");

  useEffect(() => {
    setScreen(getScreenFromPath(location.pathname));
  }, [location.pathname]);

  const authTitle = useMemo(() => {
    if (screen === "login") return "Log in to CuraDose";
    return "Create your CuraDose account";
  }, [screen]);

  const handleInputChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((previous) => ({ ...previous, [name]: value }));
  };

  const backToLanding = () => {
    setErrorMessage("");
    setIsLoading(false);
    navigate("/");
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await loginUser(loginForm.email.trim(), loginForm.password);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message || "Unable to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const selectedRole = goal === "caregiver" ? "caregiver" : registerForm.role;
      await registerUser(
        registerForm.name.trim(),
        registerForm.email.trim(),
        registerForm.password,
        selectedRole
      );
      navigate("/create-account/health-goals");
    } catch (error) {
      setErrorMessage(error.message || "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  if (screen === "landing") {
    return (
      <main className="login-page">
        <section className="login-shell">
          <header className="brand-row">
            <div className="brand-pill-icon" aria-hidden>
              💊
            </div>
            <p className="brand-name">CuraDose</p>
          </header>

          <div className="hero-content">
            <h1 className="hero-heading">
              <span>Smart Medication.</span>
              <span className="hero-heading-accent">Better Health.</span>
            </h1>
            <p className="hero-subtitle">
              Stay on track with real-time medication support from your smart IoT medicine box.
            </p>
          </div>

          <section className="device-card" aria-label="Smart medicine box preview">
            <img
              src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80"
              alt="Smart medicine organizer on a clean desk"
            />
          </section>

          <section className="feature-list" aria-label="CuraDose features">
            {featureItems.map((feature) => (
              <article className="feature-card" key={feature.label}>
                <span className="feature-icon" aria-hidden>
                  {feature.icon}
                </span>
                <span className="feature-label">{feature.label}</span>
              </article>
            ))}
          </section>

          <div className="cta-group">
            <button className="btn-primary" type="button" onClick={() => navigate("/login")}>
              Log In
            </button>
            <button
              className="btn-outline"
              type="button"
              onClick={() => navigate("/create-account")}
            >
              Create Account
            </button>
            <p className="terms-copy">By continuing, you agree to CuraDose Terms of Service.</p>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "register") {
    return (
      <main className="login-page">
        <section className="reg-page">
          <header className="reg-header">
            <button className="reg-back-btn" type="button" onClick={backToLanding} aria-label="Back">
              &lt;
            </button>
            <span className="reg-header-title">Create Account</span>
          </header>

          <section className="reg-hero">
            <div>
              <h1 className="reg-hero-title">
                <span>Let&apos;s Get </span>
                <span className="reg-hero-title-accent">Started!</span>
              </h1>
              <p className="reg-hero-subtitle">
                Join CuraDose and take control of your medication journey.
              </p>
            </div>
            <div className="reg-device-illustration" aria-hidden>
              <svg viewBox="0 0 160 120" role="img">
                <rect x="44" y="6" width="72" height="34" rx="4" fill="#f3f4f6" stroke="#27364a" />
                <text x="80" y="19" textAnchor="middle" fontSize="10" fill="#1f2937">
                  Welcome!
                </text>
                <rect x="72" y="22" width="16" height="9" rx="4.5" fill="#2a7a5c" />
                <circle cx="80" cy="26.5" r="2.7" fill="#d1fae5" />
                <rect x="17" y="42" width="126" height="62" rx="10" fill="#ffffff" stroke="#d1d5db" />
                <rect x="26" y="52" width="35" height="39" rx="6" fill="#f3f4f6" />
                <rect x="63" y="52" width="35" height="39" rx="6" fill="#f3f4f6" />
                <rect x="100" y="52" width="35" height="39" rx="6" fill="#f3f4f6" />
                <rect x="20" y="95" width="120" height="5" rx="2.5" fill="#fca5a5" />
              </svg>
            </div>
          </section>

          <section className="reg-stepper" aria-label="Registration progress">
            <article className="reg-step reg-step--active">
              <span className="reg-step-circle">1</span>
              <span className="reg-step-label">Your Info</span>
            </article>
            <article className="reg-step">
              <span className="reg-step-circle">2</span>
              <span className="reg-step-label">Health &amp; Goals</span>
            </article>
            <article className="reg-step">
              <span className="reg-step-circle">3</span>
              <span className="reg-step-label">Caregiver (Optional)</span>
            </article>
          </section>

          <form className="reg-form" onSubmit={submitRegister}>
            <article className="reg-card">
              <header className="reg-card-header">
                <span className="reg-card-icon" aria-hidden>
                  👤
                </span>
                <div>
                  <h2>Personal Information</h2>
                  <p>Tell us a bit about yourself.</p>
                </div>
              </header>

              <div className="reg-input-row">
                <label className="reg-input-wrap" htmlFor="name">
                  <span className="reg-input-icon" aria-hidden>
                    👤
                  </span>
                  <input
                    id="name"
                    className="reg-input"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={registerForm.name}
                    onChange={handleInputChange(setRegisterForm)}
                    required
                  />
                </label>
                <label className="reg-input-wrap" htmlFor="register-email">
                  <span className="reg-input-icon" aria-hidden>
                    ✉
                  </span>
                  <input
                    id="register-email"
                    className="reg-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    value={registerForm.email}
                    onChange={handleInputChange(setRegisterForm)}
                    required
                  />
                </label>
              </div>

              <label className="reg-input-wrap reg-input-wrap--full" htmlFor="register-password">
                <span className="reg-input-icon" aria-hidden>
                  🔒
                </span>
                <input
                  id="register-password"
                  className="reg-input reg-input--password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create Password"
                  value={registerForm.password}
                  onChange={handleInputChange(setRegisterForm)}
                  required
                />
                <button
                  className="reg-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁" : "🙈"}
                </button>
              </label>

              <p className="reg-helper-text">
                Use 8+ characters with a mix of letters, numbers &amp; symbols.
              </p>
            </article>

            <article className="reg-card reg-card--green">
              <header className="reg-card-header">
                <span className="reg-card-icon" aria-hidden>
                  🎯
                </span>
                <div>
                  <h2>Medication Goal</h2>
                  <p>What matters most to you?</p>
                </div>
              </header>
              <div className="reg-goal-body">
                <div className="reg-goal-ring" aria-hidden>
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" className="reg-goal-ring-bg" />
                    <circle cx="60" cy="60" r="45" className="reg-goal-ring-progress" />
                  </svg>
                  <div className="reg-goal-ring-label">
                    <strong>78%</strong>
                    <span>Better Health</span>
                  </div>
                </div>
                <div className="reg-goal-actions">
                  <button
                    type="button"
                    className={`reg-goal-btn ${goal === "consistent" ? "reg-goal-btn--active" : ""}`}
                    onClick={() => setGoal("consistent")}
                  >
                    <span aria-hidden>✅</span> Stay Consistent
                  </button>
                  <button
                    type="button"
                    className={`reg-goal-btn ${goal === "control" ? "reg-goal-btn--active" : ""}`}
                    onClick={() => setGoal("control")}
                  >
                    <span aria-hidden>🤍</span> Take Control of My Health
                  </button>
                  <button
                    type="button"
                    className={`reg-goal-btn ${goal === "caregiver" ? "reg-goal-btn--active" : ""}`}
                    onClick={() => setGoal("caregiver")}
                  >
                    <span aria-hidden>👥</span> Support from Caregiver
                  </button>
                </div>
              </div>
            </article>

            <article className="reg-card reg-card--blue">
              <header className="reg-card-header">
                <span className="reg-card-icon" aria-hidden>
                  📈
                </span>
                <div>
                  <h2>Did You Know?</h2>
                </div>
              </header>
              <div className="reg-dyk-body">
                <p className="reg-dyk-copy">
                  People who track their medication <strong>are 3x more likely</strong> to stick to
                  their treatment.
                </p>
                <div className="reg-dyk-chart" aria-hidden>
                  <span className="reg-dyk-badge">3X</span>
                  <svg viewBox="0 0 180 84">
                    <line x1="18" y1="62" x2="164" y2="62" className="reg-dyk-axis" />
                    <polyline points="30,54 88,44 146,28" className="reg-dyk-line" />
                    <circle cx="30" cy="54" r="5" className="reg-dyk-point" />
                    <circle cx="88" cy="44" r="5" className="reg-dyk-point" />
                    <circle cx="146" cy="28" r="6" className="reg-dyk-point reg-dyk-point--last" />
                    <text x="6" y="79">Without Tracking</text>
                    <text x="114" y="79">With CuraDose</text>
                  </svg>
                </div>
              </div>
            </article>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <footer className="reg-footer">
              <button className="btn-primary reg-continue-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Continue"}
              </button>
              <p className="reg-login-copy">
                Already have an account?{" "}
                <button className="reg-login-link" type="button" onClick={() => navigate("/login")}>
                  Log In
                </button>
              </p>
            </footer>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="auth-shell">
        <article className="auth-card">
          <button className="back-link" type="button" onClick={backToLanding}>
            ← Back
          </button>
          <h2 className="auth-title">{authTitle}</h2>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          {screen === "login" ? (
            <form className="auth-form" onSubmit={submitLogin}>
              <label className="input-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input-control"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={handleInputChange(setLoginForm)}
                required
              />

              <label className="input-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input-control"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={handleInputChange(setLoginForm)}
                required
              />

              <button className="btn-primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Log In"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitRegister}>
              <label className="input-label" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                className="input-control"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={registerForm.name}
                onChange={handleInputChange(setRegisterForm)}
                required
              />

              <label className="input-label" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                className="input-control"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={registerForm.email}
                onChange={handleInputChange(setRegisterForm)}
                required
              />

              <label className="input-label" htmlFor="register-password">
                Password
              </label>
              <input
                id="register-password"
                className="input-control"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={registerForm.password}
                onChange={handleInputChange(setRegisterForm)}
                required
              />

              <label className="input-label" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                className="input-control"
                name="role"
                value={registerForm.role}
                onChange={handleInputChange(setRegisterForm)}
              >
                <option value="patient">Patient</option>
                <option value="caregiver">Caregiver</option>
                <option value="family">Family Member</option>
              </select>

              <button className="btn-primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </article>
      </section>
    </main>
  );
}
