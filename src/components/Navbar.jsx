import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCircle, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Navbar = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-surface shadow-sm" style={{ padding: '1rem 0', position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="container flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck color="var(--primary)" size={28} />
          <h1 className="font-bold text-2xl text-primary m-0" style={{ fontFamily: 'Georgia, serif' }}>
            RistaSetu
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              <span className="mobile-hidden text-sm font-medium">Hello, {currentUser.name.split(' ')[0]}!</span>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 text-light border" 
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer' }}
              >
                <LogOut size={18} />
                <span className="mobile-hidden">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="text-primary font-medium flex items-center gap-1">
              <UserCircle size={20} /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
