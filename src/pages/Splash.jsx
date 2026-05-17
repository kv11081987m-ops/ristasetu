import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Button from '../components/Button';
import { ShieldCheck } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

const Splash = () => {
  const { currentUser } = useAuthContext();
  const [ageConsent, setAgeConsent] = useState(false);

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container flex flex-col items-center justify-center text-center page-transition" style={{ minHeight: '80vh' }}>
      <ShieldCheck color="var(--primary)" size={80} className="mb-4" />
      <h1 className="text-primary font-bold mb-2" style={{ fontSize: '3rem', fontFamily: 'Georgia, serif' }}>RistaSetu</h1>
      <p className="text-light text-xl mb-8 max-w-md">Gorakhpur aur Deoria ka sabse bharosemand matrimony platform.</p>

      {/* Age consent checkbox */}
      <label className="flex items-center gap-3 mb-6 cursor-pointer max-w-sm">
        <input
          type="checkbox"
          checked={ageConsent}
          onChange={(e) => setAgeConsent(e.target.checked)}
          className="w-5 h-5 accent-red-600 cursor-pointer flex-shrink-0"
        />
        <span className="text-sm text-gray-600 text-left">
          Main confirm karta/karti hoon ki meri age <strong>18 saal ya usse zyada</strong> hai aur main India ke kanoon ke anusaar vivah ke yogya hoon.
        </span>
      </label>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <Link to="/login" className={`w-full ${!ageConsent ? 'pointer-events-none opacity-50' : ''}`}>
          <Button variant="primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }} disabled={!ageConsent}>Login</Button>
        </Link>
        <Link to="/register" className={`w-full ${!ageConsent ? 'pointer-events-none opacity-50' : ''}`}>
          <Button variant="outline" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }} disabled={!ageConsent}>Profile Banayein</Button>
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-8 max-w-xs">
        Aage badhne par aap hamare{' '}
        <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link>
        {' '}aur{' '}
        <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        {' '}se sahmat hote hain.
      </p>
    </div>
  );
};

export default Splash;
