// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Templates from './pages/Templates';
import Reports from './pages/Reports';
import AiGenerator from './pages/AiGenerator';
import Multiplayer from './pages/Multiplayer';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="practice"     element={<Practice />} />
          <Route path="templates"    element={<Templates />} />
          <Route path="ai-generator" element={<AiGenerator />} />
          <Route path="reports"      element={<Reports />} />
          <Route path="multiplayer"  element={<Multiplayer />} />
          <Route path="leaderboard"  element={<Leaderboard />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="profile"      element={<Profile />} />
          <Route path="settings"     element={<Settings />} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
