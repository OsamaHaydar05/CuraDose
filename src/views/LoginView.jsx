import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, registerUser, validateRegistration } from "../presenters/LoginPresenter";
import { savePendingRegistration } from "../services/onboardingService";
import { isCaregiverRole, signOut } from "../services/authService";
import "../styles/LoginView.css";

const initialLoginState = { email: "", password: "" };
const initialRegisterState = { name: "", email: "", password: "", role: "patient" };
const initialCaregiverRegisterState = {
  name: "",
  email: "",
  password: "",
  role: "caregiver",
  caregiverType: "private",
  region: "",
  hospital: "",
  title: "",
};

export default function LoginView({ theme = "system", setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const getScreenFromPath = (pathname) => {
    if (pathname === "/create-account") return "register";
    if (pathname === "/login") return "login";
    if (pathname === "/caregiver/login") return "caregiver-login";
    if (pathname === "/caregiver/signup") return "caregiver-register";
    return "landing";
  };
  const [screen, setScreen] = useState(getScreenFromPath(location.pathname));
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [caregiverRegisterForm, setCaregiverRegisterForm] = useState(initialCaregiverRegisterState);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setScreen(getScreenFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (location.state?.authMessage) {
      setErrorMessage(location.state.authMessage);
    }
  }, [location.state]);

  const authTitle = useMemo(() => {
    if (screen === "caregiver-login") return "Caregiver Login";
    if (screen === "login") return "Log in to CuraDose";
    if (screen === "caregiver-register") return "Create Caregiver Account";
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
      const user = await loginUser(loginForm.email.trim(), loginForm.password);
      const isCaregiver = isCaregiverRole(user.role);

      if (screen === "caregiver-login" && !isCaregiver) {
        await signOut();
        throw new Error("This is a patient account. Please use the patient login.");
      }

      const fallbackPath = isCaregiver ? "/caregiver/dashboard" : "/dashboard";
      navigate(location.state?.afterLoginPath || fallbackPath);
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
      const pendingRegistration = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        role: registerForm.role,
      };

      validateRegistration(
        pendingRegistration.name,
        pendingRegistration.email,
        pendingRegistration.password,
        pendingRegistration.role
      );
      savePendingRegistration(pendingRegistration);
      navigate("/create-account/health-goals");
    } catch (error) {
      setErrorMessage(error.message || "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitCaregiverRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const formData = {
        name: caregiverRegisterForm.name.trim(),
        email: caregiverRegisterForm.email.trim(),
        password: caregiverRegisterForm.password,
        role: "caregiver",
        caregiverType: caregiverRegisterForm.caregiverType,
        region: caregiverRegisterForm.region.trim(),
        hospital: caregiverRegisterForm.hospital.trim(),
        title: caregiverRegisterForm.title.trim(),
      };

      validateRegistration(formData.name, formData.email, formData.password, formData.role);

      if (formData.caregiverType === "professional") {
        if (!formData.region || !formData.hospital || !formData.title) {
          throw new Error("Please complete region, hospital/clinic, and title.");
        }
      }

      const user = await registerUser(formData.name, formData.email, formData.password, formData.role, {
        caregiverType: formData.caregiverType,
        region: formData.region,
        hospital: formData.hospital,
        title: formData.title,
      });

      navigate("/caregiver/login", {
        state: {
          authMessage: user.emailVerificationRequired
            ? "Check your email to verify your caregiver account, then log in here."
            : "Caregiver account created. You can log in here.",
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to create caregiver account.");
    } finally {
      setIsLoading(false);
    }
  };

  if (screen === "landing") {
    return (
      <main className="login-page lp-landing">
        <div className="lp-shell">
          <header className="lp-navbar">
            <div className="lp-navbar-brand">
              <div className="brand-pill-icon lp-brand-icon" aria-hidden>
                💊
              </div>
              <div className="lp-brand-text-block">
                <p className="brand-name lp-brand-title">CuraDose</p>
                <p className="lp-brand-tagline">Smart Medication, Better Health</p>
              </div>
            </div>
            <div className="lp-navbar-actions">
              <button
                  className="btn-outline lp-btn-nav lp-btn-nav-outline"
                  type="button"
                  onClick={() => navigate("/product")}
              >
                About CuraDose
              </button>

              <div className="lp-nav-dropdown">
                <button
                    className="btn-outline lp-btn-nav lp-btn-nav-outline"
                    type="button"
                >
                  Log In
                </button>
                <div className="lp-nav-dropdown-menu">
                  <button type="button" onClick={() => navigate("/login")}>
                    User
                  </button>
                  <button type="button" onClick={() => navigate("/caregiver/login")}>
                    Caregiver
                  </button>
                </div>
              </div>

              <div className="lp-nav-dropdown">
                <button className="btn-primary lp-btn-nav" type="button">
                  Create Account
                </button>
                <div className="lp-nav-dropdown-menu">
                  <button type="button" onClick={() => navigate("/create-account")}>
                    User
                  </button>
                  <button type="button" onClick={() => navigate("/caregiver/signup")}>
                    Caregiver
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div
            className="lp-theme-toggle"
            role="group"
            aria-label="Color theme"
          >
            {["light", "dark", "system"].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`lp-theme-option ${theme === mode ? "lp-theme-option--active" : ""}`}
                onClick={() => setTheme?.(mode)}
              >
                {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
              </button>
            ))}
          </div>

          <section className="lp-hero" aria-label="Introduction">
            <div className="lp-hero-copy">
              <div className="lp-badge">
                <span className="lp-badge-dot" aria-hidden />
                <span>Built for better medication adherence</span>
              </div>
              <h1 className="lp-hero-heading">
                <span className="lp-hero-line lp-hero-line--navy">Smart Medication.</span>
                <span className="lp-hero-line lp-hero-line--accent">Better Health.</span>
              </h1>
              <p className="lp-hero-subtitle" id="how-it-works">
                CuraDose helps users manage their medication routine with reminders, progress
                tracking, refill visibility, and optional caregiver support.
              </p>
              <div className="lp-cta-row">
                <button
                  className="btn-primary lp-cta-primary"
                  type="button"
                  onClick={() => navigate("/create-account")}
                >
                  Get Started
                </button>
                <button
                  className="btn-outline lp-cta-secondary"
                  type="button"
                  onClick={() => navigate("/caregiver/signup")}
                >
                  Join as Caregiver
                </button>
              </div>
              <div className="lp-stat-row" id="features">
                <article className="lp-stat-card">
                  <p className="lp-stat-value">87%</p>
                  <p className="lp-stat-label">Adherence Rate</p>
                </article>
                <article className="lp-stat-card">
                  <p className="lp-stat-value">1.2K</p>
                  <p className="lp-stat-label">Reminders Sent</p>
                </article>
                <article className="lp-stat-card">
                  <p className="lp-stat-value">320+</p>
                  <p className="lp-stat-label">Active Caregivers</p>
                </article>
              </div>
            </div>

            <div className="lp-hero-preview" id="caregiver">
              <div className="lp-preview-card">
                <div className="lp-preview-header">
                  <div>
                    <p className="lp-preview-greeting">Good morning, Emma 👋</p>
                    <p className="lp-preview-sub">Stay on track. You&apos;ve got this!</p>
                  </div>
                  <div className="lp-preview-streak" aria-hidden>
                    <span className="lp-preview-streak-icon">🔥</span>
                    <span className="lp-preview-streak-text">12 days</span>
                  </div>
                </div>
                <div className="lp-preview-dose">
                  <p className="lp-preview-dose-label">
                    <span className="lp-preview-dose-clock" aria-hidden>
                      🕐
                    </span>{" "}
                    NEXT DOSE
                  </p>
                  <p className="lp-preview-dose-name">Atorvastatin</p>
                  <p className="lp-preview-dose-meta">1 pill</p>
                  <p className="lp-preview-dose-time">Today, 10:00 AM</p>
                  <span className="lp-preview-dose-status">Auto tracked</span>
                </div>
                <div className="lp-preview-tiles">
                  <div className="lp-preview-tile">
                    <span className="lp-preview-tile-icon" aria-hidden>
                      💊
                    </span>
                    <p className="lp-preview-tile-title">Today&apos;s Medications</p>
                    <p className="lp-preview-tile-stat">2 / 3 Completed</p>
                  </div>
                  <div className="lp-preview-tile">
                    <span className="lp-preview-tile-icon" aria-hidden>
                      📦
                    </span>
                    <p className="lp-preview-tile-title">Remaining Pills</p>
                    <p className="lp-preview-tile-stat">14 · Refill in 6 days</p>
                  </div>
                  <div className="lp-preview-tile">
                    <span className="lp-preview-tile-icon" aria-hidden>
                      🤝
                    </span>
                    <p className="lp-preview-tile-title">Caregiver Status</p>
                    <p className="lp-preview-tile-stat">Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <p className="lp-terms">By continuing, you agree to CuraDose Terms of Service.</p>
        </div>
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
                <rect x="72" y="22" width="16" height="9" rx="4.5" fill="#1a5f8a" />
                <circle cx="80" cy="26.5" r="2.7" fill="#e3eef8" />
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

            {false ? (
              <>
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

              </>
            ) : null}

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <footer className="reg-footer">
              <button className="btn-primary reg-continue-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Continuing..." : "Continue"}
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

  if (screen === "caregiver-register") {
    return (
      <main className="login-page">
        <section className="reg-page">
          <header className="reg-header">
            <button className="reg-back-btn" type="button" onClick={backToLanding} aria-label="Back">
              &lt;
            </button>
            <span className="reg-header-title">Caregiver Sign Up</span>
          </header>

          <section className="reg-hero">
            <div>
              <h1 className="reg-hero-title">
                <span>Support with </span>
                <span className="reg-hero-title-accent">Care.</span>
              </h1>
              <p className="reg-hero-subtitle">
                Create a caregiver account and connect with a patient when access is approved.
              </p>
            </div>
          </section>

          <form className="reg-form" onSubmit={submitCaregiverRegister}>
            <article className="reg-card">
              <header className="reg-card-header">
                <span className="reg-card-icon" aria-hidden>
                  CG
                </span>
                <div>
                  <h2>Caregiver Information</h2>
                  <p>Tell us who you are as a caregiver.</p>
                </div>
              </header>

              <div className="reg-input-row">
                <label className="reg-input-wrap" htmlFor="caregiver-name">
                  <span className="reg-input-icon" aria-hidden>
                    ID
                  </span>
                  <input
                    id="caregiver-name"
                    className="reg-input"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={caregiverRegisterForm.name}
                    onChange={handleInputChange(setCaregiverRegisterForm)}
                    required
                  />
                </label>

                <label className="reg-input-wrap" htmlFor="caregiver-email">
                  <span className="reg-input-icon" aria-hidden>
                    @
                  </span>
                  <input
                    id="caregiver-email"
                    className="reg-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    value={caregiverRegisterForm.email}
                    onChange={handleInputChange(setCaregiverRegisterForm)}
                    required
                  />
                </label>
              </div>

              <label className="reg-input-wrap reg-input-wrap--full" htmlFor="caregiver-password">
                <span className="reg-input-icon" aria-hidden>
                  PW
                </span>
                <input
                  id="caregiver-password"
                  className="reg-input reg-input--password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create Password"
                  value={caregiverRegisterForm.password}
                  onChange={handleInputChange(setCaregiverRegisterForm)}
                  required
                />
                <button
                  className="reg-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </label>

              <p className="reg-helper-text">
                Use 8+ characters with a mix of letters, numbers &amp; symbols.
              </p>
            </article>

            <article className="reg-card reg-card--blue">
              <header className="reg-card-header">
                <span className="reg-card-icon" aria-hidden>
                  +
                </span>
                <div>
                  <h2>Caregiver Type</h2>
                  <p>Select whether this is a private or professional caregiver account.</p>
                </div>
              </header>

              <label className="input-label" htmlFor="caregiver-type">
                Type
              </label>
              <select
                id="caregiver-type"
                className="input-control"
                name="caregiverType"
                value={caregiverRegisterForm.caregiverType}
                onChange={handleInputChange(setCaregiverRegisterForm)}
              >
                <option value="private">Private Caregiver</option>
                <option value="professional">Professional Caregiver</option>
              </select>

              {caregiverRegisterForm.caregiverType === "professional" ? (
                <>
                  <div className="reg-input-row reg-input-row--spaced">
                    <label className="reg-input-wrap" htmlFor="caregiver-region">
                      <span className="reg-input-icon" aria-hidden>
                        R
                      </span>
                      <input
                        id="caregiver-region"
                        className="reg-input"
                        name="region"
                        type="text"
                        placeholder="Region"
                        value={caregiverRegisterForm.region}
                        onChange={handleInputChange(setCaregiverRegisterForm)}
                        required
                      />
                    </label>

                    <label className="reg-input-wrap" htmlFor="caregiver-hospital">
                      <span className="reg-input-icon" aria-hidden>
                        H
                      </span>
                      <input
                        id="caregiver-hospital"
                        className="reg-input"
                        name="hospital"
                        type="text"
                        placeholder="Hospital / Clinic"
                        value={caregiverRegisterForm.hospital}
                        onChange={handleInputChange(setCaregiverRegisterForm)}
                        required
                      />
                    </label>
                  </div>

                  <label className="reg-input-wrap reg-input-wrap--full" htmlFor="caregiver-title">
                    <span className="reg-input-icon" aria-hidden>
                      T
                    </span>
                    <input
                      id="caregiver-title"
                      className="reg-input"
                      name="title"
                      type="text"
                      placeholder="Title / Profession"
                      value={caregiverRegisterForm.title}
                      onChange={handleInputChange(setCaregiverRegisterForm)}
                      required
                    />
                  </label>
                </>
              ) : (
                <p className="reg-helper-text caregiver-type-note">
                  Private caregivers can connect later through an invitation or approved patient access.
                </p>
              )}
            </article>

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <footer className="reg-footer">
              <button className="btn-primary reg-continue-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Caregiver Account"}
              </button>
              <p className="reg-login-copy">
                Already have an account?{" "}
                <button
                  className="reg-login-link"
                  type="button"
                  onClick={() => navigate("/caregiver/login")}
                >
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
              {isLoading ? "Signing in..." : screen === "caregiver-login" ? "Caregiver Login" : "Log In"}
            </button>

            <p className="reg-login-copy">
              {screen === "caregiver-login" ? "No caregiver account yet?" : "Need an account?"}{" "}
              <button
                className="reg-login-link"
                type="button"
                onClick={() =>
                  navigate(screen === "caregiver-login" ? "/caregiver/signup" : "/create-account")
                }
              >
                {screen === "caregiver-login" ? "Create Caregiver Account" : "Create Account"}
              </button>
            </p>
          </form>
        </article>
      </section>
    </main>
  );
}
