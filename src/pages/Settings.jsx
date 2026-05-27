import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import {
  LogOut,
  User,
  ChevronRight,
  Shield,
  Trash2,
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

// eslint-disable-next-line no-unused-vars
const SettingsItem = ({ icon: ItemIcon, title, description, onClick, to, danger = false }) => {
  const content = (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group shadow-sm mb-3">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 group-hover:bg-primary group-hover:text-white transition-colors'}`}>
          <ItemIcon size={20} />
        </div>
        <div className="text-left">
          <p className={`font-bold text-sm ${danger ? 'text-red-600' : 'text-gray-800'}`}>{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
  );

  if (to) return <Link to={to} className="block no-underline">{content}</Link>;
  return (
    <button onClick={onClick} className="w-full bg-transparent border-none p-0 text-inherit focus:outline-none">
      {content}
    </button>
  );
};

// ── Delete confirmation modal ─────────────────────────────────────────────
const DeleteAccountModal = ({ onConfirm, onCancel, isDeleting, error }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          This will <strong>permanently delete</strong> your account and all associated data:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc">
          <li>Your profile and photos</li>
          <li>All interests sent and received</li>
          <li>Your shortlisted profiles</li>
          <li>All notifications</li>
        </ul>
        <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg mb-4">
          This action is irreversible and cannot be undone.
        </p>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="px-6 pb-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <><Loader2 size={16} className="animate-spin" /> Deleting...</>
          ) : (
            <><Trash2 size={16} /> Yes, Delete</>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
const Settings = () => {
  const { currentUser, userProfile } = useAuthContext();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    await signOut(auth);
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    setDeleteError('');

    const uid = currentUser.uid;

    try {
      // 1. Delete all interests (sent + received)
      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(query(collection(db, 'interests'), where('senderId', '==', uid))),
        getDocs(query(collection(db, 'interests'), where('receiverId', '==', uid))),
      ]);
      const interestDeletions = [
        ...sentSnap.docs.map(d => deleteDoc(d.ref)),
        ...receivedSnap.docs.map(d => deleteDoc(d.ref)),
      ];

      // 2. Delete shortlists
      const shortlistSnap = await getDocs(
        query(collection(db, 'shortlists'), where('userId', '==', uid))
      );

      // 3. Delete notifications
      const notifSnap = await getDocs(
        query(collection(db, 'notifications'), where('userId', '==', uid))
      );

      // 4. Delete chats (and their messages subcollections)
      const chatsSnap = await getDocs(
        query(collection(db, 'chats'), where('participants', 'array-contains', uid))
      );
      const chatDeletions = [];
      for (const chatDoc of chatsSnap.docs) {
        const msgsSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
        msgsSnap.docs.forEach(m => chatDeletions.push(deleteDoc(m.ref)));
        chatDeletions.push(deleteDoc(chatDoc.ref));
      }

      await Promise.all([
        ...interestDeletions,
        ...shortlistSnap.docs.map(d => deleteDoc(d.ref)),
        ...notifSnap.docs.map(d => deleteDoc(d.ref)),
        ...chatDeletions,
      ]);

      // 4. Delete Firestore profile document
      await deleteDoc(doc(db, 'users', uid));

      // 5. Delete Firebase Auth user (must be last — after this, rules won't work)
      await deleteUser(currentUser);

      // Auth state change will auto-redirect via AuthContext
      navigate('/splash');

    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError(
          'Security check failed. Please log out and log back in, then try deleting again.'
        );
      } else {
        setDeleteError('Something went wrong. Please try again.');
        console.error('Delete account error:', err);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-2xl">
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(''); }}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-gray-500">Manage your profile and account preferences</p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-primary/10 p-1">
          <img
            src={userProfile?.photoUrl || 'https://placehold.co/80x80/png?text=User'}
            alt={userProfile?.name}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <h3 className="font-bold text-xl text-gray-800">{userProfile?.name}</h3>
        <p className="text-gray-500 text-sm">{userProfile?.phone || userProfile?.email}</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Profile</h4>
          <SettingsItem
            icon={User}
            title="Edit Profile"
            description="Update your personal details, age, and location"
            to="/complete-profile"
          />
          <SettingsItem
            icon={Shield}
            title="KYC Verification"
            description={
              userProfile?.kycStatus === 'verified' ? 'Verified — Identity confirmed' :
              userProfile?.kycStatus === 'submitted' ? 'Documents submitted — Review pending' :
              'Upload government ID to get verified'
            }
            to="/kyc"
          />
        </div>

        {/* Support Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Support</h4>
          <SettingsItem
            icon={HelpCircle}
            title="Contact Support"
            description="support@ristasetu.com — Account ya kisi issue ke liye"
            onClick={() => window.open('mailto:support@ristasetu.com?subject=RistaSetu Support Request', '_blank')}
          />
          <SettingsItem
            icon={ExternalLink}
            title="Hamare Baare Mein"
            description="RistaSetu ke mission aur team ke baare mein jaanein"
            to="/about"
          />
          <SettingsItem
            icon={ExternalLink}
            title="Disclaimer"
            description="Platform ki zimmedari aur kanuni sthiti padhein"
            to="/disclaimer"
          />
          <SettingsItem
            icon={ExternalLink}
            title="Privacy Policy"
            description="Read how we handle your data"
            to="/about#privacy"
          />
          <SettingsItem
            icon={ExternalLink}
            title="Terms of Service"
            description="Rules and conditions for using RistaSetu"
            to="/about#terms"
          />
        </div>

        {/* Account Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Account</h4>
          <SettingsItem
            icon={LogOut}
            title="Logout"
            description="Sign out of your account on this device"
            onClick={handleLogout}
          />
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4 px-2">Danger Zone</h4>
          <SettingsItem
            icon={Trash2}
            title="Delete Account"
            description="Permanently remove your account and all data"
            danger={true}
            onClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      <div className="mt-12 text-center text-gray-400 text-xs">
        <p>RistaSetu v1.0.4</p>
        <p className="mt-1">&copy; 2026 RistaSetu Matrimony Services</p>
      </div>
    </div>
  );
};

export default Settings;
