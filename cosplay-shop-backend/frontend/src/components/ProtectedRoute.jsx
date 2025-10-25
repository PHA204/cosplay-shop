// Path: frontend/src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }
  
  console.log('✅ Token found, allowing access');
  return children;
};

export default ProtectedRoute;