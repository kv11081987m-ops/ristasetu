import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Using relative path safely
import Button from '../components/Button';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Setup invisible recaptcha
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber
        }
      });
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmResult);
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Remember to provide valid SMS format.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          if (typeof window.recaptchaReset === 'function') {
            window.recaptchaReset(widgetId);
          } else if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
            window.grecaptcha.reset(widgetId);
          }
        });
      }
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
        // Create new user profile document
        const isAdmin = user.phoneNumber === '+918010703233' || user.phoneNumber === '8010703233';
        await setDoc(userDocRef, {
          phone: user.phoneNumber,
          createdAt: serverTimestamp(),
          hasProfile: false,
          role: isAdmin ? 'admin' : 'user'
        });
      } else if (user.phoneNumber === '+918010703233' || user.phoneNumber === '8010703233') {
        // Ensure existing user with this number also gets admin role
        const data = userDoc.data();
        if (data.role !== 'admin') {
          await setDoc(userDocRef, { role: 'admin' }, { merge: true });
        }
      }

      // Route to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP code. Please try again.');
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
            
            <button 
              type="button"
              className="text-sm text-secondary font-bold hover:underline bg-transparent border-none cursor-pointer mt-2"
              onClick={() => { setConfirmationResult(null); setOtp(''); setError(''); }}
            >
              Change Phone Number
            </button>
          </form>
        )}

        {/* Essential placeholder for Firebase's Invisible Recaptcha */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;
