import React, { useState } from 'react';
import { X, Flame } from 'lucide-react';
import { getMilestoneMessage, getStreakBannerKey, getNextMilestone, MILESTONES } from '../utils/streakUtils';

const StreakBanner = ({ streak, uid }) => {
  // seen = already dismissed today → don't show again
  const [seen, setSeen] = useState(
    () => !!uid && !!localStorage.getItem(getStreakBannerKey(uid))
  );

  const handleClose = () => {
    if (uid) localStorage.setItem(getStreakBannerKey(uid), '1');
    setSeen(true);
  };

  if (seen || streak < 1) return null;

  const isMilestone = MILESTONES.includes(streak);
  const milestoneMsg = getMilestoneMessage(streak);
  const nextMilestone = getNextMilestone(streak);
  const daysLeft = nextMilestone - streak;

  return (
    <div
      className="relative rounded-xl mb-6 p-4 shadow-lg overflow-hidden"
      style={{
        background: isMilestone
          ? 'linear-gradient(135deg, #7C3AED 0%, #DC2626 100%)'
          : 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
      }}
    >
      <div className="flex items-center gap-3">
        <Flame size={34} className="text-yellow-300 shrink-0" fill="#FCD34D" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base leading-snug">
            🔥 {streak} Din ki Streak!
          </p>
          <p className="text-orange-100 text-sm mt-0.5">
            {milestoneMsg || `Waah! Aap ${streak} din se lagatar active hain!`}
          </p>
          {daysLeft > 0 && (
            <p className="text-yellow-200 text-xs mt-1">
              {daysLeft} din aur — agli milestone par reward milega!
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="shrink-0 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default StreakBanner;
