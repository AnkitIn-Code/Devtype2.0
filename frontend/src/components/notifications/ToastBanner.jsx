// src/components/notifications/ToastBanner.jsx
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Shield, Sparkles, Bell, X, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_ICONS = {
  achievement: Trophy,
  challenge: Zap,
  security: Shield,
  system: Sparkles,
};

export default function ToastBanner() {
  const { activeToast, dismissToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  if (!activeToast) return null;

  const IconComponent = TYPE_ICONS[activeToast.type] || Bell;

  const handleClick = () => {
    markAsRead(activeToast.id);
    if (activeToast.link) {
      navigate(activeToast.link);
    }
    dismissToast();
  };

  const handleClose = (e) => {
    e.stopPropagation();
    dismissToast();
  };

  return (
    <aside
      className="toast-banner"
      role="status"
      aria-live="polite"
      onClick={handleClick}
    >
      <div className={`toast-icon-wrap type-${activeToast.type || 'system'}`}>
        <IconComponent size={18} strokeWidth={2.2} />
      </div>

      <div className="toast-content">
        <div className="toast-header">
          <span className="toast-title">{activeToast.title}</span>
          <span className="toast-time">Just now</span>
        </div>
        <p className="toast-msg">{activeToast.message}</p>
      </div>

      <div className="toast-actions">
        {activeToast.link && (
          <div className="toast-arrow" title="View details">
            <ArrowRight size={14} />
          </div>
        )}
        <button
          type="button"
          className="toast-close-btn"
          onClick={handleClose}
          aria-label="Dismiss toast"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
