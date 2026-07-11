import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center page-transition">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg,#DC2626,#991B1B)', boxShadow: '0 8px 24px rgba(220,38,38,0.2)' }}
      >
        <span className="text-4xl font-black text-white">?</span>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2">Page nahi mila</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        Yeh page exist nahi karta ya hata diya gaya hai.
      </p>

      <button
        onClick={() => navigate('/dashboard', { replace: true })}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm border-none cursor-pointer transition-all"
        style={{ background: 'linear-gradient(135deg,#DC2626,#991B1B)', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}
      >
        <Home size={15} strokeWidth={2.5} />
        Home pe jaao
      </button>
    </div>
  );
};

export default NotFound;
