'use client';

import React from 'react';
import { ScholarPieChart } from './ScholarPieChart';
import { AuthState } from '@/hooks/useFoundryAuth';

const FOCUS_COLORS = ['#D53F8C', '#805AD5', '#38A169', '#F6AD55', '#9B2C2C', '#3182CE', '#DD6B20'];

interface PieResearchFocusProps {
  auth: AuthState;
}

function PieResearchFocus({ auth }: PieResearchFocusProps): JSX.Element {
  return (
    <ScholarPieChart
      auth={auth}
      title="Research Focus"
      propertyAccessor={(scholar) => scholar.focus}
      colors={FOCUS_COLORS}
    />
  );
}

export default PieResearchFocus;