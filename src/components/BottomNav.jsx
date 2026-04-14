import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const BottomNav = () => {
  const { currentUser } = useAppContext();

  if (!currentUser) return null;

  const getStyle = ({ isActive }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? 'var(--primary)' : 'var(--text-light)',
    padding: '0.5rem',
    flex: '1',
    textDecoration: 'none'
  });

  return (
    <nav className="bg-surface shadow-md border-t md:hidden" style={{ 
      position: 'fixed', 
      bottom: 0, left: 0, right: 0, 
      display: 'flex', 
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)'
    }}>
      <NavLink to="/" style={getStyle}>
        <Home size={24} />
        <span className="text-xs mt-1">Home</span>
      </NavLink>
      <NavLink to="/search" style={getStyle}>
        <Search size={24} />
        <span className="text-xs mt-1">Search</span>
      </NavLink>
      <NavLink to="/interests" style={getStyle}>
        <Heart size={24} />
        <span className="text-xs mt-1">Interests</span>
      </NavLink>
      <NavLink to="/chat" style={getStyle}>
        <MessageCircle size={24} />
        <span className="text-xs mt-1">Chats</span>
      </NavLink>
      <NavLink to="/settings" style={getStyle}>
        <User size={24} />
        <span className="text-xs mt-1">Me</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
