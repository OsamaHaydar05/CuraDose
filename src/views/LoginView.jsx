import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, signupUser, validateRegistration } from "../presenters/LoginPresenter";
import { savePendingRegistration } from "../services/onboardingService";
import "../styles/LoginView.css";

const initialLoginState = { email: "", password: "" };

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  role: "patient",
};

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
      await loginUser(loginForm.email.trim(), loginForm.password);
      navigate(location.state?.afterLoginPath || "/dashboard");
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

      await signupUser(formData);
      navigate("/dashboard");
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
                <div className="lp-nav-dropdown">
                  <button className="btn-outline lp-btn-nav lp-btn-nav-outline" type="button">
                    Login
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
                    Sign Up
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

            <div className="lp-theme-toggle" role="group" aria-label="Color theme">
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
                    <p className="lp-preview-dose-meta">20 mg · 1 tablet</p>
                    <p className="lp-preview-dose-time">Today, 10:00 AM</p>
                    <button className="lp-preview-dose-btn" type="button">
                      Take Dose
                    </button>
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

  if (screen === "register" || screen === "caregiver-register") {
    const isCaregiverRegister = screen === "caregiver-register";

    return (
        <main className="login-page">
          <section className="reg-page">
            <header className="reg-header">
              <button className="reg-back-btn" type="button" onClick={backToLanding} aria-label="Back">
                &lt;
              </button>
              <span className="reg-header-title">
              {isCaregiverRegister ? "Caregiver Sign Up" : "Create Account"}
            </span>
            </header>

            <section className="reg-hero">
              <div>
                <h1 className="reg-hero-title">
                  {isCaregiverRegister ? (
                      <>
                        <span>Support with </span>
                        <span className="reg-hero-title-accent">Care.</span>
                      </>
                  ) : (
                      <>
                        <span>Let&apos;s Get </span>
                        <span className="reg-hero-title-accent">Started!</span>
                      </>
                  )}
                </h1>
                <p className="reg-hero-subtitle">
                  {isCaregiverRegister
                      ? "Create a caregiver account and connect with a patient when access is approved."
                      : "Join CuraDose and take control of your medication journey."}
                </p>
              </div>


            </section>

            <form
                className="reg-form"
                onSubmit={isCaregiverRegister ? submitCaregiverRegister : submitRegister}
            >
              <article className="reg-card">
                <header className="reg-card-header">
                <span className="reg-card-icon" aria-hidden>
                  {isCaregiverRegister ? "👥" : "👤"}
                </span>
                  <div>
                    <h2>{isCaregiverRegister ? "Caregiver Information" : "Personal Information"}</h2>
                    <p>
                      {isCaregiverRegister
                          ? "Tell us who you are as a caregiver."
                          : "Tell us a bit about yourself."}
                    </p>
                  </div>
                </header>

                <div className="reg-input-row">
                  <label className="reg-input-wrap" htmlFor={isCaregiverRegister ? "caregiver-name" : "name"}>
                  <span className="reg-input-icon" aria-hidden>
                    👤
                  </span>
                    <input
                        id={isCaregiverRegister ? "caregiver-name" : "name"}
                        className="reg-input"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Full Name"
                        value={isCaregiverRegister ? caregiverRegisterForm.name : registerForm.name}
                        onChange={handleInputChange(
                            isCaregiverRegister ? setCaregiverRegisterForm : setRegisterForm
                        )}
                        required
                    />
                  </label>

                  <label
                      className="reg-input-wrap"
                      htmlFor={isCaregiverRegister ? "caregiver-email" : "register-email"}
                  >
                  <span className="reg-input-icon" aria-hidden>
                    ✉
                  </span>
                    <input
                        id={isCaregiverRegister ? "caregiver-email" : "register-email"}
                        className="reg-input"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email Address"
                        value={isCaregiverRegister ? caregiverRegisterForm.email : registerForm.email}
                        onChange={handleInputChange(
                            isCaregiverRegister ? setCaregiverRegisterForm : setRegisterForm
                        )}
                        required
                    />
                  </label>
                </div>

                <label
                    className="reg-input-wrap reg-input-wrap--full"
                    htmlFor={isCaregiverRegister ? "caregiver-password" : "register-password"}
                >
                <span className="reg-input-icon" aria-hidden>
                  🔒
                </span>
                  <input
                      id={isCaregiverRegister ? "caregiver-password" : "register-password"}
                      className="reg-input reg-input--password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create Password"
                      value={isCaregiverRegister ? caregiverRegisterForm.password : registerForm.password}
                      onChange={handleInputChange(
                          isCaregiverRegister ? setCaregiverRegisterForm : setRegisterForm
                      )}
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

              {isCaregiverRegister ? (
                  <article className="reg-card reg-card--blue">
                    <header className="reg-card-header">
                  <span className="reg-card-icon" aria-hidden>
                    🤝
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
                          📍
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
                          🏥
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
                        🪪
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
              ) : null}

              {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

              <footer className="reg-footer">
                <button className="btn-primary reg-continue-btn" type="submit" disabled={isLoading}>
                  {isLoading
                      ? isCaregiverRegister
                          ? "Creating account..."
                          : "Continuing..."
                      : isCaregiverRegister
                          ? "Create Caregiver Account"
                          : "Continue"}
                </button>
                <p className="reg-login-copy">
                  Already have an account?{" "}
                  <button
                      className="reg-login-link"
                      type="button"
                      onClick={() => navigate(isCaregiverRegister ? "/caregiver/login" : "/login")}
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