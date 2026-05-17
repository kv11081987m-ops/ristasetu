import React from 'react';
import { Navigate } from 'react-router-dom';

// Legacy component — redirect to actual registration page
const Register = () => <Navigate to="/splash" replace />;

export default Register;
