/**
 * StarDisplay.js — Read-only star display component for admin dashboard.
 * Shows filled/empty stars based on a numeric rating (1-5).
 */

const StarDisplay = ({ value, showNumber = true }) => {
  const rating = Math.round(value || 0);
  const filled = '★'.repeat(rating);
  const empty  = '☆'.repeat(5 - rating);

  return (
    <span title={`${value}/5`}>
      <span className="stars-display">{filled}{empty}</span>
      {showNumber && (
        <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '6px' }}>
          {value ? Number(value).toFixed(1) : '—'}
        </span>
      )}
    </span>
  );
};

export default StarDisplay;
