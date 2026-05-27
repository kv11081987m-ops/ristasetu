import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, limit, orderBy } from 'firebase/firestore';
import { useAuthContext } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { currentUser: authUser } = useAuthContext();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [chats, setChats] = useState([]);

  // All profiles — only start listener once Firebase Auth has restored the session.
  useEffect(() => {
    if (!authUser?.uid) return;
    const usersQuery = query(
      collection(db, 'users'),
      where('isProfileComplete', '==', true),
      limit(200)
    );
    const unsub = onSnapshot(
      usersQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort client-side to avoid composite index requirement
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0);
          const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0);
          return tb - ta;
        });
        setProfiles(docs);
        setLoading(false);
      },
      (error) => {
        console.error('Profiles onSnapshot error:', error.code, error.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [authUser?.uid]);

  // Merge two interest subscriptions (sent + received) into one state array
  const interestMapRef = useRef(new Map());
  useEffect(() => {
    const uid = authUser?.uid;
    const map = interestMapRef.current;

    if (!uid) {
      map.clear();
      setInterests([]); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    const sync = () => setInterests([...map.values()]);

    const handleChanges = (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') {
          map.delete(change.doc.id);
        } else {
          map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        }
      });
      sync();
    };

    const unsubSent = onSnapshot(
      query(collection(db, 'interests'), where('senderId', '==', uid)),
      handleChanges
    );
    const unsubReceived = onSnapshot(
      query(collection(db, 'interests'), where('receiverId', '==', uid)),
      handleChanges
    );

    return () => { unsubSent(); unsubReceived(); map.clear(); };
  }, [authUser?.uid]);

  // Shortlists — only current user's
  useEffect(() => {
    const uid = authUser?.uid;
    if (!uid) {
      setShortlists([]); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    return onSnapshot(
      query(collection(db, 'shortlists'), where('userId', '==', uid)),
      (snap) => setShortlists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [authUser?.uid]);

  // Chats — only chats where user is a participant
  useEffect(() => {
    const uid = authUser?.uid;
    if (!uid) {
      setChats([]); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    return onSnapshot(
      query(collection(db, 'chats'), where('participants', 'array-contains', uid)),
      (snap) => setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [authUser?.uid]);

  const DAILY_INTEREST_LIMIT = 10;
  const PENDING_INTEREST_LIMIT = 20;

  const sendInterest = async (receiverId, senderId) => {
    if (!senderId) return;

    const now = Date.now();
    const msIn24h = 24 * 60 * 60 * 1000;

    const mySent = interests.filter(i => i.senderId === senderId);

    const todayCount = mySent.filter(i => {
      const ts = i.createdAt?.toDate?.() ?? (i.createdAt?.seconds ? new Date(i.createdAt.seconds * 1000) : null);
      return ts && now - ts.getTime() < msIn24h;
    }).length;

    if (todayCount >= DAILY_INTEREST_LIMIT) {
      throw new Error('DAILY_LIMIT');
    }

    const pendingCount = mySent.filter(i => i.status === 'pending').length;
    if (pendingCount >= PENDING_INTEREST_LIMIT) {
      throw new Error('PENDING_LIMIT');
    }

    await addDoc(collection(db, 'interests'), {
      senderId,
      receiverId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  };

  const acceptInterest = async (interestId) => {
    try {
      const interestRef = doc(db, 'interests', interestId);
      await updateDoc(interestRef, { status: 'accepted' });

      const interest = interests.find(i => i.id === interestId);
      if (interest) {
        await addDoc(collection(db, 'chats'), {
          participants: [interest.senderId, interest.receiverId],
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('acceptInterest error:', err);
      throw err;
    }
  };

  const declineInterest = async (interestId) => {
    try {
      await updateDoc(doc(db, 'interests', interestId), { status: 'declined' });
    } catch (err) {
      console.error('declineInterest error:', err);
      throw err;
    }
  };

  const toggleShortlist = async (profileId, userId) => {
    if (!userId) return;
    try {
      const exists = shortlists.find(s => s.profileId === profileId);
      if (exists) {
        await deleteDoc(doc(db, 'shortlists', exists.id));
      } else {
        await addDoc(collection(db, 'shortlists'), {
          userId,
          profileId,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('toggleShortlist error:', err);
      throw err;
    }
  };

  const sendMessage = async (chatId, text, senderId) => {
    if (!senderId) return;
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId,
        text,
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('sendMessage error:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{
      profiles, loading, interests, shortlists, chats,
      sendInterest, acceptInterest, declineInterest, toggleShortlist, sendMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
