'use client';

import React from 'react';
import PieResearchMethods from '@/components/palantir/PieResearchMethods';
import PieResearchFocus from '@/components/palantir/PieResearchFocus';
import PieResearchDiscipline from '@/components/palantir/PieDisciplineBackground';
import PieHealthIssues from '@/components/palantir/PieHealthIssues';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import AuthComponent from '@/components/auth/AuthComponent';

export default function PalantirPage() {
  const auth = useFoundryAuth();
  const { logout, isAuthenticated } = auth;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
          {isAuthenticated && (
            <button 
              onClick={logout} 
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition duration-200"
            >
              Logout
            </button>
          )}
        </header>
        
        <AuthComponent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-1">
              <PieResearchMethods auth={auth} />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-1">
              <PieResearchFocus auth={auth} />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-1">
              <PieResearchDiscipline auth={auth} />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-1">
              <PieHealthIssues auth={auth} />
            </div>
          </div>
        </AuthComponent>
      </div>
    </div>
  );
}