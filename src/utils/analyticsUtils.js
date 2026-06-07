import { doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const viewKey = (viewerUid, profileId) =>
  `rs_view_${viewerUid}_${profileId}_${new Date().toISOString().slice(0, 10)}`;

export const incrementProfileView = async (profileId, viewerUid) => {
  if (!profileId || !viewerUid || viewerUid === profileId) return;
  const key = viewKey(viewerUid, profileId);
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  try {
    await setDoc(doc(db, 'analytics', profileId), {
      profileViews: increment(1),
      weeklyViews: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('incrementProfileView error:', err);
  }
};

export const loadAnalytics = async (uid) => {
  if (!uid) return null;
  try {
    const ref = doc(db, 'analytics', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { profileViews: 0, weeklyViews: 0, prevWeekViews: 0 };
    const data = snap.data();

    // Client-side weekly reset: if weekStart > 7 days ago, archive & reset
    const weekStart = data.weekStart?.toDate ? data.weekStart.toDate() : new Date(0);
    const daysSince = Math.floor((Date.now() - weekStart.getTime()) / 86400000);
    if (daysSince >= 7) {
      const reset = {
        prevWeekViews: data.weeklyViews || 0,
        weeklyViews: 0,
        weekStart: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      };
      await setDoc(ref, reset, { merge: true });
      return { ...data, ...reset };
    }
    return data;
  } catch (err) {
    console.error('loadAnalytics error:', err);
    return null;
  }
};
