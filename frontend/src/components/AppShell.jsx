// src/components/AppShell.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <div className="app-window">
      {/* Floating App Body on Simple White Background */}
      <div className="app-body">
        <Sidebar />
        <div className="main-content">
          <TopBar />
          <main className="page-body">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
