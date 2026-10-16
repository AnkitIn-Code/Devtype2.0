// src/pages/Settings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, User, Mail, Key, AlertTriangle,
  ChevronRight, X, Check, Sparkles, Bot
} from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { id: 'UTC', label: 'UTC (Coordinated Universal Time) (UTC)' },
  { id: 'EST', label: 'America/New_York (Eastern Standard Time) (EST)' },
  { id: 'PST', label: 'America/Los_Angeles (Pacific Standard Time) (PST)' },
  { id: 'GMT', label: 'Europe/London (Greenwich Mean Time) (GMT)' },
  { id: 'CET', label: 'Europe/Berlin (Central European Time) (CET)' },
  { id: 'IST', label: 'Asia/Kolkata (India Standard Time) (IST)' },
  { id: 'JST', label: 'Asia/Tokyo (Japan Standard Time) (JST)' },
  { id: 'SGT', label: 'Asia/Singapore (Singapore Time) (SGT)' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [timezone, setTimezone] = useState(() => localStorage.getItem('codetype_tz') || 'UTC');
  const [devTypeId, setDevTypeId] = useState(() => localStorage.getItem('codetype_devid') || 'qwer');
  const [email, setEmail] = useState(() => localStorage.getItem('codetype_email') || 'qwer****@gmail.com');
  const [toastMessage, setToastMessage] = useState('');

  // Active edit modal: null | 'devtype' | 'email' | 'password' | 'delete'
  const [activeModal, setActiveModal] = useState(null);
  const [tempInput, setTempInput] = useState('');
  const [tempPasswordOld, setTempPasswordOld] = useState('');
  const [tempPasswordNew, setTempPasswordNew] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleTimezoneChange = (e) => {
    const newTz = e.target.value;
    setTimezone(newTz);
    localStorage.setItem('codetype_tz', newTz);
    showToast('Timezone preference updated');
  };

  const handleSaveDevTypeId = (e) => {
    e.preventDefault();
    if (!tempInput.trim()) return;
    setDevTypeId(tempInput.trim());
    localStorage.setItem('codetype_devid', tempInput.trim());
    setActiveModal(null);
    showToast('DevType ID updated');
  };

  const handleSaveEmail = (e) => {
    e.preventDefault();
    if (!tempInput.trim()) return;
    setEmail(tempInput.trim());
    localStorage.setItem('codetype_email', tempInput.trim());
    setActiveModal(null);
    showToast('Login email updated');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!tempPasswordNew) return;
    setActiveModal(null);
    setTempPasswordOld('');
    setTempPasswordNew('');
    showToast('Password changed successfully');
  };

  const handleDeleteAccount = () => {
    setActiveModal(null);
    localStorage.clear();
    showToast('Account scheduled for deactivation (30 days lock)');
    setTimeout(() => {
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="dash settings-page-view">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="set-toast">
          <Check size={14} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="settings-page-header">
        <h1 className="settings-main-title">Settings</h1>
        <p className="settings-main-sub">
          Manage your account credentials and personal preferences
        </p>
      </div>

      <div className="settings-content-wrapper">
        {/* ── Section 1: Timezone & Streaks ── */}
        <div className="settings-group-block">
          <div className="settings-group-header">
            <h2 className="settings-group-title">Timezone &amp; Streaks</h2>
            <p className="settings-group-sub">
              Daily challenges and streak reset boundaries align with your chosen local day.
            </p>
          </div>

          <div className="card settings-box-card">
            <div className="card-bd settings-box-inner timezone-row-inner">
              <div className="setting-item-left">
                <div className="setting-item-icon-box">
                  <Globe size={18} className="setting-lead-icon" />
                </div>
                <div className="setting-item-text">
                  <div className="setting-primary-label">IANA Timezone</div>
                  <div className="setting-secondary-sub">Active: {timezone}</div>
                </div>
              </div>

              <div className="setting-item-right">
                <select
                  value={timezone}
                  onChange={handleTimezoneChange}
                  className="settings-tz-select"
                  aria-label="IANA Timezone"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: General ── */}
        <div className="settings-group-block">
          <div className="settings-group-header">
            <h2 className="settings-group-title">General</h2>
            <p className="settings-group-sub">
              You can log in using your email, username, or DevType ID.
            </p>
          </div>

          <div className="card settings-box-card">
            <div className="settings-list-group">
              {/* Row 1: DevType ID */}
              <div
                className="settings-list-row"
                onClick={() => {
                  setTempInput(devTypeId);
                  setActiveModal('devtype');
                }}
                role="button"
                tabIndex={0}
              >
                <div className="setting-item-left">
                  <User size={18} className="setting-lead-icon" />
                  <span className="setting-field-name">DevType ID</span>
                  <span className="setting-field-value">{devTypeId}</span>
                </div>
                <ChevronRight size={16} className="setting-chevron" />
              </div>

              {/* Row 2: Email */}
              <div
                className="settings-list-row"
                onClick={() => {
                  setTempInput(email);
                  setActiveModal('email');
                }}
                role="button"
                tabIndex={0}
              >
                <div className="setting-item-left">
                  <Mail size={18} className="setting-lead-icon" />
                  <span className="setting-field-name">Email</span>
                  <span className="setting-field-value">{email}</span>
                </div>
                <ChevronRight size={16} className="setting-chevron" />
              </div>

              {/* Row 3: Password */}
              <div
                className="settings-list-row"
                onClick={() => {
                  setTempPasswordOld('');
                  setTempPasswordNew('');
                  setActiveModal('password');
                }}
                role="button"
                tabIndex={0}
              >
                <div className="setting-item-left">
                  <Key size={18} className="setting-lead-icon" />
                  <span className="setting-field-name">Password</span>
                  <span className="setting-field-value">••••••••</span>
                </div>
                <ChevronRight size={16} className="setting-chevron" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Delete Account ── */}
        <div className="card settings-danger-card">
          <div className="card-bd settings-danger-inner">
            <div className="danger-left">
              <div className="danger-title-row">
                <AlertTriangle size={17} className="danger-icon" />
                <span className="danger-title">Delete Account</span>
              </div>
              <p className="danger-desc">
                Permanently remove your profile and data. Your email/username will be locked for 30 days.
              </p>
            </div>

            <div className="danger-right">
              <button
                type="button"
                className="btn btn-danger-pill"
                onClick={() => setActiveModal('delete')}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating AI Assistant Pill Button (From Screenshot) ── */}
      <button
        type="button"
        className="floating-ai-assistant-btn"
        onClick={() => navigate('/ai-generator')}
        title="Open AI Generator & Assistant"
      >
        <Bot size={16} />
        <span>AI Assistant</span>
        <span className="ai-status-dot" />
      </button>

      {/* ==============================================================
          MODALS FOR CREDENTIAL EDITS & CONFIRMATION
          ============================================================== */}

      {/* Edit DevType ID */}
      {activeModal === 'devtype' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Update DevType ID</div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDevTypeId} className="prof-edit-form">
              <div className="form-group">
                <label className="form-label">DevType Identifier</label>
                <input
                  type="text"
                  required
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  className="lb-search-field"
                  placeholder="e.g. qwer"
                />
                <span className="form-tip">Must be 3-16 alphanumeric characters.</span>
              </div>
              <div className="modal-footer-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Identifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Email */}
      {activeModal === 'email' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Update Login Email</div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEmail} className="prof-edit-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  className="lb-search-field"
                  placeholder="name@domain.com"
                />
              </div>
              <div className="modal-footer-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password */}
      {activeModal === 'password' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Change Account Password</div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePassword} className="prof-edit-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  required
                  value={tempPasswordOld}
                  onChange={(e) => setTempPasswordOld(e.target.value)}
                  className="lb-search-field"
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  value={tempPasswordNew}
                  onChange={(e) => setTempPasswordNew(e.target.value)}
                  className="lb-search-field"
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="modal-footer-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {activeModal === 'delete' && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: '#EF4444' }}>
                Delete Account Confirmation
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '0 4px 16px' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--t2)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete your CodeType profile and activity history?
                Your email and username will remain locked for 30 days. This action cannot be reversed.
              </p>
            </div>
            <div className="modal-footer-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger-pill"
                onClick={handleDeleteAccount}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
