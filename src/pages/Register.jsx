import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAppContext } from '../context/AppContext';

const Register = () => {
  const { register } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', gender: 'Male', dob: '',
    religion: 'Hindu', community: '', city: '', state: '',
    education: '', profession: '', incomeRange: '',
    height: '5\'5"', maritalStatus: 'Never Married',
    aboutMe: '', partnerPreferences: '',
    photoUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&h=300&fit=crop'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateAge = (dob) => {
    if(!dob) return 25;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      register({
        ...formData,
        age: calculateAge(formData.dob)
      });
      navigate('/');
    }
  };

  return (
    <div className="container flex justify-center page-transition mt-8 mb-8">
      <div className="bg-surface shadow-md rounded-lg p-6 w-full max-w-lg border">
        <h2 className="font-bold text-2xl mb-2 text-center text-primary">Create Profile</h2>
        <div className="flex justify-between mb-6">
          <div className={`text-xs font-bold ${step >= 1 ? 'text-primary' : 'text-light'}`}>1. Basic Info</div>
          <div className={`text-xs font-bold ${step >= 2 ? 'text-primary' : 'text-light'}`}>2. Background</div>
          <div className={`text-xs font-bold ${step >= 3 ? 'text-primary' : 'text-light'}`}>3. Preferences</div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" type="text" className="form-input" required onChange={handleChange} value={formData.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input name="phone" type="text" className="form-input" required onChange={handleChange} value={formData.phone} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-input" onChange={handleChange} value={formData.email} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" className="form-select" onChange={handleChange} value={formData.gender}>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input name="dob" type="date" className="form-input" required onChange={handleChange} value={formData.dob} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Religion</label>
                  <select name="religion" className="form-select" onChange={handleChange} value={formData.religion}>
                    <option>Hindu</option>
                    <option>Muslim</option>
                    <option>Sikh</option>
                    <option>Christian</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Community</label>
                  <input name="community" type="text" className="form-input" onChange={handleChange} value={formData.community} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input name="city" type="text" className="form-input" required onChange={handleChange} value={formData.city} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input name="state" type="text" className="form-input" required onChange={handleChange} value={formData.state} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Education</label>
                  <input name="education" type="text" className="form-input" required onChange={handleChange} value={formData.education} />
                </div>
                <div className="form-group">
                  <label className="form-label">Profession</label>
                  <input name="profession" type="text" className="form-input" required onChange={handleChange} value={formData.profession} />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label className="form-label">About Me</label>
                <textarea name="aboutMe" className="form-textarea" rows="3" required onChange={handleChange} value={formData.aboutMe}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Partner Preferences</label>
                <textarea name="partnerPreferences" className="form-textarea" rows="2" onChange={handleChange} value={formData.partnerPreferences}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Profile Photo URL (Optional)</label>
                <input name="photoUrl" type="text" className="form-input" onChange={handleChange} value={formData.photoUrl} />
              </div>
            </>
          )}
          
          <div className="flex gap-4 mt-4">
            {step > 1 && <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step-1)}>Back</Button>}
            <Button type="submit" variant="primary" className="flex-1">
              {step === 3 ? 'Complete Setup' : 'Next Step'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
