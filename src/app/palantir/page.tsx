'use client';

import React from 'react';
import PieResearchMethods from '@/components/palantir/PieResearchMethods';

export default function PalantirPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Research Methods Dashboard</h1>
        </header>
        
        <div className="bg-white rounded-lg shadow-md p-1">
          <PieResearchMethods />
        </div>
      </div>
    </div>
  );
}