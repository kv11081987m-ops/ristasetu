import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import Button from './Button';

const UserProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    religion: 'Hindu',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.name || !formData.age || !formData.city) {
        throw new Error('Please fill all fields');
      }

      await addDoc(collection(db, 'users'), {
        name: formData.name,
        age: Number(formData.age),
        religion: formData.religion,
        city: formData.city,
        createdAt: new Date()
      });

      setSuccess(`Profile registered successfully!`);
      // Reset form
      setFormData({ name: '', age: '', religion: 'Hindu', city: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface shadow-md rounded-lg p-6 border w-full max-w-md mt-4 mx-auto" style={{ margin: '0 auto' }}>
      <h2 className="font-bold text-2xl mb-4 text-primary text-center">Complete Profile</h2>
      
      {error && (
        <div className="p-3 rounded mb-4 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded mb-4 text-sm" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full Name</label>
          <input 
            type="text" 
            id="name"
            name="name"
            required
            className="form-input" 
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="age">Age</label>
          <input 
            type="number"
            id="age"
            name="age"
            required
            min="18"
            max="120"
            className="form-input" 
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g. 25"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="religion">Religion</label>
          <select 
            id="religion"
            name="religion"
            className="form-select"
            value={formData.religion}
            onChange={handleChange}
          >
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Sikh">Sikh</option>
            <option value="Christian">Christian</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="city">City</label>
          <input 
            type="text"
            id="city"
            name="city"
            required
            className="form-input" 
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter your city"
          />
        </div>
        
        <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
          {loading ? 'Saving...' : 'Register'}
        </Button>
      </form>
    </div>
  );
};

export default UserProfile;
