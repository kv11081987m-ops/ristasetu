import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { generateUniqueRistaSetuId } from '../utils/ristaSetuId';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up any existing profile listener before switching users
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);

        profileUnsubRef.current = onSnapshot(
          userDocRef,
          async (snap) => {
            if (snap.exists()) {
              let data = snap.data();
              if (data.isBlocked) {
                await signOut(auth);
                return;
              }
              if (!data.ristaSetuId) {
                const newId = await generateUniqueRistaSetuId();
                await updateDoc(userDocRef, { ristaSetuId: newId });
                data = { ...data, ristaSetuId: newId };
              }
              setUserProfile(data);
              setIsProfileComplete(data.isProfileComplete || false);
            } else {
              setUserProfile(null);
              setIsProfileComplete(false);
            }
            setLoading(false);
          },
          (err) => {
            console.error('Profile snapshot error:', err);
            setLoading(false);
          }
        );
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsProfileComplete(false);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="text-primary text-xl font-bold animate-pulse">Loading RistaSetu...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isProfileComplete, setUserProfile, setIsProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => useContext(AuthContext);
