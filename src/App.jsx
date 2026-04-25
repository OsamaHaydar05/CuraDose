import { useEffect, useLayoutEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginView from "./views/LoginView";
import DashboardView from "./views/DashboardView";
import HealthGoalsView from "./views/HealthGoalsView";
import CaregiverView from "./views/CaregiverView";
import { getCurrentSession } from "./services/authService";

const THEME_STORAGE_KEY = "curadose-theme";

function readStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    if (t === "light" || t === "dark" || t === "system") return t;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolveTheme(mode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (isMounted) {
          setAuthState(session ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthState("anonymous");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (authState === "checking") {
    return (
      <main className="dashboard-placeholder">
        <section className="dashboard-placeholder__inner">
          <h1 className="dashboard-placeholder__title">Loading dashboard</h1>
          <p className="dashboard-placeholder__subtitle">Checking your session.</p>
        </section>
      </main>
    );
  }

  if (authState === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          afterLoginPath: location.pathname,
          authMessage: "Please log in to view your dashboard.",
        }}
      />
    );
  }

  return children;
}

export default function App() {
  const [theme, setTheme] = useState(readStoredTheme);

  useLayoutEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }

    const apply = () => {
      document.documentElement.setAttribute("data-theme", resolveTheme(theme));
    };

    apply();

    if (theme !== "system") return undefined;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginView theme={theme} setTheme={setTheme} />} />
        <Route path="/login" element={<LoginView theme={theme} setTheme={setTheme} />} />
        <Route path="/create-account" element={<LoginView theme={theme} setTheme={setTheme} />} />
        <Route path="/create-account/health-goals" element={<HealthGoalsView />} />
        <Route path="/create-account/caregiver" element={<CaregiverView />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
