import React, { createContext, useContext, useState } from 'react';
import { initialInterests, initialShortlists, initialChats } from '../data/mockData';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); 
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    setLoading(true);
    
    // Profiles Listener
    const unsubProfiles = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        setProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }
    );

    // Interests Listener
    const unsubInterests = onSnapshot(collection(db, 'interests'), 
      (snapshot) => {
        setInterests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    // Shortlists Listener
    const unsubShortlists = onSnapshot(collection(db, 'shortlists'), 
      (snapshot) => {
        setShortlists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    // Chats Listener
    const unsubChats = onSnapshot(collection(db, 'chats'), 
      (snapshot) => {
        setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubProfiles();
      unsubInterests();
      unsubShortlists();
      unsubChats();
    };
  }, []);

  const login = (phone) => {
    // For admin, we could have a hardcoded check or flag
    if (phone === 'admin') {
      setCurrentUser({ id: 'admin', name: 'Administrator', role: 'admin' });
      return true;
    }
    const user = profiles.find(p => p.phone === phone);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const register = (profileData) => {
    const newProfile = {
      ...profileData,
      id: `p${Date.now()}`,
      isVerified: true, // Auto verified for MVP demo
    };
    setProfiles([...profiles, newProfile]);
    setCurrentUser(newProfile);
  };

  const sendInterest = async (receiverId, senderId) => {
    if (!senderId) return;
    try {
      await addDoc(collection(db, 'interests'), {
        senderId,
        receiverId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending interest:", error);
    }
  };

  const acceptInterest = async (interestId) => {
    try {
      const interestRef = doc(db, 'interests', interestId);
      await updateDoc(interestRef, { status: 'accepted' });
      
      const interest = interests.find(i => i.id === interestId);
      if (interest) {
        await addDoc(collection(db, 'chats'), {
          participants: [interest.senderId, interest.receiverId],
          messages: [],
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error accepting interest:", error);
    }
  };

  const declineInterest = async (interestId) => {
    try {
      const interestRef = doc(db, 'interests', interestId);
      await updateDoc(interestRef, { status: 'declined' });
    } catch (error) {
      console.error("Error declining interest:", error);
    }
  };

  const toggleShortlist = async (profileId, userId) => {
    if (!userId) return;
    const exists = shortlists.find(s => s.userId === userId && s.profileId === profileId);
    try {
      if (exists) {
        await deleteDoc(doc(db, 'shortlists', exists.id));
      } else {
        await addDoc(collection(db, 'shortlists'), {
          userId,
          profileId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error toggling shortlist:", error);
    }
  };

  const sendMessage = async (chatId, text, senderId) => {
    if (!senderId) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        messages: arrayUnion({
          id: `m${Date.now()}`,
          senderId,
          text,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Admin functions
  const verifyProfile = (profileId) => {
    setProfiles(profiles.map(p => p.id === profileId ? { ...p, isVerified: true } : p));
  };
  
  const banProfile = (profileId) => {
    setProfiles(profiles.filter(p => p.id !== profileId));
  };

  return (
    <AppContext.Provider value={{
      currentUser, profiles, loading, interests, shortlists, chats,
      login, logout, register, sendInterest, acceptInterest, declineInterest, toggleShortlist, sendMessage,
      verifyProfile, banProfile
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
