import React, { createContext, useContext, useState } from 'react';
import { initialProfiles, initialInterests, initialShortlists, initialChats } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // null if not logged in
  const [profiles, setProfiles] = useState(initialProfiles);
  const [interests, setInterests] = useState(initialInterests);
  const [shortlists, setShortlists] = useState(initialShortlists);
  const [chats, setChats] = useState(initialChats);

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

  const sendInterest = (receiverId) => {
    if (!currentUser) return;
    const newInterest = {
      id: `i${Date.now()}`,
      senderId: currentUser.id,
      receiverId: receiverId,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setInterests([...interests, newInterest]);
  };

  const acceptInterest = (interestId) => {
    setInterests(interests.map(i => i.id === interestId ? { ...i, status: 'accepted' } : i));
    const interest = interests.find(i => i.id === interestId);
    if (interest) {
      const newChat = {
        id: `c${Date.now()}`,
        participants: [interest.senderId, interest.receiverId],
        messages: []
      };
      setChats([...chats, newChat]);
    }
  };

  const declineInterest = (interestId) => {
    setInterests(interests.map(i => i.id === interestId ? { ...i, status: 'declined' } : i));
  };

  const toggleShortlist = (profileId) => {
    if (!currentUser) return;
    const exists = shortlists.find(s => s.userId === currentUser.id && s.profileId === profileId);
    if (exists) {
      setShortlists(shortlists.filter(s => s.id !== exists.id));
    } else {
      setShortlists([...shortlists, { id: `s${Date.now()}`, userId: currentUser.id, profileId }]);
    }
  };

  const sendMessage = (chatId, text) => {
    if (!currentUser) return;
    setChats(chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...c.messages, { id: `m${Date.now()}`, senderId: currentUser.id, text, timestamp: new Date().toISOString() }]
        };
      }
      return c;
    }));
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
      currentUser, profiles, interests, shortlists, chats,
      login, logout, register, sendInterest, acceptInterest, declineInterest, toggleShortlist, sendMessage,
      verifyProfile, banProfile
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
