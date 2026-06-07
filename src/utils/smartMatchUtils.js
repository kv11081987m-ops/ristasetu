import { db } from '../firebase/firebaseConfig';
import {
  collection, doc, getDoc, setDoc, addDoc,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { calculateCompatibility } from './matchUtils';

const MATCH_THRESHOLD = 70;
const MAX_PER_RUN = 5;        // Max notifications sent per registration
const MAX_DAILY_PER_USER = 3; // Max new_match notifs an existing user gets per day

const getTodayISO = () => new Date().toISOString().slice(0, 10);

const isOppositeGender = (a, b) => {
  const ag = (a.gender || '').trim();
  const bg = (b.gender || '').trim();
  if (!ag || !bg || ag === 'Other' || bg === 'Other') return true;
  return ag !== bg;
};

const wasPairNotified = async (existingUid, newUid) => {
  const snap = await getDoc(doc(db, 'smart_match_sent', `${existingUid}_${newUid}`));
  return snap.exists();
};

const markPairNotified = (existingUid, newUid) =>
  setDoc(doc(db, 'smart_match_sent', `${existingUid}_${newUid}`), {
    existingUserId: existingUid,
    newUserId: newUid,
    sentAt: serverTimestamp(),
  });

const getDailyCount = async (userId) => {
  const snap = await getDoc(doc(db, 'smart_match_daily', `${userId}_${getTodayISO()}`));
  return snap.exists() ? (snap.data().count || 0) : 0;
};

const incrementDailyCount = (userId) =>
  setDoc(
    doc(db, 'smart_match_daily', `${userId}_${getTodayISO()}`),
    { count: increment(1), userId, date: getTodayISO() },
    { merge: true }
  );

export const runSmartMatchAlerts = async (newProfile, existingProfiles) => {
  if (!newProfile || !existingProfiles?.length) return;
  const newUid = newProfile.uid || newProfile.id;
  if (!newUid) return;

  const candidates = existingProfiles
    .filter(p => p?.id && p.id !== newUid && p.isProfileComplete !== false)
    .filter(p => isOppositeGender(p, newProfile))
    .map(p => ({ profile: p, compat: calculateCompatibility(p, newProfile) }))
    .filter(c => c.compat.total >= MATCH_THRESHOLD)
    .sort((a, b) => b.compat.total - a.compat.total)
    .slice(0, 20); // Consider top 20 candidates

  let sent = 0;
  for (const { profile, compat } of candidates) {
    if (sent >= MAX_PER_RUN) break;
    if (profile.smartMatchAlerts === false) continue;

    try {
      if (await wasPairNotified(profile.id, newUid)) continue;
      if ((await getDailyCount(profile.id)) >= MAX_DAILY_PER_USER) continue;

      await addDoc(collection(db, 'notifications'), {
        userId: profile.id,
        type: 'new_match',
        fromId: newUid,
        fromName: newProfile.name || 'Koi',
        fromPhoto: newProfile.photoUrl || null,
        message: `${newProfile.name || 'Ek naya user'} abhi RistaSetu join kiya — ${compat.total}% Compatible 💚`,
        matchedUserId: newUid,
        matchedName: newProfile.name || null,
        matchedCity: newProfile.city || null,
        matchedAge: newProfile.age || null,
        score: compat.total,
        status: 'unread',
        createdAt: serverTimestamp(),
      });

      await Promise.all([
        markPairNotified(profile.id, newUid),
        incrementDailyCount(profile.id),
      ]);
      sent++;
    } catch {
      // Silent fail per candidate — don't block registration
    }
  }
};
