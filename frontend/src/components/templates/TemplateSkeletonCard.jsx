// src/components/templates/TemplateSkeletonCard.jsx

export default function TemplateSkeletonCard({ isListView = false }) {
  return (
    <div className={`template-skeleton-card ${isListView ? 'tsk-list' : 'tsk-grid'}`} aria-hidden="true">
      <div className="tsk-header">
        <div className="tsk-pill tsk-pill-sm shimmer" />
        <div className="tsk-pill tsk-pill-md shimmer" />
        <div className="tsk-pill tsk-pill-xs shimmer" />
      </div>

      <div className="tsk-body">
        <div className="tsk-line tsk-title-line shimmer" />
        <div className="tsk-line tsk-desc-line shimmer" />
        <div className="tsk-line tsk-meta-line shimmer" />
      </div>

      <div className="tsk-preview shimmer" />

      <div className="tsk-footer">
        <div className="tsk-btn shimmer" />
        <div className="tsk-btn tsk-btn-primary shimmer" />
      </div>
    </div>
  );
}
