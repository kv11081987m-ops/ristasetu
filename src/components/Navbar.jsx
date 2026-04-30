import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCircle, LogOut, User, Settings, SlidersHorizontal, Home as HomeIcon, MessageCircle, Bell, Crown } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useNotificationContext } from '../context/NotificationContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const Navbar = () => {
  const { currentUser, userProfile } = useAuthContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
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
    if (userProfile?.photoUrl) return userProfile.photoUrl;
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
            <>
              <nav className="hidden md:flex items-center gap-6 mr-4 text-gray-600 font-medium transition-all">
                <Link to="/dashboard" className="flex items-center gap-2 hover:text-primary transition-colors"><HomeIcon size={20} /> Home</Link>
                <Link to="/chat" className="flex items-center gap-2 hover:text-primary transition-colors"><MessageCircle size={20} /> Chats</Link>
              </nav>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors relative"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 border border-gray-100 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] text-red-600 hover:underline font-bold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.status === 'unread' ? 'bg-red-50/30' : ''}`}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.type === 'message') navigate('/chat');
                              if (notif.type === 'interest') navigate('/interests');
                              setIsNotifOpen(false);
                            }}
                          >
                            <p className="text-sm text-gray-800">
                              <span className="font-bold">{notif.fromName}</span> {notif.type === 'interest' ? 'sent you an interest' : 'sent you a message'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {notif.createdAt?.toDate().toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                    to="/dashboard" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <User size={16} />
                    My Dashboard
                  </Link>

                  <Link 
                    to="/interests" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <SlidersHorizontal size={16} />
                    My Interests
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  
                  {userProfile?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <ShieldCheck size={16} />
                      Admin Dashboard
                    </Link>
                  )}

                  <Link 
                    to="/premium" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Crown size={16} />
                    Upgrade to Premium
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
            </>
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
