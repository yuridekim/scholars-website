'use client';

import React from 'react';
import { ScholarPieChart } from './ScholarPieChart';
import { AuthState } from '@/hooks/useFoundryAuth';

const METHODS_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

interface PieResearchMethodsProps {
  auth: AuthState;
}

function PieResearchMethods({ auth }: PieResearchMethodsProps): JSX.Element {
  return (
    <ScholarPieChart
      auth={auth}
      title="Research Methods"
      propertyAccessor={(scholar) => scholar.methods}
      colors={METHODS_COLORS}
    />
  );
}

export default PieResearchMethods;