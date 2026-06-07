import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useNotificationContext } from '../context/NotificationContext';

const Avatar = ({ photo, name, size = 44 }) => (
  <div style={{
    width: size, height: size, minWidth: size, borderRadius: '50%',
    overflow: 'hidden', background: '#C9A84C',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', color: '#7A4F00', fontSize: '1rem',
    border: '2px solid #D4AF37', flexShrink: 0,
  }}>
    {photo
      ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
      : (name || '?').charAt(0).toUpperCase()
    }
  </div>
);

const ScorePill = ({ score }) => {
  const color = score >= 85 ? '#15803D' : score >= 70 ? '#0369A1' : '#7C3AED';
  return (
    <span style={{
      background: color + '18',
      color,
      border: `1px solid ${color}40`,
      borderRadius: '999px',
      padding: '1px 8px',
      fontSize: '0.72rem',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
    }}>
      {score}% Compatible 💚
    </span>
  );
};

const NewMatchBanner = ({ notification }) => {
  const navigate = useNavigate();
  const { markAsRead } = useNotificationContext();

  const handleView = () => {
    markAsRead(notification.id);
    navigate(`/profile/${notification.matchedUserId}`);
  };

  const handleDismiss = () => {
    markAsRead(notification.id);
  };

  const score = notification.score || 0;
  const name = notification.matchedName || notification.fromName || 'Naya Match';
  const city = notification.matchedCity || '';
  const age = notification.matchedAge || '';
  const photo = notification.matchedPhoto || notification.fromPhoto || null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFF8E7, #FFF0D4)',
        border: '1.5px solid #D4AF37',
        borderRadius: '0.875rem',
        padding: '0.875rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 2px 12px rgba(212,175,55,0.18)',
        position: 'relative',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', padding: '2px', display: 'flex', borderRadius: '50%',
        }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      {/* Avatar */}
      <Avatar photo={photo} name={name} size={48} />

      {/* Info */}
      <div style={{ flex: 1, overflow: 'hidden', paddingRight: '1.25rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#92610A', letterSpacing: '0.05em', marginBottom: '2px' }}>
          ✨ AAPKE LIYE NAYA MATCH!
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1F2937' }}>{name}</span>
          <ScorePill score={score} />
        </div>
        {(city || age) && (
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
            {[city, age ? `${age} saal` : ''].filter(Boolean).join(' • ')}
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleView}
        style={{
          background: 'linear-gradient(135deg, #8B1A2F, #C0392B)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.45rem 0.875rem',
          fontSize: '0.775rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(139,26,47,0.3)',
        }}
      >
        Abhi Dekho →
      </button>
    </div>
  );
};

export default NewMatchBanner;
