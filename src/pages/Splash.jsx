import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Button from '../components/Button';
import { ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Splash = () => {
  const { currentUser } = useAppContext();
  
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container flex flex-col items-center justify-center text-center page-transition" style={{ minHeight: '80vh' }}>
      <ShieldCheck color="var(--primary)" size={80} className="mb-4" />
      <h1 className="text-primary font-bold mb-2" style={{ fontSize: '3rem', fontFamily: 'Georgia, serif' }}>RistaSetu</h1>
      <p className="text-light text-xl mb-8 max-w-md">The most trusted matrimony platform for serious marriage-oriented matching.</p>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Link to="/login" className="w-full">
          <Button variant="primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>Login</Button>
        </Link>
        <Link to="/register" className="w-full">
          <Button variant="outline" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>Create Profile</Button>
        </Link>
      </div>
    </div>
  );
};

export default Splash;
