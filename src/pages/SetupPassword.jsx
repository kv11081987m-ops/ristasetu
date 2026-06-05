import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { Key, Eye, EyeOff } from 'lucide-react';
import { hashPassword } from '../utils/cryptoUtils';

const SetupPassword = () => {
  const { currentUser, userProfile, setUserProfile } = useAuthContext();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goNext = () => {
    if (!userProfile?.isProfileComplete) {
      navigate('/complete-profile');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password minimum 8 characters hona chahiye.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rsId = userProfile.ristaSetuId.toUpperCase();
      const virtualEmail = `${rsId.toLowerCase()}@ristasetu.app`;
      const pwHash = await hashPassword(password);

      const credential = EmailAuthProvider.credential(virtualEmail, pwHash);
      await linkWithCredential(auth.currentUser, credential);
      await auth.currentUser.getIdToken(true);

      await Promise.all([
        updateDoc(doc(db, 'users', currentUser.uid), { hasPassword: true }),
        setDoc(doc(db, 'password_index', rsId), {
          uid: currentUser.uid,
          hasPassword: true,
          passwordHash: pwHash,
        }),
      ]);
      setUserProfile(prev => ({ ...prev, hasPassword: true }));
      goNext();
    } catch (err) {
      console.error('SetupPassword error:', err.code, err.message);
      if (err.code === 'auth/provider-already-linked') {
        // Email/password already linked — may be a retry. Update hasPassword in Firestore.
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), { hasPassword: true });
          setUserProfile(prev => ({ ...prev, hasPassword: true }));
        } catch (_) { /* ignore */ }
        setError('Password pehle se set tha. Settings mein "Password Change Karo" use karein.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Password login enable nahi hai. Admin se contact karein: ristasetu@gmail.com');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error — internet check karein aur dobara try karein.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password bahut chhota hai — minimum 8 characters chahiye.');
      } else if (err.code === 'auth/email-already-in-use' || err.code === 'auth/credential-already-in-use') {
        setError('Account conflict. Support se contact karein: ristasetu@gmail.com');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Session expire ho gayi. Logout karke dobara OTP se login karein.');
      } else {
        setError(`Password set nahi hua (${err.code || 'unknown'}). Dobara try karein.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-[70vh] page-transition">
      <div className="bg-surface shadow-md rounded-lg p-6 w-full max-w-md border">
        <div className="flex items-center gap-3 mb-2">
          <Key size={28} className="text-red-600" />
          <h2 className="font-bold text-2xl text-primary">Password Set Karein</h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Ek baar password set karein — agle baar sirf RistaSetu ID + Password se login ho jaayega. OTP ki zaroorat nahi padegi.
        </p>

        {error && (
          <div className="text-xs text-center mb-4 font-bold text-red-600">{error}</div>
        )}

        <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Naya Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input w-full pr-10"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                onClick={() => setShowPassword(p => !p)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold"
            disabled={loading || password.length < 8}
          >
            {loading ? 'Setting...' : 'Password Set Karo'}
          </Button>
        </form>

        <button
          type="button"
          className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer py-2"
          onClick={goNext}
        >
          Abhi Nahi — Baad mein Settings se set karunga
        </button>
      </div>
    </div>
  );
};

export default SetupPassword;
