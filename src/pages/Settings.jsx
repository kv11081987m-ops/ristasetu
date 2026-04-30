import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { ShieldCheck, Lock, LogOut, Upload, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { userProfile, setUserProfile } = useAuthContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isPhotoUpdating, setIsPhotoUpdating] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsPhotoUpdating(true);
    try {
      const url = await uploadToCloudinary(file);
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, { photoUrl: url });
      setUserProfile(prev => ({ ...prev, photoUrl: url }));
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Failed to update profile photo.");
    } finally {
      setIsPhotoUpdating(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) return;
    
    setIsPhotoUpdating(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, { photoUrl: '' });
      setUserProfile(prev => ({ ...prev, photoUrl: '' }));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo.");
    } finally {
      setIsPhotoUpdating(false);
    }
  };

  const togglePhotoPrivacy = async () => {
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      const newValue = !userProfile.showPhotoToAll;
      await updateDoc(userRef, { showPhotoToAll: newValue });
      setUserProfile(prev => ({ ...prev, showPhotoToAll: newValue }));
    } catch (error) {
      console.error("Error updating privacy:", error);
    }
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const url = await uploadToCloudinary(file);
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        kycStatus: 'pending',
        kycIdUrl: url
      });
      setUserProfile(prev => ({ ...prev, kycStatus: 'pending', kycIdUrl: url }));
    } catch (error) {
      console.error("KYC Upload error:", error);
      setUploadError('Failed to upload ID. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderKycStatus = () => {
    switch (userProfile?.kycStatus) {
      case 'verified':
        return <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Verified</span>;
      case 'pending':
        return <span className="text-sm font-bold text-yellow-600 flex items-center gap-1"><Clock size={14} /> Pending Review</span>;
      case 'rejected':
        return <span className="text-sm font-bold text-red-600 flex items-center gap-1"><AlertCircle size={14} /> Rejected - Reupload</span>;
      default:
        return (
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} disabled={isUploading} />
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-700 transition-colors">
              {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
              {isUploading ? 'Uploading...' : 'Upload ID'}
            </div>
          </label>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Account Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <div className={`w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-white shadow-md relative ${isPhotoUpdating ? 'opacity-50' : ''}`}>
                <img 
                  src={userProfile?.photoUrl || 'https://placehold.co/120x120/png?text=User'} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
                {isPhotoUpdating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </div>
              
              {userProfile?.kycStatus === 'verified' && (
                <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm z-10">
                  <CheckCircle size={16} />
                </div>
              )}

              {/* Photo Actions Overlay */}
              <div className="absolute -bottom-2 flex gap-2 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer bg-white shadow-md rounded-full p-2 text-gray-700 hover:text-primary border border-gray-100">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <Upload size={14} />
                </label>
                {userProfile?.photoUrl && (
                  <button 
                    onClick={handleDeletePhoto}
                    className="bg-white shadow-md rounded-full p-2 text-gray-700 hover:text-red-600 border border-gray-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            
            <h3 className="font-bold text-xl text-gray-800 mb-1">{userProfile?.name}</h3>
            <p className="text-gray-500 text-sm mb-6">{userProfile?.phone || userProfile?.email}</p>
            
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border mb-6 font-semibold bg-green-50 text-green-700 border-green-100">
              <ShieldCheck size={18} /> Account Active
            </div>
            
            <div className="w-full space-y-3">
              <Button variant="outline" className="w-full py-2 text-sm" onClick={() => navigate('/complete-profile')}>Edit Profile Details</Button>
              <Button variant="danger" className="w-full py-2 text-sm flex items-center justify-center gap-2" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-50 pb-4 text-gray-800">
              <Lock size={20} className="text-red-600" /> Privacy Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <div>
                  <p className="font-semibold text-gray-700">Show Photo to All</p>
                  <p className="text-gray-500 text-xs">If off, only your matches can see your photo</p>
                </div>
                <button 
                  onClick={togglePhotoPrivacy}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${userProfile?.showPhotoToAll !== false ? 'bg-red-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userProfile?.showPhotoToAll !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-50 opacity-60">
                <div>
                  <p className="font-semibold text-gray-700">Hide Phone Number</p>
                  <p className="text-gray-500 text-xs">Phone is only visible to accepted matches</p>
                </div>
                <div className="w-12 h-6 bg-red-600 rounded-full relative">
                   <div className="absolute right-0.5 top-0.5 h-5 w-5 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="py-3">
                <p className="font-semibold text-gray-700 mb-2">Who can send me an interest?</p>
                <select className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all">
                  <option>All verified users</option>
                  <option>Only from same religion</option>
                  <option>Only from same community</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-50 pb-4 text-gray-800">
              <ShieldCheck size={20} className="text-red-600" /> Trust & Verification
            </h3>
            <p className="text-gray-500 text-sm mb-6">Complete your verification to get the trusted badge and get more responses.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 text-green-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Mobile Number</p>
                    <p className="text-xs text-gray-400">Verified via OTP</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Verified</span>
              </div>
              
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${userProfile?.kycStatus === 'verified' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Government ID</p>
                    <p className="text-xs text-gray-400">Aadhar / Passport / Voter ID</p>
                  </div>
                </div>
                {renderKycStatus()}
              </div>
              {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
