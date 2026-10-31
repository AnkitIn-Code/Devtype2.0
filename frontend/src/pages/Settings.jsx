import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, User, Mail, ShieldCheck, Sun, Moon,
  Monitor, Trash2, AlertTriangle, X, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const targetConfirmWord = user?.username || 'delete';
  const isConfirmValid = confirmInput.trim().toLowerCase() === targetConfirmWord.toLowerCase();

  const handleDeleteAccount = async () => {
    if (!isConfirmValid || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="dash settings-page-view">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="card-sub">Manage your account profile, workspace theme, and account deletion.</p>
      </div>

      <div className="settings-content-wrapper space-y-6">
        {/* ── 1. Appearance Section ── */}
        <section className="settings-group-block" aria-labelledby="appearance-heading">
          <div className="settings-group-header">
            <h2 id="appearance-heading" className="settings-group-title">Appearance</h2>
            <p className="settings-group-sub">Choose your preferred workspace visual tone.</p>
          </div>
          <div className="card settings-box-card">
            <div className="card-bd settings-appearance-options" role="group" aria-label="Theme">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`btn ${theme === value ? 'btn-primary' : 'btn-ghost'}`}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. Account Information Section ── */}
        <section className="settings-group-block" aria-labelledby="account-heading">
          <div className="settings-group-header">
            <h2 id="account-heading" className="settings-group-title">Account</h2>
            <p className="settings-group-sub">Details for your authenticated DevType account.</p>
          </div>
          <div className="card settings-box-card">
            <dl className="settings-account-details">
              <div>
                <dt><User size={17} />Username</dt>
                <dd>{user?.username || 'Not available'}</dd>
              </div>
              <div>
                <dt><Mail size={17} />Email</dt>
                <dd>{user?.email || 'Not available'}</dd>
              </div>
              <div>
                <dt><ShieldCheck size={17} />Account role</dt>
                <dd>{user?.role === 'ADMIN' ? 'Administrator' : 'Member'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── 3. Device & Timezone Section ── */}
        <section className="settings-group-block" aria-labelledby="device-heading">
          <div className="settings-group-header">
            <h2 id="device-heading" className="settings-group-title">This Device</h2>
            <p className="settings-group-sub">Local environment and client browser configurations.</p>
          </div>
          <div className="card settings-box-card">
            <dl className="settings-account-details">
              <div>
                <dt><Globe size={17} />Device timezone</dt>
                <dd>{timezone}</dd>
              </div>
              <div>
                <dt><Monitor size={17} />Display preference</dt>
                <dd>{theme === 'dark' ? 'Dark' : 'Light'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── 4. Danger Zone: Delete Account ── */}
        <section className="settings-group-block" aria-labelledby="danger-zone-heading">
          <div className="settings-group-header">
            <h2 id="danger-zone-heading" className="settings-group-title text-danger">Danger Zone</h2>
            <p className="settings-group-sub">Irreversible actions regarding your developer profile.</p>
          </div>
          <div className="settings-danger-card">
            <div className="settings-danger-inner">
              <div className="danger-left">
                <div className="danger-title-row">
                  <Trash2 size={18} className="danger-icon" />
                  <span className="danger-title">Delete Account</span>
                </div>
                <p className="danger-desc">
                  Permanently delete your account, practice session velocity telemetry, SRS flashcard review memory, and XP milestones.
                </p>
              </div>
              <button
                type="button"
                className="btn-danger-pill"
                id="btn-open-delete-account-modal"
                onClick={() => {
                  setConfirmInput('');
                  setDeleteError(null);
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Interactive Delete Account Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setIsDeleteModalOpen(false);
            }
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 28,
              borderRadius: 16,
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'var(--bg-surface)',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EF4444',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 id="delete-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--t1)' }}>
                    Delete DevType Account?
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#EF4444', fontWeight: 600, marginTop: 2 }}>
                    This action is immediate and cannot be undone.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16 }}>
              All your practice history, speed performance benchmarks, Spaced Repetition mastery cards, and earned badges will be permanently erased.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="confirm-delete-input"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}
              >
                To confirm, type your username <strong style={{ color: 'var(--t1)' }}>{targetConfirmWord}</strong> below:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                className="input"
                placeholder={targetConfirmWord}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                disabled={isDeleting}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {deleteError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444',
                  fontSize: '0.82rem',
                  marginBottom: 16,
                }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger-pill"
                id="btn-confirm-delete-account"
                disabled={!isConfirmValid || isDeleting}
                onClick={handleDeleteAccount}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: !isConfirmValid || isDeleting ? 0.5 : 1,
                  cursor: !isConfirmValid || isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
