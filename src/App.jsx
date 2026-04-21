import { useLayoutEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginView from "./views/LoginView";
import DashboardView from "./views/DashboardView";
import HealthGoalsView from "./views/HealthGoalsView";
import CaregiverView from "./views/CaregiverView";

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
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
