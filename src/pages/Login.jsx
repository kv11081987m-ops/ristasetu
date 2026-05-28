import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RecaptchaVerifier, signInWithPhoneNumber,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, query, collection, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { MessageSquare, KeyRound, Eye, EyeOff, Smartphone, BadgeCheck, ArrowLeft } from 'lucide-react';

const OTP_ERRORS = {
  'auth/too-many-requests':        'Bahut zyada attempts. Kuch der baad try karein.',
  'auth/invalid-phone-number':     'Phone number sahi format mein nahi hai.',
  'auth/quota-exceeded':           'SMS quota khatam ho gaya. Kal try karein.',
  'auth/network-request-failed':   'Network error. Internet check karein.',
  'auth/invalid-verification-code':'OTP galat hai. Dobara check karein.',
  'auth/code-expired':             'OTP expire ho gaya. Dobara bhejein.',
  'auth/missing-phone-number':     'Phone number dalna zaroori hai.',
};
const otpErr = (err) => OTP_ERRORS[err.code] || 'Kuch galat hua. Dobara try karein.';

const RESEND_COUNTDOWN = 60;

const Login = () => {
  const [identifier, setIdentifier]     = useState('');
  const [loginMode, setLoginMode]       = useState('otp'); // 'otp' | 'password'
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp]                   = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // ── Input detection ───────────────────────────────────────────────────────
  const isPhone    = /^\d{10}$/.test(identifier);
  const isRsId     = /^RS\d{6}$/i.test(identifier);
  const partialPh  = /^\d{1,9}$/.test(identifier);
  const partialRs  = /^RS\d{0,5}$/i.test(identifier) && identifier.length > 1;

  const handleIdentifierChange = (raw) => {
    let val = raw;
    if (!val || /^\d/.test(val)) {
      val = raw.replace(/\D/g, '').slice(0, 10);
    } else {
      val = raw.toUpperCase().slice(0, 8);
    }
    setIdentifier(val);
    setError('');
    // Auto-switch mode when type becomes clear
    if (val && /^\d/.test(val) && loginMode !== 'otp')      setLoginMode('otp');
    if (val && /^RS/i.test(val) && loginMode !== 'password') setLoginMode('password');
  };

  const switchMode = (mode) => { setLoginMode(mode); setError(''); setPassword(''); };

  const hint = (() => {
    if (!identifier) return null;
    if (isPhone)   return { Icon: Smartphone,   text: 'Mobile number detect hua',           cls: 'text-green-600' };
    if (isRsId)    return { Icon: BadgeCheck,    text: 'RistaSetu ID detect hua',            cls: 'text-blue-600'  };
    if (partialPh) return { Icon: Smartphone,   text: `${10 - identifier.length} aur digits chahiye`, cls: 'text-gray-400' };
    if (partialRs) return { Icon: BadgeCheck,    text: `RS + 6 digits chahiye`,              cls: 'text-gray-400'  };
    return null;
  })();

  // ── Firebase recaptcha ────────────────────────────────────────────────────
  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible', callback: () => {},
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(RESEND_COUNTDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
    }, 1000);
  };

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.render().then(id => { window.grecaptcha?.reset?.(id); }).catch(() => {});
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loginMode === 'otp') {
      if (!isPhone) { setError('OTP ke liye 10 digit mobile number chahiye.'); return; }
      setLoading(true);
      try {
        const result = await signInWithPhoneNumber(auth, `+91${identifier}`, window.recaptchaVerifier);
        setConfirmationResult(result);
        startResendTimer();
      } catch (err) {
        console.error(err); setError(otpErr(err)); resetRecaptcha();
      } finally { setLoading(false); }

    } else {
      if (!isRsId)    { setError('RS ID sahi format mein nahi hai (RS + 6 digits).'); return; }
      if (!password)  { setError('Password dalna zaroori hai.'); return; }
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('ristaSetuId', '==', identifier.toUpperCase())));
        if (snap.empty) { setError('Yeh RistaSetu ID exist nahi karti.'); return; }
        const ud = snap.docs[0].data();
        if (!ud.hasPassword || !ud.loginEmail) {
          setError('Aapne password set nahi kiya. Mobile OTP se login karein.');
          return;
        }
        const cred = await signInWithEmailAndPassword(auth, ud.loginEmail, password);
        const sessionToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('rsSessionToken', sessionToken);
        await updateDoc(doc(db, 'users', cred.user.uid), { currentSessionToken: sessionToken });
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Password galat hai.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Bahut zyada attempts. Kuch der baad try karein.');
        } else {
          setError('Login fail hua. Dobara try karein.');
        }
      } finally { setLoading(false); }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(''); setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const sessionToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('rsSessionToken', sessionToken);
      let hasPassword = false;
      if (!snap.exists()) {
        await setDoc(ref, { phone: user.phoneNumber, createdAt: serverTimestamp(), isProfileComplete: false, currentSessionToken: sessionToken });
      } else {
        hasPassword = snap.data().hasPassword || false;
        await updateDoc(ref, { currentSessionToken: sessionToken });
      }
      navigate(hasPassword ? '/dashboard' : '/setup-password');
    } catch (err) {
      console.error(err); setError(otpErr(err));
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(''); setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, `+91${identifier}`, window.recaptchaVerifier);
      setConfirmationResult(result); startResendTimer();
    } catch (err) { setError(otpErr(err)); resetRecaptcha(); }
    finally { setLoading(false); }
  };

  const handleBack = () => {
    setConfirmationResult(null); setOtp(''); setError('');
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  };

  // ── Submit button disabled logic ──────────────────────────────────────────
  const submitDisabled = loading || (
    loginMode === 'otp'
      ? !isPhone
      : (!isRsId || !password)
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex justify-center items-center min-h-[75vh] page-transition px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
               style={{ background: 'linear-gradient(135deg,#DC2626,#991B1B)', boxShadow: '0 8px 24px rgba(220,38,38,0.25)' }}>
            <span className="text-2xl font-black text-white tracking-tight">R</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">RistaSetu</h1>
          <p className="text-gray-400 text-sm mt-1">Login karo ya nayi ID banao</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">

            {/* ── OTP Verify Phase ─────────────────────────────────── */}
            {confirmationResult ? (
              <div>
                <button
                  type="button" onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer mb-5 p-0 font-medium"
                >
                  <ArrowLeft size={13} /> Wapas jaao
                </button>

                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-5">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Smartphone size={16} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">OTP bheja gaya</p>
                    <p className="font-bold text-gray-800 text-sm">+91 {identifier}</p>
                  </div>
                </div>

                {error && <p className="text-xs font-bold text-red-600 text-center mb-3">{error}</p>}

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                  <input
                    type="text" inputMode="numeric"
                    className="form-input text-center tracking-[0.5em] text-xl font-bold py-3"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6} autoFocus required
                  />
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-3 font-bold rounded-xl text-sm transition-all border-none cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      background: (loading || otp.length < 6) ? '#E5E7EB' : 'linear-gradient(135deg,#DC2626,#991B1B)',
                      color: (loading || otp.length < 6) ? '#9CA3AF' : '#fff',
                    }}
                  >
                    {loading ? 'Verify ho raha hai...' : 'Verify Karo'}
                  </button>
                </form>

                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-xs font-bold bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                    style={{ color: resendTimer > 0 ? '#9CA3AF' : '#DC2626' }}
                  >
                    {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
                  </button>
                </div>
              </div>

            ) : (
              /* ── Main Login Form ──────────────────────────────────── */
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                {/* Single identifier input */}
                <div>
                  <input
                    type="text"
                    className="form-input w-full font-medium"
                    placeholder="RS-XXXXXX ya 9XXXXXXXXX"
                    value={identifier}
                    onChange={e => handleIdentifierChange(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                  {hint && (
                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-semibold ${hint.cls}`}>
                      <hint.Icon size={11} strokeWidth={2.5} />
                      {hint.text}
                    </div>
                  )}
                </div>

                {/* Mode toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  <button
                    type="button" onClick={() => switchMode('otp')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all border-none cursor-pointer ${
                      loginMode === 'otp'
                        ? 'bg-white shadow-sm text-red-600'
                        : 'bg-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <MessageSquare size={13} strokeWidth={2.5} /> OTP
                  </button>
                  <button
                    type="button" onClick={() => switchMode('password')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all border-none cursor-pointer ${
                      loginMode === 'password'
                        ? 'bg-white shadow-sm text-red-600'
                        : 'bg-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <KeyRound size={13} strokeWidth={2.5} /> Password
                  </button>
                </div>

                {/* Password field */}
                {loginMode === 'password' && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input w-full pr-10"
                      placeholder="Password dalein"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                )}

                {/* Error */}
                {error && <p className="text-xs font-bold text-red-600 text-center -mt-1">{error}</p>}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="w-full py-3 font-bold rounded-xl text-sm transition-all border-none cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    background: submitDisabled ? '#E5E7EB' : 'linear-gradient(135deg,#DC2626,#991B1B)',
                    color: submitDisabled ? '#9CA3AF' : '#fff',
                    boxShadow: submitDisabled ? 'none' : '0 4px 14px rgba(220,38,38,0.3)',
                  }}
                >
                  {loading
                    ? (loginMode === 'otp' ? 'OTP bheja ja raha hai...' : 'Login ho raha hai...')
                    : (loginMode === 'otp' ? 'OTP Bhejo' : 'Login Karo')
                  }
                </button>

                {/* Cross-mode hints */}
                {loginMode === 'password' && isPhone && (
                  <p className="text-xs text-gray-400 text-center -mt-1">
                    Mobile ke saath sirf OTP kaam karta hai.{' '}
                    <button type="button" className="text-red-600 font-bold bg-transparent border-none cursor-pointer hover:underline" onClick={() => switchMode('otp')}>
                      OTP use karein
                    </button>
                  </p>
                )}
                {loginMode === 'otp' && isRsId && (
                  <p className="text-xs text-gray-400 text-center -mt-1">
                    RS ID ke saath password login karein.{' '}
                    <button type="button" className="text-red-600 font-bold bg-transparent border-none cursor-pointer hover:underline" onClick={() => switchMode('password')}>
                      Password use karein
                    </button>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Login karke aap{' '}
          <a href="/about#terms" className="text-red-600 hover:underline">Terms of Service</a>
          {' '}se sehmat hote hain
        </p>
      </div>

      <div id="recaptcha-container" />
    </div>
  );
};

export default Login;
