import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getBirthdayBannerKey } from '../utils/birthdayUtils';

const CONFETTI = [
  { color: '#FFD700', left: '8%',  delay: '0s',    dur: '3s'   },
  { color: '#FF6B6B', left: '22%', delay: '0.4s',  dur: '2.6s' },
  { color: '#4ECDC4', left: '38%', delay: '0.15s', dur: '3.4s' },
  { color: '#FFE66D', left: '54%', delay: '0.6s',  dur: '2.9s' },
  { color: '#A8E6CF', left: '68%', delay: '0.25s', dur: '3.2s' },
  { color: '#FF8B94', left: '82%', delay: '0.5s',  dur: '2.7s' },
  { color: '#C9A84C', left: '92%', delay: '0.1s',  dur: '3.1s' },
];

const BirthdayBanner = ({ userName, uid }) => {
  const [visible, setVisible] = useState(
    () => !!uid && !localStorage.getItem(getBirthdayBannerKey(uid))
  );

  const handleClose = () => {
    localStorage.setItem(getBirthdayBannerKey(uid), '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes rs-confetti {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110px) rotate(400deg); opacity: 0; }
        }
      `}</style>
      <div
        className="relative overflow-hidden rounded-xl mb-6 p-5 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #7B1C1C 0%, #9B2C2C 45%, #B7860B 100%)' }}
      >
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 w-2 h-2 rounded-sm pointer-events-none"
            style={{
              background: c.color,
              left: c.left,
              animation: `rs-confetti ${c.dur} ${c.delay} infinite`,
            }}
          />
        ))}

        <div className="relative flex items-center gap-4">
          <span className="text-5xl shrink-0 select-none">🎂</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base sm:text-lg leading-snug">
              Janam Din ki Shubhkamnayein, {userName} ji! 🎉
            </p>
            <p className="text-yellow-200 text-sm mt-1">
              RistaSetu ki taraf se aapko dheron badhai!
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default BirthdayBanner;
