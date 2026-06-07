import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// IST = UTC + 5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const getISTDateStr = (offsetDays = 0) => {
  const ms = Date.now() + IST_OFFSET_MS + offsetDays * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
};

export const MILESTONES = [3, 7, 15, 30, 100];

export const getMilestoneMessage = (streak) => {
  if (streak >= 100) return 'Legend! 🏆 100 din ki streak!';
  if (streak >= 30)  return 'Champion! 👑 30 din ki streak!';
  if (streak >= 15)  return 'Kya baat hai! 💪 15 din ki streak!';
  if (streak >= 7)   return 'Ek hapta poora! 🔥 7 din ki streak!';
  if (streak >= 3)   return 'Achhi shuruaat! 🌟 3 din ki streak!';
  return null;
};

export const getStreakReward = (milestone) => {
  if (milestone === 7)   return { text: 'Profile Boost 1 baar free!', comingSoon: false };
  if (milestone === 30)  return { text: '1 Week Premium free!', comingSoon: true };
  if (milestone === 100) return { text: '1 Month Premium free!', comingSoon: true };
  return null;
};

export const getNextMilestone = (current) =>
  MILESTONES.find(m => m > current) ?? MILESTONES[MILESTONES.length - 1];

export const getStreakBannerKey = (uid) =>
  `rs_streak_banner_${uid}_${getISTDateStr()}`;

// Returns { newStreak, newLongest, isMilestone, wasBroken } or null (already done today)
export const calcAndSaveStreak = async (uid, userProfile) => {
  if (!uid || !userProfile) return null;

  const today     = getISTDateStr(0);
  const yesterday = getISTDateStr(-1);
  const lastLogin = userProfile.lastLoginDate;

  if (lastLogin === today) return null; // already tracked today

  const prevStreak = userProfile.currentStreak || 0;
  let newStreak;
  let wasBroken = false;

  if (lastLogin === yesterday) {
    newStreak = prevStreak + 1;
  } else {
    wasBroken = prevStreak > 1;
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, userProfile.longestStreak || 0);

  await updateDoc(doc(db, 'users', uid), {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastLoginDate: today,
    streakUpdatedAt: serverTimestamp(),
  });

  return {
    newStreak,
    newLongest,
    isMilestone: MILESTONES.includes(newStreak),
    wasBroken,
  };
};
