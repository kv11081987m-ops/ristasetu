import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { generateUniqueRistaSetuId } from '../utils/ristaSetuId';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [familyMode, setFamilyMode] = useState(null); // { linkedUserId, memberName, relation }
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
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

              // Detect family account: no own complete profile + family_access entry exists
              if (data.isFamilyAccount && user.phoneNumber) {
                try {
                  const famSnap = await getDoc(doc(db, 'family_access', user.phoneNumber));
                  if (famSnap.exists() && famSnap.data().status === 'active') {
                    const fd = famSnap.data();
                    setFamilyMode({ linkedUserId: fd.linkedUserId, memberName: fd.name, relation: fd.relation });
                  } else {
                    setFamilyMode(null);
                  }
                } catch { setFamilyMode(null); }
                setUserProfile(data);
                setIsProfileComplete(false);
                setLoading(false);
                return;
              }

              if (!data.ristaSetuId) {
                const newId = await generateUniqueRistaSetuId();
                await updateDoc(userDocRef, { ristaSetuId: newId });
                data = { ...data, ristaSetuId: newId };
              }
              setFamilyMode(null);
              setUserProfile(data);
              setIsProfileComplete(data.isProfileComplete || false);
            } else {
              setUserProfile(null);
              setIsProfileComplete(false);
              setFamilyMode(null);
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
        setFamilyMode(null);
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
    <AuthContext.Provider value={{ currentUser, userProfile, isProfileComplete, familyMode, setUserProfile, setIsProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => useContext(AuthContext);
