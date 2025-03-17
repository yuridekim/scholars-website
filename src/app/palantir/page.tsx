'use client';

import React from 'react';
import PieResearchMethods from '@/components/palantir/PieResearchMethods';
import PieResearchFocus from '@/components/palantir/PieResearchFocus';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

export default function PalantirPage() {
  const auth = useFoundryAuth();
  const { isAuthenticated, loading: authLoading, error: authError, login, logout } = auth;

  // authenticate
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64 w-full bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-xl font-semibold text-red-600 mb-3">Authentication Error</h3>
            <p className="text-gray-700 mb-4">{authError.message}</p>
            <button 
              onClick={login} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-xl font-semibold mb-3">Authentication Required</h3>
            <p className="text-gray-700 mb-4">Please log in to view the scholar data</p>
            <button 
              onClick={login} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Log in with Foundry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
          <button 
            onClick={logout} 
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition duration-200"
          >
            Logout
          </button>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-1">
            <PieResearchMethods auth={auth} />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-1">
            <PieResearchFocus auth={auth} />
          </div>
        </div>
      </div>
    </div>
  );
}