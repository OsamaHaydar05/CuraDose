import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginView from "./views/LoginView";
import DashboardView from "./views/DashboardView";
import HealthGoalsView from "./views/HealthGoalsView";
import CaregiverView from "./views/CaregiverView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/create-account" element={<LoginView />} />
        <Route path="/create-account/health-goals" element={<HealthGoalsView />} />
        <Route path="/create-account/caregiver" element={<CaregiverView />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
