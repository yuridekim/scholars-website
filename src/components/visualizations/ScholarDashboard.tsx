// src/components/visualizations/ScholarDashboard.tsx
'use client'

import React from 'react';
import type { Scholar } from '@/lib/types';
import PublicationTimeline from './PublicationsChart';
import GenderDistributionChart from './GenderChart';
import PublicationSuccessChart from './PublicationSuccess';



const ScholarDashboard = ({ scholar }: { scholar: Scholar | null }) => {
  if (!scholar) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid md:grid-cols-2 gap-6">
        <PublicationTimeline scholar={scholar} />
        <GenderDistributionChart scholar={scholar} />
        <PublicationSuccessChart scholar={scholar} />
      </div>
    </div>
  );
};

export default ScholarDashboard;