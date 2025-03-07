'use client';

import React from 'react';
import ScholarMethodsPieChart from '@/components/palantir/PieResearchMethods'; 

export default function PalantirPage() {
  return (
    <div>
      <h1>Scholars Dashboard</h1>
      <div>
        <ScholarMethodsPieChart />
      </div>
    </div>
  );
}