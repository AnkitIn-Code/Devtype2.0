import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            margin: '20px auto',
            maxWidth: '640px',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#EF4444',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--t1)', margin: '0 0 8px 0' }}>
            {this.props.title || 'Component Encountered an Unexpected Issue'}
          </h3>
          <p style={{ color: 'var(--t2)', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A temporary interface glitch occurred. Your session data is intact.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={this.handleRetry}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={14} />
            <span>Recover View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
