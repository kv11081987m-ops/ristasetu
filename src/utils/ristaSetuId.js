import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const generateUniqueRistaSetuId = async () => {
  let id;
  let isUnique = false;
  while (!isUnique) {
    const digits = Math.floor(100000 + Math.random() * 900000);
    id = `RS${digits}`;
    const snap = await getDocs(query(collection(db, 'users'), where('ristaSetuId', '==', id)));
    if (snap.empty) isUnique = true;
  }
  return id;
};
