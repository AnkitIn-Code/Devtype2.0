import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import LandingFooter from './landing/LandingFooter';

export default function AppShell() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButton = useRef(null);

  // Administrators only have access to the Admin Console
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  useEffect(() => {
    if (!menuOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const close = event => { if (event.key === 'Escape') setMenuOpen(false); };
    const media = window.matchMedia('(min-width: 721px)');
    const resize = event => { if (event.matches) setMenuOpen(false); };
    window.addEventListener('keydown', close);
    media.addEventListener('change', resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', close);
      media.removeEventListener('change', resize);
      previousFocus?.focus();
    };
  }, [menuOpen]);
  return (
    <div className="app-window">
      <div className="app-body">
      {menuOpen && <button className="workspace-nav-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

        <Sidebar mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} closeButtonRef={closeButton} />
        <div className="main-content" inert={menuOpen}>
          <TopBar onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
          <main className="page-body"><Outlet /></main>
        </div>
      </div>
      <div className="workspace-footer" inert={menuOpen}><LandingFooter /></div>
    </div>
  );
}
