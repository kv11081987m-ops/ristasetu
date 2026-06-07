import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { getNextMilestone, MILESTONES, getStreakReward } from '../utils/streakUtils';

const StreakDisplay = ({ userProfile }) => {
  const current = userProfile?.currentStreak || 0;
  const longest  = userProfile?.longestStreak || 0;

  const nextMilestone = getNextMilestone(current);
  const prevMilestone = [...MILESTONES].reverse().find(m => m < nextMilestone && m <= current) ?? 0;
  const range    = nextMilestone - prevMilestone;
  const progress = range > 0 ? Math.min(100, ((current - prevMilestone) / range) * 100) : 100;
  const daysLeft = nextMilestone - current;
  const reward   = getStreakReward(nextMilestone);

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-orange-500" fill="#F97316" />
        <h3 className="font-black text-gray-800 text-base">Login Streak</h3>
      </div>

      {/* Current + Best */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center shadow-sm">
          <Flame size={22} className="text-orange-500 mb-1" fill="#F97316" />
          <p className="text-2xl font-black text-gray-800">{current}</p>
          <p className="text-xs text-gray-500 mt-0.5">Current Streak</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center shadow-sm">
          <Trophy size={22} className="text-yellow-500 mb-1" />
          <p className="text-2xl font-black text-gray-800">{longest}</p>
          <p className="text-xs text-gray-500 mt-0.5">Best Streak</p>
        </div>
      </div>

      {/* Progress bar to next milestone */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-gray-600">Next Milestone</p>
          <p className="text-xs font-black text-orange-600">{current}/{nextMilestone} din</p>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #EA580C, #EF4444)',
            }}
          />
        </div>
        {daysLeft > 0 ? (
          <p className="text-[11px] text-gray-500">
            🎁 {daysLeft} din aur —{' '}
            <span className="text-orange-600 font-semibold">
              {reward?.text ?? 'reward milega!'}
              {reward?.comingSoon && (
                <span className="ml-1 text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">
                  Coming Soon
                </span>
              )}
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-green-600 font-semibold">
            🎉 Is milestone ka reward haasil kar liya!
          </p>
        )}
      </div>

      {/* Milestone badges */}
      <div className="flex flex-wrap gap-2">
        {MILESTONES.map(m => (
          <span
            key={m}
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
              current >= m
                ? 'bg-orange-100 border-orange-200 text-orange-700'
                : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            {current >= m ? '✅' : '🔒'} {m} Din
          </span>
        ))}
      </div>
    </div>
  );
};

export default StreakDisplay;
