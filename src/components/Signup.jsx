import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Button from './Button';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(`Account created for ${userCredential.user.email}!`);
      // Reset form
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-surface shadow-md rounded-lg p-6 border w-full max-w-md mt-4 mx-auto" style={{ margin: '0 auto' }}>
      <h2 className="font-bold text-2xl mb-4 text-primary text-center">Sign Up</h2>
      
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
      
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email"
            required
            className="form-input" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input 
            type="password"
            id="password" 
            required
            className="form-input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        
        <Button type="submit" variant="primary" className="w-full mt-2">Sign Up</Button>
      </form>
    </div>
  );
};

export default Signup;
