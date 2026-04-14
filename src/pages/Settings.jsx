import React from 'react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';
import { ShieldCheck, Lock, LogOut } from 'lucide-react';

const Settings = () => {
  const { currentUser, logout } = useAppContext();

  return (
    <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-1">
          <div className="bg-surface border rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
            <img src={currentUser.photoUrl} alt="" className="rounded-full object-cover border-4 mb-4" style={{ width: '96px', height: '96px', borderColor: 'var(--surface)', boxShadow: 'var(--shadow-md)' }} />
            <h3 className="font-bold text-lg">{currentUser.name}</h3>
            <p className="text-light text-sm mb-4">{currentUser.phone}</p>
            
            <div className="w-full flex items-center justify-center gap-2 p-2 rounded border mb-4 font-medium" style={{ backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
              <ShieldCheck size={18} /> Phone Verified
            </div>
            
            <Button variant="outline" className="w-full text-sm mb-2" style={{ padding: '0.5rem' }}>Edit Profile</Button>
            <Button variant="danger" className="w-full text-sm flex items-center justify-center gap-2" style={{ padding: '0.5rem' }} onClick={() => logout()}>
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-surface border rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2"><Lock size={20} /> Privacy Settings</h3>
            
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Show Photo to All</p>
                <p className="text-light text-sm">Allow anyone to view your profile photo</p>
              </div>
              <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
            </div>
            
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Hide Phone Number</p>
                <p className="text-light text-sm">Phone is only visible to accepted matches</p>
              </div>
              <input type="checkbox" defaultChecked disabled style={{ width: '20px', height: '20px' }} />
            </div>
            
            <div className="py-3">
              <p className="font-medium mb-2">Who can send me an interest?</p>
              <select className="form-select w-full max-w-sm">
                <option>All verified users</option>
                <option>Only from same religion</option>
                <option>Only from same community</option>
              </select>
            </div>
          </div>
          
          <div className="bg-surface border rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2"><ShieldCheck size={20} /> Trust & Verification</h3>
            <p className="text-light text-sm mb-4">Complete your verification to get the trusted badge and get more responses.</p>
            
            <div className="flex justify-between items-center py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: '#16A34A', width: '36px', height: '36px' }}><ShieldCheck size={18} /></div>
                <div>
                  <p className="font-medium mb-0">Mobile Number</p>
                  <p className="text-xs text-light mb-0">Verified via OTP</p>
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: '#16A34A' }}>Verified</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full text-gray-500 bg-gray-200 flex items-center justify-center" style={{ width: '36px', height: '36px' }}><ShieldCheck size={18} /></div>
                <div>
                  <p className="font-medium mb-0">Government ID</p>
                  <p className="text-xs text-light mb-0">Aadhar / Passport</p>
                </div>
              </div>
              <Button variant="outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Upload</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
