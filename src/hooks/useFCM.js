import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase/firebaseConfig';
import { db } from '../firebase/firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const useFCM = (currentUser, showToast) => {
  useEffect(() => {
    if (!currentUser || !messaging || !VAPID_KEY) return;

    let unsubForeground = () => {};

    const setup = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        await updateDoc(doc(db, 'users', currentUser.uid), {
          fcmTokens: arrayUnion(token),
        });
      } catch (err) {
        // Non-fatal — user may have denied, or browser may not support it
        console.warn('FCM setup:', err.message);
      }

      // Foreground message handler (app is open)
      unsubForeground = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'RistaSetu';
        const body  = payload.notification?.body  || '';
        showToast(`${title} — ${body}`, 'info', 5000);
      });
    };

    setup();
    return () => unsubForeground();
  }, [currentUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
};
