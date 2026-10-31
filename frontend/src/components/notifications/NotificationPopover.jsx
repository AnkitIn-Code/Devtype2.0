// src/components/notifications/NotificationPopover.jsx
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Zap, Shield, Sparkles, Bell, Check, Trash2, ArrowRight,
  ExternalLink, PlusCircle
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_ICONS = {
  achievement: Trophy,
  challenge: Zap,
  security: Shield,
  system: Sparkles,
};

export default function NotificationPopover({ onClose }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
  } = useNotifications();

  const navigate = useNavigate();

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };


  return (
    <div className="notif-popover" role="dialog" aria-label="Notifications Center">
      {/* Popover Header */}
      <div className="notif-popover-hd">
        <div className="notif-popover-title-row">
          <div className="notif-title-wrap">
            <span className="notif-hd-title">Notifications</span>
            {unreadCount > 0 && (
              <span className="notif-unread-badge">{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-mark-read-btn"
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              <Check size={13} />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="notif-list-container">
        {notifications.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">
              <Bell size={24} strokeWidth={1.5} />
            </div>
            <div className="notif-empty-title">All caught up</div>
            <p className="notif-empty-desc">
              No new alerts or achievements at the moment.
            </p>
          </div>
        ) : (
          <ul className="notif-list" role="list">
            {notifications.map((n) => {
              const IconComp = TYPE_ICONS[n.type] || Bell;
              return (
                <li
                  key={n.id}
                  className={`notif-item ${!n.read ? 'unread' : 'read'}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className={`notif-item-icon-box type-${n.type || 'system'}`}>
                    <IconComp size={15} strokeWidth={2.2} />
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-item-head">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-time">{n.time}</span>
                    </div>
                    <p className="notif-item-desc">{n.message}</p>
                    {n.link && (
                      <div className="notif-item-link-hint">
                        <span>View workspace</span>
                        <ArrowRight size={11} />
                      </div>
                    )}
                  </div>

                  {!n.read && <span className="notif-unread-dot" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Popover Footer with Clear */}
      {notifications.length > 0 && (
        <div className="notif-popover-ft" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="notif-action-btn notif-btn-clear"
            onClick={clearAll}
            title="Clear all notifications"
          >
            <Trash2 size={13} />
            <span>Clear All</span>
          </button>
        </div>
      )}
    </div>
  );
}
