// src/components/practice/PracticeMetricsCard.jsx
export default function PracticeMetricsCard({ metrics }) {
  return (
    <div className="practice-metrics-card-modern">
      <div className="pm-metric-box">
        <div className="pm-metric-lbl">WPM</div>
        <div className="pm-metric-val">{metrics.netWpm}</div>
      </div>

      <div className="pm-metric-box">
        <div className="pm-metric-lbl">ACCURACY</div>
        <div className="pm-metric-val">{metrics.accuracy}%</div>
      </div>

      <div className="pm-metric-box">
        <div className="pm-metric-lbl">ERRORS</div>
        <div className={`pm-metric-val ${metrics.errorCount > 0 ? 'text-error' : ''}`}>
          {metrics.errorCount}
        </div>
      </div>

      <div className="pm-metric-box">
        <div className="pm-metric-lbl">REMAINING</div>
        <div className="pm-metric-val">
          {metrics.charsRemaining > 0 ? metrics.charsRemaining : '-'}
        </div>
      </div>
    </div>
  );
}
