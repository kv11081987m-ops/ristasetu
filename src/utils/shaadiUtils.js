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

// Receiver confirms: updates request status + archives own profile only.
// The initiator sees confirmed status via onSnapshot and calls selfArchive() themselves.
export const confirmShaadi = async (chatId, myUid, otherUid) => {
  await updateDoc(doc(db, 'shaadi_requests', chatId), {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', myUid), {
    maritalStatus: 'married',
    marriedAt: serverTimestamp(),
    marriedWith: otherUid,
    isActive: false,
  });
};

// Each user calls this to archive their own profile after confirmation.
export const selfArchive = (myUid, otherUid) =>
  updateDoc(doc(db, 'users', myUid), {
    maritalStatus: 'married',
    marriedAt: serverTimestamp(),
    marriedWith: otherUid,
    isActive: false,
  });

export const declineShaadi = (chatId) =>
  updateDoc(doc(db, 'shaadi_requests', chatId), { status: 'declined' });

export const submitSuccessStory = (data) =>
  addDoc(collection(db, 'success_stories'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
