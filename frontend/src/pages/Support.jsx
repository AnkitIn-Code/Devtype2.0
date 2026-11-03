import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  LifeBuoy,
  ShieldAlert,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  FileQuestion,
  Filter,
  RefreshCw,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';
import { supportService } from '../services/supportService';
import { useNotifications } from '../context/NotificationContext';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'anti-cheat', label: 'Anti-Cheat & Fair Play' },
  { id: 'ranked', label: 'Ranked Arena & MMR' },
  { id: 'mechanics', label: 'Typing Mechanics & WPM' },
  { id: 'lifecycle', label: 'Account Suspensions & Deletions' },
  { id: 'general', label: 'Templates & Studio' },
];

const FAQS = [
  {
    category: 'anti-cheat',
    question: 'What constitutes cheating or illegal actions on DevType?',
    answer:
      'Any injection of automated keystroke scripts, clipboard code pasting (Ctrl+V / Cmd+V) into typing buffers, artificial virtual device drivers, or bot emulators is strictly prohibited. The DevType typing engine analyzes keystroke cadence, inter-arrival standard deviation, and browser trust properties in real-time. Any illegal action triggers an immediate security alert and generates an automated moderation ticket directly to the platform administrator.',
  },
  {
    category: 'anti-cheat',
    question: 'What happens when automated cheat detection flags my session?',
    answer:
      'The current practice session or ranked match is immediately halted. A system-generated CRITICAL moderation ticket is sent to administrators containing full keystroke telemetry, typing velocity, and event type. Administrators review the event and take disciplinary actions, including temporary account suspension (e.g. 1 to 30 days) or permanent account deactivation.',
  },
  {
    category: 'lifecycle',
    question: 'How do temporary account suspensions work and when do they expire?',
    answer:
      'If your account is suspended by an administrator, login attempts will display an active suspension countdown dialog indicating the remaining days, hours, and the disciplinary reason. The suspension timer decrements daily. Once the suspension duration expires, your account is automatically reinstated on your next login attempt without requiring manual intervention.',
  },
  {
    category: 'lifecycle',
    question: 'What is the account deactivation and deletion retention policy?',
    answer:
      'When an account is deactivated by moderation or requested for deletion, it is placed in the deletion pipeline with a 30-day retention grace period. During this period, all active sessions and public match lobbies are disabled. After 30 days, all personal telemetry, accounts, and profile data are permanently erased from the database.',
  },
  {
    category: 'ranked',
    question: 'How is Ranked MMR calculated and how does matchmaking pair racers?',
    answer:
      'Ranked Arena uses a Bayesian rating system (inspired by Glicko-2) that models both your estimated skill (MMR) and rating volatility. Defeating higher-rated opponents yields significant rating increases, while underperforming against lower-rated opponents reduces MMR. Forfeiting or leaving an active race counts as a last-place finish.',
  },
  {
    category: 'mechanics',
    question: 'What is the difference between Gross WPM and Net WPM?',
    answer:
      'Gross WPM measures raw typing speed: ((Total Keystrokes / 5) / Elapsed Minutes). Net WPM penalizes syntax inaccuracies: ((Total Keystrokes / 5) - Uncorrected Errors) / Elapsed Minutes. Only Net WPM is registered on competitive leaderboards and ranked rating updates.',
  },
  {
    category: 'mechanics',
    question: 'Does the typing editor support auto-indentation and tab keys?',
    answer:
      'Yes! When you press Enter, DevType automatically matches the leading whitespace and indentation level of the target snippet line. Pressing Backspace on leading indentation also intelligently removes the entire indent block, letting you focus purely on code syntax.',
  },
  {
    category: 'general',
    question: 'Can I propose new algorithms or request snippets for other languages?',
    answer:
      'Absolutely! You can submit a support ticket under the "FEATURE_REQUEST" category specifying the algorithm, data structure, or programming framework you would like added to the official catalog. You can also build your own blueprints in the Custom Studio.',
  },
];

export default function Support() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'tickets' | 'new-ticket'
  const [faqCategory, setFaqCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // New Ticket Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'BUG_REPORT',
    priority: 'NORMAL',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch tickets on load or tab change
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await supportService.getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  // Initial load of tickets count for badge
  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = faqCategory === 'all' || faq.category === faqCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [faqCategory, searchQuery]);

  // Handle Submit Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      addNotification?.({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide both a ticket title and a detailed description.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await supportService.submitTicket({
        title: formData.title.trim(),
        category: formData.category,
        priority: formData.priority,
        description: formData.description.trim(),
      });

      addNotification?.({
        type: 'success',
        title: 'Support Ticket Submitted',
        message: 'Your ticket has been logged with ID #' + (res?.id || 'NEW') + '. An administrator will review and respond.',
      });

      setFormData({
        title: '',
        category: 'BUG_REPORT',
        priority: 'NORMAL',
        description: '',
      });

      // Switch to tickets view and reload
      setActiveTab('tickets');
      fetchTickets();
    } catch (err) {
      addNotification?.({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to submit ticket. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Open', className: 'badge-status-open', icon: Clock };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', className: 'badge-status-review', icon: MessageSquare };
      case 'RESOLVED':
        return { label: 'Resolved', className: 'badge-status-resolved', icon: CheckCircle2 };
      case 'DISMISSED':
        return { label: 'Dismissed', className: 'badge-status-dismissed', icon: AlertCircle };
      default:
        return { label: status, className: 'badge-status-open', icon: Clock };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { label: 'Critical', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH':
      case 'URGENT':
        return { label: 'Urgent', bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'NORMAL':
        return { label: 'Normal', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'LOW':
      default:
        return { label: 'Low', bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div className="dash support-page-view">
      {/* ── Welcome Header (Matches DevType Design Language) ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>DevType Operations // Player Support &amp; Help Desk</span>
          </div>
          <h1 className="welcome-title">Help Desk &amp; Inquiries</h1>
          <p className="welcome-sub">
            Browse knowledge base FAQs, fair play anti-cheat guidelines, or submit tickets for administrator review.
          </p>
        </div>

        {/* Ice Glass Status Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span>{tickets.length} Active Tickets</span>
            <LifeBuoy size={16} className="welcome-cal-icon" style={{ color: '#3B82F6' }} />
          </div>
          <div className="welcome-widget-sub flex items-center gap-2" style={{ fontSize: '0.82rem', color: 'var(--t3)', marginTop: '4px' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
            <span>Support Online • Fast Response</span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs Segmented Controls ── */}
      <div className="support-nav-bar">
        <div className="support-segmented-controls">
          <button
            type="button"
            className={`support-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <FileQuestion size={16} />
            <span>Frequently Asked Questions</span>
          </button>

          <button
            type="button"
            className={`support-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <MessageSquare size={16} />
            <span>My Tickets</span>
            {tickets.length > 0 && (
              <span className="support-tab-badge">
                {tickets.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`support-tab-btn ${activeTab === 'new-ticket' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-ticket')}
          >
            <PlusCircle size={16} />
            <span>Submit a Ticket</span>
          </button>
        </div>
      </div>

      {/* ───────────────── TAB 1: FAQ SECTION ───────────────── */}
      {activeTab === 'faq' && (
        <div className="support-faq-wrapper animate-fade-in space-y-6">
          {/* Search & Categories Bar */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div
                style={{
                  flex: '1 1 300px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--bg-card-sub, rgba(255,255,255,0.04))',
                  border: '1px solid var(--glass-border-sub, rgba(255,255,255,0.1))',
                  borderRadius: '10px',
                  padding: '8px 14px',
                }}
              >
                <Search size={16} style={{ color: 'var(--t3)' }} />
                <input
                  type="text"
                  placeholder="Search questions, anti-cheat, WPM rules, or suspensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    color: 'var(--t1)',
                    fontSize: '0.9rem',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFaqCategory(cat.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: faqCategory === cat.id ? '#3B82F6' : 'var(--glass-border-sub, rgba(255,255,255,0.1))',
                      background: faqCategory === cat.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: faqCategory === cat.id ? '#3B82F6' : 'var(--t2)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Notice Banner on Anti-Cheat and Suspensions */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <ShieldAlert size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#EF4444', marginBottom: '4px' }}>
                Automated Fair Play & Telemetry Enforcement
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--t2)', lineHeight: 1.5 }}>
                Pasting code into race buffers or using script keystroke emulation triggers an automated security incident.
                Admin action includes timed suspensions (auto-decremented daily) and account deactivation. If you were flagged inadvertently, you may file an appeal ticket below.
              </div>
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px', color: 'var(--t3)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No questions matched your search criteria.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFaqCategory('all');
                  }}
                  style={{ marginTop: '8px' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isOpen
                        ? '1px solid rgba(59,130,246,0.35)'
                        : '1px solid var(--glass-border-sub, rgba(255,255,255,0.08))',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '16px 20px',
                        background: isOpen ? 'rgba(59,130,246,0.04)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.96rem',
                          fontWeight: 600,
                          color: isOpen ? '#3B82F6' : 'var(--t1)',
                        }}
                      >
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={18} style={{ color: '#3B82F6', flexShrink: 0 }} />
                      ) : (
                        <ChevronDown size={18} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0 20px 18px 20px',
                          fontSize: '0.88rem',
                          color: 'var(--t2)',
                          lineHeight: 1.6,
                          borderTop: '1px solid var(--glass-border-sub, rgba(255,255,255,0.05))',
                          marginTop: '4px',
                          paddingTop: '14px',
                        }}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ───────────────── TAB 2: MY TICKETS SECTION ───────────────── */}
      {activeTab === 'tickets' && (
        <div className="support-tickets-wrapper animate-fade-in space-y-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--t1)' }}>
                Your Support Tickets
              </h2>
              <p className="card-sub" style={{ margin: '4px 0 0 0' }}>
                Track the status of your queries and view official administrator responses.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchTickets}
              disabled={loadingTickets}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loadingTickets ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingTickets && tickets.length === 0 ? (
            <div
              className="card text-center"
              style={{
                padding: '48px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: '#3B82F6' }} />
              <p style={{ color: 'var(--t2)', margin: 0 }}>Loading your support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div
              className="card text-center"
              style={{
                padding: '60px 24px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '16px',
                  background: 'rgba(59,130,246,0.12)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  border: '1px solid rgba(59,130,246,0.25)',
                }}
              >
                <MessageSquare size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '8px', textAlign: 'center' }}>
                No Support Tickets Yet
              </h3>
              <p style={{ color: 'var(--t2)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center' }}>
                Have an inquiry regarding typing velocity, ranking calculations, or an appeal? Submit a ticket and our administrative team will respond.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('new-ticket')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
              >
                <PlusCircle size={16} />
                <span>Submit Support Ticket</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {tickets.map((t) => {
                const statusBadge = getStatusBadge(t.status);
                const priorityBadge = getPriorityBadge(t.priority);
                const StatusIcon = statusBadge.icon;
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <div
                    key={t.id}
                    className="card"
                    style={{
                      borderRadius: '16px',
                      padding: '24px 28px',
                      border: isSelected
                        ? '1px solid #3B82F6'
                        : '1px solid var(--glass-border-sub, rgba(255,255,255,0.08))',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Top Row: Title, ID & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--t3)', fontWeight: 600 }}>
                            #{t.id}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: priorityBadge.bg,
                              color: priorityBadge.color,
                              border: `1px solid ${priorityBadge.border}`,
                            }}
                          >
                            {priorityBadge.label}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: 'var(--bg-card-sub, rgba(255,255,255,0.06))',
                              color: 'var(--t2)',
                              border: '1px solid var(--glass-border-sub, rgba(255,255,255,0.1))',
                            }}
                          >
                            {t.category}
                          </span>
                          {t.isSystemFlagged && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                              }}
                            >
                              AUTOMATED ANTI-CHEAT
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                          {t.title || 'Support Query #' + t.id}
                        </h3>
                      </div>

                      {/* Status Badge & Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background:
                              t.status === 'RESOLVED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : t.status === 'UNDER_REVIEW'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : t.status === 'DISMISSED'
                                ? 'rgba(148, 163, 184, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              t.status === 'RESOLVED'
                                ? '#10B981'
                                : t.status === 'UNDER_REVIEW'
                                ? '#3B82F6'
                                : t.status === 'DISMISSED'
                                ? '#94A3B8'
                                : '#F59E0B',
                            border: '1px solid currentColor',
                          }}
                        >
                          <StatusIcon size={13} />
                          {statusBadge.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    {/* Ticket Body / Description */}
                    <div
                      style={{
                        margin: '18px 0',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'var(--bg-card-sub, rgba(255,255,255,0.03))',
                        border: '1px solid var(--glass-border-sub, rgba(255,255,255,0.06))',
                        fontSize: '0.92rem',
                        color: 'var(--t2)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      {t.description}
                    </div>

                    {/* Official Admin Response Section */}
                    {t.adminResponse ? (
                      <div
                        style={{
                          marginTop: '20px',
                          padding: '20px 24px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.03) 100%)',
                          border: '1px solid rgba(59,130,246,0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: '#2563EB',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Shield size={14} />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3B82F6' }}>
                              DevType Platform Administrator Response
                            </span>
                          </div>
                          {t.reviewedAt && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>
                              Responded {new Date(t.reviewedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            color: 'var(--t1)',
                            lineHeight: 1.6,
                            paddingLeft: '32px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {t.adminResponse}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8rem',
                          color: 'var(--t3)',
                          padding: '6px 0',
                        }}
                      >
                        <Clock size={14} />
                        <span>Awaiting review and reply from DevType administrator.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────── TAB 3: GENERATE NEW TICKET ───────────────── */}
      {activeTab === 'new-ticket' && (
        <div className="support-new-ticket-wrapper animate-fade-in">
          <div className="card" style={{ padding: '36px 40px', borderRadius: '18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '28px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--glass-border-sub, rgba(255,255,255,0.08))',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(59,130,246,0.1) 100%)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59,130,246,0.25)',
                }}
              >
                <PlusCircle size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--t1)' }}>
                  Submit a Support Ticket
                </h2>
                <p className="card-sub" style={{ margin: '4px 0 0 0', fontSize: '0.92rem' }}>
                  Our staff investigates bug reports, anti-cheat appeals, and blueprint requests.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitTicket} className="support-ticket-form">
              {/* Title Input */}
              <div className="support-form-group">
                <label className="support-form-label">
                  <span>Ticket Title</span>
                  <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="support-form-input"
                  placeholder="Brief summary of the issue or inquiry"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={150}
                  required
                />
              </div>

              {/* Category & Priority Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                <div className="support-form-group">
                  <label className="support-form-label">
                    <span>Category</span>
                  </label>
                  <select
                    className="support-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ padding: '13px 16px', borderRadius: '10px' }}
                  >
                    <option value="BUG_REPORT">Bug Report</option>
                    <option value="ANTI_CHEAT_APPEAL">Anti-Cheat Appeal / Telemetry Issue</option>
                    <option value="RANKED_MATCHMAKING">Ranked Arena &amp; MMR Calculation</option>
                    <option value="FEATURE_REQUEST">Feature / Blueprint Request</option>
                    <option value="ACCOUNT_SUPPORT">Account Credentials &amp; Profile</option>
                    <option value="OTHER">Other Platform Inquiries</option>
                  </select>
                </div>

                <div className="support-form-group">
                  <label className="support-form-label">
                    <span>Priority</span>
                  </label>
                  <select
                    className="support-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ padding: '13px 16px', borderRadius: '10px' }}
                  >
                    <option value="LOW">Low (Cosmetic / Suggestion)</option>
                    <option value="NORMAL">Normal (Standard inquiry)</option>
                    <option value="HIGH">High (Gameplay / Matchmaking issue)</option>
                    <option value="URGENT">Urgent (Account access / Critical bug)</option>
                  </select>
                </div>
              </div>

              {/* Description Input */}
              <div className="support-form-group">
                <label className="support-form-label">
                  <span>Detailed Description</span>
                  <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="support-form-textarea"
                  rows={8}
                  placeholder="Please describe what happened, steps to reproduce, or details regarding your inquiry..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minLength={5}
                  maxLength={2000}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--t3)', marginTop: '8px' }}>
                  <span>Be as detailed as possible to help administrators resolve your ticket swiftly.</span>
                  <span>{formData.description.length} / 2000</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="support-form-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveTab('faq')}
                  style={{ padding: '10px 22px', fontSize: '0.94rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center', padding: '12px 28px', fontSize: '0.95rem' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
