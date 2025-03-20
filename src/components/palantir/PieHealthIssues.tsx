'use client';

import React from 'react';
import { ScholarPieChart } from './ScholarPieChart';
import { AuthState } from '@/hooks/useFoundryAuth';

const HEALTH_ISSUE_COLORS = ['#38A169', '#3182CE', '#D53F8C', '#DD6B20', '#805AD5', '#9B2C2C', '#F6AD55', '#48BB78'];

interface PieHealthIssuesProps {
  auth: AuthState;
}

function PieHealthIssues({ auth }: PieHealthIssuesProps): JSX.Element {
  return (
    <ScholarPieChart
      auth={auth}
      title="Health Issues of Interest"
      propertyAccessor={(scholar) => scholar.healthIssue}
      colors={HEALTH_ISSUE_COLORS}
    />
  );
}

export default PieHealthIssues;