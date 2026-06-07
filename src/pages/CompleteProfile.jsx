import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import { validateImageFile, uploadToCloudinary } from '../utils/uploadUtils';

const CompleteProfile = () => {
  const { currentUser, setIsProfileComplete, setUserProfile } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    age: '',
    gender: 'Male',
    religion: 'Hindu',
    caste: '',
    gotra: '',
    city: '',
    state: 'Uttar Pradesh',
    occupation: '',
    about: ''
  });
  
  const [photoItems, setPhotoItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dob' && value) {
      const today = new Date();
      const dobDate = new Date(value);
      const age = today.getFullYear() - dobDate.getFullYear() -
        (today.getMonth() < dobDate.getMonth() ||
         (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate()) ? 1 : 0);
      setFormData(prev => ({ ...prev, dob: value, age: String(age) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPhoto = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const newItems = [];
    for (const selected of files) {
      if (photoItems.length + newItems.length >= 5) break;
      const validationError = validateImageFile(selected);
      if (validationError) { setError(validationError); return; }
      newItems.push({ file: selected, preview: URL.createObjectURL(selected) });
    }
    if (newItems.length > 0) {
      setPhotoItems(prev => [...prev, ...newItems]);
      setError('');
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotoItems(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Strict Validation
    if (!formData.name.trim()) {
      setError('Display Name is required.');
      return;
    }
    const ageNum = parseInt(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      setError('Aapki age 18 se 100 ke beech honi chahiye.');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }
    if (!formData.about.trim() || formData.about.trim().length < 20) {
      setError('The "About" section must be at least 20 characters long to help others know you better.');
      return;
    }
    if (photoItems.length === 0) {
      setError('Please add at least one profile photo.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload photos to Cloudinary
      const photoUrls = await Promise.all(photoItems.map(item => uploadToCloudinary(item.file)));

      // 2. Save to Firestore
      const profileData = {
        ...formData,
        photoUrl: photoUrls[0],
        photos: photoUrls,
        isProfileComplete: true,
        uid: currentUser.uid,
        email: currentUser.email,
        kycStatus: 'not_started',
        isPremium: false,
        premiumPlan: 'none',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', currentUser.uid), profileData, { merge: true });

      // 3. Update global context
      setUserProfile(profileData);
      setIsProfileComplete(true);

      // 4. Redirect
      navigate('/dashboard');
    } catch (err) {
      console.error("CompleteProfile submit error:", err.code || err.message);
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
              <label className="form-label">Date of Birth / Janm Tithi</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                className="form-input"
              />
              <p className="text-[10px] text-light mt-1">Birthday wishes ke liye (optional)</p>
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
              <input type="text" name="caste" value={formData.caste} onChange={handleInputChange} required className="form-input" placeholder="e.g. Brahmin, Rajput, Yadav" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Gotra</label>
              <input type="text" name="gotra" value={formData.gotra} onChange={handleInputChange} className="form-input" placeholder="e.g. Bharadwaj, Kashyap, Vashisht" />
              <p className="text-[10px] text-light mt-1">Sapinda / sagotra vivah se bachne ke liye</p>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">City / Shahar</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="form-input" placeholder="e.g. Gorakhpur, Deoria" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">State / Rajya</label>
              <select name="state" value={formData.state} onChange={handleInputChange} className="form-select">
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Haryana">Haryana</option>
                <option value="Punjab">Punjab</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group mb-0 md:col-span-2">
              <label className="form-label">Occupation</label>
              <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} required className="form-input" placeholder="e.g. Software Engineer" />
            </div>

            <div className="form-group mb-0 md:col-span-2">
              <label className="form-label">About Me (Min. 20 characters)</label>
              <textarea 
                name="about" 
                value={formData.about} 
                onChange={handleInputChange} 
                required 
                className="form-input min-h-[120px] resize-none" 
                placeholder="Share a bit about your personality, hobbies, and what you're looking for in a partner..."
              ></textarea>
              <p className="text-[10px] text-light mt-1 flex justify-between">
                <span>Min. 20 characters</span>
                <span className={formData.about.length >= 20 ? 'text-green-600' : 'text-red-500'}>
                  {formData.about.length} characters
                </span>
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="form-label mb-3 block">
              Profile Photos <span className="text-gray-400 font-normal text-xs">({photoItems.length}/5 — pehli photo = main)</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {photoItems.map((item, i) => (
                <div key={i} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-red-500' : 'border-gray-200'}`}>
                  <img src={item.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[9px] font-bold text-center py-0.5">MAIN</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photoItems.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-red-300 transition-colors">
                  <input type="file" accept="image/*" multiple onChange={handleAddPhoto} className="hidden" />
                  <span className="text-2xl text-gray-400 leading-none">+</span>
                  <span className="text-[10px] text-gray-400 mt-1">Add Photo</span>
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">JPG, PNG ya WebP — max 5MB each</p>
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full mt-4 py-3 text-lg font-bold shadow-md"
            variant="primary"
          >
            Complete & Go to Dashboard
          </Button>

          <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
            Register karke aap hamare{' '}
            <Link to="/about#terms" className="text-red-600 hover:underline font-medium">Terms of Service</Link>
            {' '}aur{' '}
            <Link to="/about#privacy" className="text-red-600 hover:underline font-medium">Privacy Policy</Link>
            {' '}se sehmat hain.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
