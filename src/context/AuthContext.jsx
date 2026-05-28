import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { generateUniqueRistaSetuId } from '../utils/ristaSetuId';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            let data = userDoc.data();
            // If admin has blocked this user, force sign-out immediately
            if (data.isBlocked) {
              await signOut(auth);
              return;
            }
            // Auto-assign ristaSetuId for existing users who don't have one
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
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setIsProfileComplete(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsProfileComplete(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
