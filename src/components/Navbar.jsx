import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCircle, LogOut, User, Settings, SlidersHorizontal } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const Navbar = () => {
  const { currentUser, userProfile } = useAuthContext();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getProfileImageUrl = () => {
    if (userProfile?.profileImages && userProfile.profileImages.length > 0) {
      return userProfile.profileImages[0];
    }
    if (userProfile?.photoURL) {
      return userProfile.photoURL;
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 outline-none">
          <ShieldCheck className="text-red-600" size={28} />
          <h1 className="font-bold text-2xl text-red-600 m-0" style={{ fontFamily: 'Georgia, serif' }}>
            RistaSetu
          </h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center focus:outline-none"
              >
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-red-100 hover:border-red-300 transition-colors"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-200 hover:border-red-300 transition-colors">
                    <UserCircle className="text-red-600" size={24} />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {userProfile?.name || 'User Profile'}
                    </p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  
                  <Link 
                    to="/filter" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <SlidersHorizontal size={16} />
                    Filter
                  </Link>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-red-600 font-bold flex items-center gap-2 px-4 py-2 rounded-md hover:bg-red-50 transition-colors border border-red-600"
            >
              <UserCircle size={20} /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
