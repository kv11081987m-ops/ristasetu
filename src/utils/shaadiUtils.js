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

// Receiver confirms: flips request status. Archiving both profiles happens
// server-side in the onShaadiConfirmed Cloud Function trigger, independent
// of whether the initiator's client is online to observe this change.
export const confirmShaadi = (chatId) =>
  updateDoc(doc(db, 'shaadi_requests', chatId), {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
  });

export const declineShaadi = (chatId) =>
  updateDoc(doc(db, 'shaadi_requests', chatId), { status: 'declined' });

export const submitSuccessStory = (data) =>
  addDoc(collection(db, 'success_stories'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
