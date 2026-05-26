import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import Button from '../components/Button';

const OTP_ERROR_MESSAGES = {
  'auth/too-many-requests': 'Bahut zyada attempts. Kuch der baad try karein.',
  'auth/invalid-phone-number': 'Phone number sahi format mein nahi hai.',
  'auth/quota-exceeded': 'SMS quota khatam ho gaya. Kal try karein.',
  'auth/network-request-failed': 'Network error. Internet connection check karein.',
  'auth/invalid-verification-code': 'OTP galat hai. Dobara check karein.',
  'auth/code-expired': 'OTP expire ho gaya. Dobara bhejein.',
  'auth/missing-phone-number': 'Phone number dalna zaroori hai.',
};

const getOtpErrorMsg = (err) =>
  OTP_ERROR_MESSAGES[err.code] || 'Kuch galat hua. Dobara try karein.';

const RESEND_COUNTDOWN = 60;

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(RESEND_COUNTDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.render().then(widgetId => {
        if (window.grecaptcha?.reset) window.grecaptcha.reset(widgetId);
      }).catch(() => {});
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmResult);
      startResendTimer();
    } catch (err) {
      console.error(err);
      setError(getOtpErrorMsg(err));
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmResult);
      startResendTimer();
    } catch (err) {
      setError(getOtpErrorMsg(err));
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create minimal user document — role is NEVER set client-side.
        // To grant admin access, set role:'admin' directly in Firebase Console.
        await setDoc(userDocRef, {
          phone: user.phoneNumber,
          createdAt: serverTimestamp(),
          isProfileComplete: false,
        });
      }

      // Route to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(getOtpErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-[70vh] page-transition">
      <div className="bg-surface shadow-md rounded-lg p-6 w-full max-w-md border">
        <h2 className="font-bold text-2xl mb-2 text-center text-primary">Login / Sign Up</h2>
        <p className="text-light text-center mb-6 text-sm">Enter your mobile number to get started</p>
        
        {error && <div className="text-xs text-center mb-4 font-bold" style={{ color: '#DC2626' }}>{error}</div>}
        
        {!confirmationResult ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="flex">
                <span className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500 font-medium">
                  +91
                </span>
                <input 
                  type="tel" 
                  className="form-input rounded-l-none w-full border-gray-300" 
                  placeholder="9876543210" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  required
                />
              </div>
            </div>
            
            <Button type="submit" variant="primary" className="w-full font-bold" disabled={loading || phoneNumber.length < 10}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Enter OTP Validation Code</label>
              <input 
                type="text" 
                className="form-input text-center tracking-widest text-lg" 
                placeholder="• • • • • •" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                required
              />
              <p className="text-xs text-light mt-2 text-center">We've sent a code to +91 {phoneNumber}</p>
            </div>
            
            <Button type="submit" variant="primary" className="w-full font-bold" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="text-sm text-secondary font-bold hover:underline bg-transparent border-none cursor-pointer"
                onClick={() => { setConfirmationResult(null); setOtp(''); setError(''); if (timerRef.current) clearInterval(timerRef.current); setResendTimer(0); }}
              >
                Number badlein
              </button>
              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleResendOtp}
                className="text-sm font-bold bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                style={{ color: resendTimer > 0 ? '#9CA3AF' : '#DC2626' }}
              >
                {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Essential placeholder for Firebase's Invisible Recaptcha */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;
