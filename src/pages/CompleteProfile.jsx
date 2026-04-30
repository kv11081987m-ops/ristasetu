import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';

const CompleteProfile = () => {
  const { currentUser, setIsProfileComplete, setUserProfile } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    religion: 'Hindu',
    caste: '',
    city: '',
    occupation: ''
  });
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const uploadPhotoToCloudinary = async (imageFile) => {
    const uploadData = new FormData();
    uploadData.append('file', imageFile);
    uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // Ensure this match your unified preset

    const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: uploadData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!file) {
      setError('Please select a profile photo.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload photo to Cloudinary
      const photoUrl = await uploadPhotoToCloudinary(file);

      // 2. Save to Firestore
      const profileData = {
        ...formData,
        photoUrl,
        isProfileComplete: true,
        uid: currentUser.uid,
        email: currentUser.email,
        kycStatus: 'not_started',
        isPremium: false,
        premiumPlan: 'none',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', currentUser.uid), profileData, { merge: true });

      // 3. Update global context
      setUserProfile(profileData);
      setIsProfileComplete(true);

      // 4. Redirect
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 page-transition">
      <div className="bg-surface shadow-md rounded-xl p-6 md:p-8 border">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Complete Your Profile</h2>
          <p className="text-light text-sm mt-1">Tell us more about yourself to find the perfect match</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="form-input" placeholder="e.g. Aarav Sharma" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} required min="18" max="80" className="form-input" placeholder="e.g. 26" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-select">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Religion</label>
              <select name="religion" value={formData.religion} onChange={handleInputChange} className="form-select">
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Sikh">Sikh</option>
                <option value="Christian">Christian</option>
                <option value="Jain">Jain</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Caste / Community</label>
              <input type="text" name="caste" value={formData.caste} onChange={handleInputChange} required className="form-input" placeholder="e.g. Brahmin, Rajput" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="form-input" placeholder="e.g. Mumbai" />
            </div>

            <div className="form-group mb-0 md:col-span-2">
              <label className="form-label">Occupation</label>
              <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} required className="form-input" placeholder="e.g. Software Engineer" />
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="form-label mb-3 block">Profile Photo</label>
            
            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <label className="cursor-pointer w-full flex flex-col items-center">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                
                {preview ? (
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-primary font-medium hover:underline">Click to upload photo</span>
                    <p className="text-xs text-light mt-1">JPG, PNG or GIF (Max. 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full mt-4 py-3 text-lg font-bold shadow-md"
            variant="primary"
          >
            {isSubmitting ? 'Saving Profile...' : 'Complete & Go to Dashboard'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
