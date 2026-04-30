import React from 'react';
import { CheckCircle } from 'lucide-react';

const VerifiedBadge = ({ isVerified, size = 16, className = "" }) => {
  if (isVerified !== true) return null;

  return (
    <CheckCircle 
      size={size} 
      className={`text-blue-500 fill-blue-50 inline-block ${className}`} 
      title="Verified Profile"
    />
  );
};

export default VerifiedBadge;
