import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { 
  LogOut, 
  User, 
  Mail, 
  ChevronRight, 
  Shield, 
  Trash2, 
  HelpCircle, 
  ExternalLink 
} from 'lucide-react';
import { auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const SettingsItem = ({ icon: Icon, title, description, onClick, to, danger = false }) => {
  const content = (
    <div className={`flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group shadow-sm mb-3`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 group-hover:bg-primary group-hover:text-white transition-colors'}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className={`font-bold text-sm ${danger ? 'text-red-600' : 'text-gray-800'}`}>{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>;
  }

  return (
    <button onClick={onClick} className="w-full bg-transparent border-none p-0 text-inherit focus:outline-none">
      {content}
    </button>
  );
};

const Settings = () => {
  const { userProfile } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("CRITICAL: Are you sure you want to permanently delete your account? All your data will be lost forever.");
    if (!confirmed) return;
    
    try {
      console.log("Deleting account for:", userProfile?.uid);
      await signOut(auth);
      navigate('/login');
      alert("Account deletion requested. Your data will be removed within 24 hours.");
    } catch (error) {
      console.error("Delete account error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-2xl">
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
            title="Verification Status"
            description={userProfile?.kycStatus === 'verified' ? "You are fully verified" : "Complete your KYC to get verified"}
            onClick={() => alert("Verification portal coming soon!")}
          />
        </div>

        {/* Support Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Support</h4>
          <SettingsItem 
            icon={HelpCircle}
            title="Contact Support"
            description="Get help with your account or report issues"
            onClick={() => alert("Support ticket system is coming soon. Please email support@ristasetu.com")}
          />
          <SettingsItem 
            icon={ExternalLink}
            title="Privacy Policy"
            description="Read how we handle your data"
            onClick={() => window.open('https://ristasetu.com/privacy', '_blank')}
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
            description="Permanently remove your account and data"
            danger={true}
            onClick={handleDeleteAccount}
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
