import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if(phone === 'admin') {
      login('admin');
      navigate('/admin');
      return;
    }
    
    const success = login(phone);
    if (success) {
      navigate('/');
    } else {
      setError('Account not found. Demo numbers: 9876543210 (Aarav), 9876543211 (Priya)');
    }
  };

  return (
    <div className="container flex justify-center page-transition mt-8">
      <div className="bg-surface shadow-md rounded-lg p-6 w-full max-w-md border">
        <h2 className="font-bold text-2xl mb-2 text-center text-primary">Welcome Back</h2>
        <p className="text-light text-center mb-6 text-sm">Login with your registered mobile number</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 9876543210" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          {error && <div className="text-xs text-primary" style={{ color: '#DC2626' }}>{error}</div>}
          
          <Button type="submit" variant="primary" className="w-full font-bold">Get OTP / Login</Button>
        </form>

        <div className="mt-6 text-center text-sm text-light">
          Don't have an account? <Link to="/register" className="text-secondary font-bold">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
