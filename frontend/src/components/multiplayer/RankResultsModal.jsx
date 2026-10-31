import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, ArrowRight, Zap } from 'lucide-react';

export default function RankResultsModal({
  isOpen,
  room,
  user,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const origBody = document.body.style.overflow;
    const origHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBody;
      document.documentElement.style.overflow = origHtml;
    };
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const isRanked = room.seasonId != null || room.mode === 'classic' || room.mode === 'duel';
  const players = [...(room.players || [])].sort((a, b) => {
    if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
    if ((a.finishedAt > 0) !== (b.finishedAt > 0)) return a.finishedAt > 0 ? -1 : 1;
    return (a.placement || 99) - (b.placement || 99);
  });

  const me = players.find((p) => String(p.id) === String(user?.id));

  const modalMarkup = (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-results-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mp-results-header">
          <div className="mp-results-title-group">
            <div className="mp-results-trophy-badge">
              <Trophy size={26} color="#F59E0B" />
            </div>
            <div>
              <h2 className="mp-results-title">
                {isRanked ? 'Ranked Quest Standings' : 'Race Completion Standings'}
              </h2>
              <p className="mp-results-sub">
                {room.title} · {room.language} · {room.mode === 'duel' ? '1v1 Duel' : 'Classic 4-Player Race'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mp-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* User's Result Banner */}
        {me && (
          <div className={`mp-my-result-banner place-${me.placement || 1}`}>
            <div className="mp-my-result-left">
              <span className="mp-my-place-pill">
                {me.placement === 1 ? '🥇 1st Place Champion' : me.placement === 2 ? '🥈 2nd Place Runner-Up' : me.placement === 3 ? '🥉 3rd Place' : `#${me.placement || 4} Placed`}
              </span>
              <h3 className="mp-my-result-heading">
                {me.placement === 1 ? 'Magnificent Victory!' : me.placement <= 2 ? 'Strong Finish!' : 'Keep Drilling!'}
              </h3>
            </div>

            {isRanked && (
              <div className="mp-my-elo-pill-box">
                <span className="elo-label">Rating Change</span>
                <span className={`elo-delta ${(me.delta ?? 0) >= 0 ? 'gain' : 'loss'}`}>
                  {(me.delta ?? 0) >= 0 ? '+' : ''}{me.delta ?? 0} ELO
                </span>
                <span className="elo-new">New Rating: {me.newRating ?? me.rating}</span>
              </div>
            )}
          </div>
        )}

        {/* Point Distribution Explanation */}
        {isRanked && (
          <div className="mp-point-rules-card">
            <div className="mp-point-rules-hd">
              <Zap size={15} style={{ color: '#F59E0B' }} />
              <span>Authoritative Point Distribution Rules</span>
            </div>
            <p className="mp-point-rules-desc">
              Points are awarded according to finishing place and placement benchmark. Deductions are calculated based on mistakes made during typing to encourage speed with high accuracy.
            </p>
          </div>
        )}

        {/* Competitor Standings Table */}
        <div className="mp-results-table-wrap">
          <table className="mp-results-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Developer</th>
                <th>Time Taken</th>
                <th>Accuracy</th>
                <th>Speed</th>
                <th>Errors</th>
                {isRanked && <th>Point Distribution</th>}
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => {
                const isMe = String(p.id) === String(user?.id);
                const rankNum = p.placement || idx + 1;
                const elapsedMs = p.finishedAt > 0 && room.startsAt > 0 ? p.finishedAt - room.startsAt : null;
                const elapsedSec = elapsedMs ? (elapsedMs / 1000).toFixed(1) + 's' : 'DNF';
                const pMistakes = p.mistakes ?? p.errors ?? 0;
                const pAccuracy = p.score && p.mistakes ? Math.round((p.score / (p.score + pMistakes)) * 100) : 100;
                const pWpm = elapsedMs ? Math.round(((room.target?.length || 100) / 5) / (elapsedMs / 60000)) : 0;
                const delta = p.delta ?? 0;

                return (
                  <tr key={p.id || idx} className={`mp-result-row ${isMe ? 'is-me-row' : ''}`}>
                    <td>
                      <span className={`mp-table-rank-pill rank-${rankNum}`}>
                        {rankNum === 1 ? '🥇 #1' : rankNum === 2 ? '🥈 #2' : rankNum === 3 ? '🥉 #3' : `#${rankNum}`}
                      </span>
                    </td>
                    <td>
                      <div className="mp-dev-cell">
                        <div className="mp-dev-avatar">
                          {(p.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="mp-dev-info">
                          <span className="mp-dev-name">
                            {p.name} {isMe ? '(You)' : ''}
                          </span>
                          <span className="mp-dev-status">
                            {p.forfeited ? 'Forfeited' : p.finishedAt ? 'Completed' : 'Did not finish'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono">{elapsedSec}</td>
                    <td className="font-mono">{pAccuracy}%</td>
                    <td className="font-mono">{pWpm} WPM</td>
                    <td>
                      <span className={`mp-errors-tag ${pMistakes > 0 ? 'has-errors' : 'clean'}`}>
                        {pMistakes} error{pMistakes !== 1 ? 's' : ''}
                      </span>
                    </td>
                    {isRanked && (
                      <td>
                        <div className="mp-delta-breakdown">
                          <span className={`mp-table-delta ${delta >= 0 ? 'delta-gain' : 'delta-loss'}`}>
                            {delta >= 0 ? '+' : ''}{delta} ELO
                          </span>
                          {pMistakes > 0 && (
                            <span className="mp-penalty-hint">(-{pMistakes} error penalty)</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Bottom Actions */}
        <div className="mp-results-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            <span>Close & Return to Arena</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalMarkup, document.body)
    : modalMarkup;
}
