import React, { useState, useEffect } from 'react';
import { collection, doc, updateDoc, getDocs, query, orderBy, limit, startAfter, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { 
  ShieldCheck, CheckCircle, XCircle, Loader2, Users, UserCheck, Clock, 
  Menu, X, LayoutDashboard, Settings, LogOut, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { formatDate } from '../utils/formatDate';

const PAGE_SIZE = 20;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingStories, setPendingStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        const snap = await getDocs(q);
        const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersList);
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        // No orderBy — avoids composite index requirement. Sort client-side.
        const q = query(collection(db, 'success_stories'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setPendingStories(list);
      } catch (e) {
        console.error('Stories fetch error:', e);
      } finally {
        setStoriesLoading(false);
      }
    };
    fetchStories();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE), startAfter(lastDoc));
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(prev => [...prev, ...newUsers]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading more users:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleVerification = async (userId, currentStatus) => {
    try {
      setUpdatingId(userId);
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentStatus;
      await updateDoc(userRef, {
        isVerified: newStatus,
        kycStatus: newStatus ? 'verified' : 'not_started'
      });
      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: newStatus } : u));
      setNotification({ message: `User ${newStatus ? 'verified' : 'unverified'} successfully!`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error toggling verification:", error);
      alert("Failed to update verification status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleBlock = async (userId, currentBlockedStatus) => {
    if (!window.confirm(currentBlockedStatus ? 'Is user ko unblock karein?' : 'Is user ko block karein? Wo login nahi kar paayega.')) return;
    try {
      setUpdatingId(userId);
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentBlockedStatus;
      await updateDoc(userRef, { isBlocked: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: newStatus } : u));
      setNotification({ message: `User ${newStatus ? 'blocked' : 'unblocked'} successfully!`, type: newStatus ? 'error' : 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error toggling block:", error);
      alert("Failed to update block status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const approveStory = async (storyId) => {
    try {
      await updateDoc(doc(db, 'success_stories', storyId), { status: 'approved', approvedAt: serverTimestamp() });
      setPendingStories(prev => prev.filter(s => s.id !== storyId));
      setNotification({ message: 'Story approved and published!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) { console.error(e); }
  };

  const rejectStory = async (storyId) => {
    if (!window.confirm('Is story ko reject karein?')) return;
    try {
      await updateDoc(doc(db, 'success_stories', storyId), { status: 'rejected' });
      setPendingStories(prev => prev.filter(s => s.id !== storyId));
      setNotification({ message: 'Story rejected.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) { console.error(e); }
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
                    <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-gray-400">Joined Date</th>
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
                        <div className="flex flex-col gap-1.5">
                          {user.isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-100">
                              <CheckCircle size={12} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                          {user.kycStatus === 'submitted' && !user.isVerified && (
                            <a
                              href={user.kycDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              📄 View KYC Doc ({user.kycDocumentType})
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-500 font-medium">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-5 text-right sm:text-left">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => toggleVerification(user.id, user.isVerified)}
                            loading={updatingId === user.id}
                            variant={user.isVerified ? 'outline' : 'primary'}
                            className={`min-w-[130px] px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm ${
                              !user.isVerified ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' : ''
                            }`}
                          >
                            {user.isVerified ? 'Revoke' : 'Verify'}
                          </Button>
                          <button
                            onClick={() => toggleBlock(user.id, user.isBlocked)}
                            disabled={updatingId === user.id}
                            className={`min-w-[100px] px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm border disabled:opacity-50 ${
                              user.isBlocked
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
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

          {!searchTerm && hasMore && (
            <div className="p-6 flex justify-center border-t border-gray-50">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? <><Loader2 size={16} className="animate-spin" /> Loading...</> : 'Load More Users'}
              </button>
            </div>
          )}

          {/* Success Stories Approval */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span style={{ fontSize: '1.2rem' }}>💍</span> Success Stories — Pending Approval
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">Approve karne pe public page par dikhegi (agar Public chuni ho)</p>
              </div>
              {pendingStories.length > 0 && (
                <span className="bg-orange-100 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-full border border-orange-200">
                  {pendingStories.length} Pending
                </span>
              )}
            </div>
            <div className="p-6">
              {storiesLoading ? (
                <div className="text-center py-8 text-gray-400"><Loader2 size={24} className="animate-spin mx-auto" /></div>
              ) : pendingStories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 font-medium">Koi pending story nahi hai</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pendingStories.map(story => (
                    <div key={story.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {story.photoUrl ? (
                          <img src={story.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-2xl">💑</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800">{story.name1} &amp; {story.name2}</div>
                          <div className="text-xs text-gray-400 mb-2">{[story.city, story.year, story.isPublic ? '🌐 Public' : '🔒 Private'].filter(Boolean).join(' • ')}</div>
                          <p className="text-sm text-gray-600 italic line-clamp-3">"{story.story}"</p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
                          <button
                            onClick={() => approveStory(story.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold text-xs hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            onClick={() => rejectStory(story.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
