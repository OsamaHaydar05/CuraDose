import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [screen, setScreen] = useState("landing");
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    setScreen("landing");
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
      await registerUser(
        registerForm.name.trim(),
        registerForm.email.trim(),
        registerForm.password,
        registerForm.role
      );
      navigate("/dashboard");
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
            <button className="btn-primary" type="button" onClick={() => setScreen("login")}>
              Log In
            </button>
            <button className="btn-outline" type="button" onClick={() => setScreen("register")}>
              Create Account
            </button>
            <p className="terms-copy">By continuing, you agree to CuraDose Terms of Service.</p>
          </div>
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
