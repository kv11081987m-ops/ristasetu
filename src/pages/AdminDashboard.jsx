import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { 
  ShieldCheck, CheckCircle, XCircle, Loader2, Users, UserCheck, Clock, 
  Menu, X, LayoutDashboard, Settings, LogOut, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'users'), 
      (querySnapshot) => {
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleVerification = async (userId, currentStatus) => {
    try {
      setUpdatingId(userId);
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentStatus;
      
      await updateDoc(userRef, {
        isVerified: newStatus,
        kycStatus: newStatus ? 'verified' : 'not_started'
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isVerified: newStatus } : user
      ));
      
      setNotification({
        message: `User ${newStatus ? 'verified' : 'unverified'} successfully!`,
        type: 'success'
      });
      
      // Auto-hide notification
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error toggling verification:", error);
      alert("Failed to update verification status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    pending: users.filter(u => !u.isVerified).length,
  };

  const filteredUsers = users.filter(user => {
    const name = (user.name || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return name.includes(term) || phone.includes(term) || email.includes(term);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-500 font-medium">Initializing Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-xl text-gray-800 tracking-tight">RistaSetu Admin</span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-bold transition-all">
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-all">
              <Users size={20} /> Users Management
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-all">
              <Bell size={20} /> Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-all">
              <Settings size={20} /> System Settings
            </button>
          </nav>

          <div className="p-4 border-t border-gray-50">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all"
            >
              <LogOut size={20} /> Exit to App
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800">Admin Panel</span>
          <div className="w-10"></div>
        </header>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="p-4 bg-green-100 text-green-600 rounded-2xl">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Verified Profiles</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.verified}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pending}</h3>
              </div>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-800">User Directory</h2>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by name, phone or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-gray-100 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-full sm:w-80 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-gray-400">Basic Info</th>
                    <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-gray-400">Contact Details</th>
                    <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-gray-400">Verification</th>
                    <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-gray-400">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-50">
                            {user.photoUrl ? (
                              <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase">
                                {(user.name || 'U').charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-gray-700">{user.name || 'Unnamed User'}</span>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-500">
                        {user.phone || user.email || <span className="italic text-gray-300">No contact</span>}
                      </td>
                      <td className="p-5">
                        {user.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-100">
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-right sm:text-left">
                        <button
                          onClick={() => toggleVerification(user.id, user.isVerified)}
                          disabled={updatingId === user.id}
                          className={`min-w-[140px] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 ${
                            user.isVerified 
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' 
                              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100'
                          }`}
                        >
                          {updatingId === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            user.isVerified ? 'Revoke Access' : 'Authorize User'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-20 text-center">
                <Users className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-medium">
                  {searchTerm ? `No users found matching "${searchTerm}"` : 'No user accounts found in registry.'}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Notifications */}
        {notification && (
          <div className="fixed bottom-8 right-8 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500 z-[60]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <CheckCircle size={20} />
              </div>
              <span className="font-bold text-sm text-gray-800">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
