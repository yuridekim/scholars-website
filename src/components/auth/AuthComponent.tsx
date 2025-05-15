'use client';

import React, { ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

interface AuthComponentProps {
  children: ReactNode;
  showContent?: boolean;
}

export default function AuthComponent({ 
  children, 
  showContent = false 
}: AuthComponentProps) {
  const auth = useFoundryAuth();
  const { isAuthenticated, loading, error, login } = auth;
  const pathname = usePathname();
  
  const handleLogin = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
      console.log("Setting auth redirect to:", pathname || '/');
        sessionStorage.setItem('auth_redirect', pathname || '/');
      }
      await login();
    } catch (err) {
      console.error('Login error:', err);
    }
  }, [login, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-xl font-semibold text-red-600 mb-3">Authentication Error</h3>
        <p className="text-gray-700 mb-4">{error.message}</p>
        <button 
          onClick={handleLogin} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-xl font-semibold mb-3">Authentication Required</h3>
        <p className="text-gray-700 mb-4">Please log in to view the data</p>
        <button 
          onClick={handleLogin} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Log in with Foundry
        </button>
        {showContent && children}
      </div>
    );
  }

  return <>{children}</>;
}