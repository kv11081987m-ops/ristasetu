import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// phone/email live in users/{uid}/private/contact — never on the broadly
// readable users/{uid} doc. Firestore rules only allow this read for the
// owner, an admin, or a user with a mutual 'accepted' interest with uid.
export const subscribeToContact = (uid, onData) => {
  if (!uid) { onData(null); return () => {}; }
  return onSnapshot(
    doc(db, 'users', uid, 'private', 'contact'),
    (snap) => onData(snap.exists() ? snap.data() : null),
    () => onData(null), // permission-denied (not owner/admin/matched) → no contact shown
  );
};

export const saveOwnContact = (uid, data) =>
  setDoc(doc(db, 'users', uid, 'private', 'contact'), data, { merge: true });
