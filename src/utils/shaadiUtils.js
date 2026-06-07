import { doc, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// shaadi_requests doc ID = chatId (one request per chat pair)

export const initiateShaadi = (chatId, initiatorId, receiverId) =>
  setDoc(doc(db, 'shaadi_requests', chatId), {
    chatId,
    initiatorId,
    receiverId,
    status: 'pending',
    initiatedAt: serverTimestamp(),
  });

export const confirmShaadi = async (chatId, myUid, otherUid) => {
  const now = serverTimestamp();
  await updateDoc(doc(db, 'shaadi_requests', chatId), {
    status: 'confirmed',
    confirmedAt: now,
  });
  await updateDoc(doc(db, 'users', myUid), {
    maritalStatus: 'married',
    marriedAt: now,
    marriedWith: otherUid,
    isActive: false,
  });
  await updateDoc(doc(db, 'users', otherUid), {
    maritalStatus: 'married',
    marriedAt: now,
    marriedWith: myUid,
    isActive: false,
  });
};

export const declineShaadi = (chatId) =>
  updateDoc(doc(db, 'shaadi_requests', chatId), { status: 'declined' });

export const submitSuccessStory = (data) =>
  addDoc(collection(db, 'success_stories'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
