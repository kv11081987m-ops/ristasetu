import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuthContext } from './AuthContext';

const NotificationContext = createContext();

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Removed orderBy('createdAt', 'desc') to avoid index requirement.
    // We will sort the data locally instead.
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      let unread = 0;
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        notifs.push(data);
        if (data.status === 'unread') {
          unread++;
        }
      });

      // Local sorting: Most recent first
      const sortedNotifs = notifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setNotifications(sortedNotifs);
      setUnreadCount(unread);
    }, (error) => {
      console.error("Firestore Notification Error:", error);
      if (error.code === 'failed-precondition') {
        console.warn("Missing Index for Notifications. Sorting handled locally.");
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { status: 'read' });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => n.status === 'unread');
      const promises = unreadNotifs.map(n => 
        updateDoc(doc(db, 'notifications', n.id), { status: 'read' })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const sendNotification = async (recipientId, type, fromName) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        type,
        fromId: currentUser.uid,
        fromName,
        status: 'unread',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      sendNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
