import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium">Verifying access credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    let hasPermission = false;

    // Check admin shorthand
    if (roles.includes('admin') && isAdmin) {
      hasPermission = true;
    }
    // Check staff shorthand
    else if (roles.includes('staff') && (isStaff || isAdmin)) {
      hasPermission = true;
    }
    // Direct role match
    else if (roles.includes(user.role)) {
      hasPermission = true;
    }

    if (!hasPermission) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Access</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Your current account role (<span className="font-semibold text-gray-800 uppercase">{user.role}</span>) does not have authorization to view this management section. Required role: {roles.join(' or ')}.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      );
    }
  }

  return children;
};
