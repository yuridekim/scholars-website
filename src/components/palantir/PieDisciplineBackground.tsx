'use client';

import React from 'react';
import { ScholarPieChart } from './ScholarPieChart';
import { AuthState } from '@/hooks/useFoundryAuth';

const DISCIPLINE_COLORS = ['#3182CE', '#805AD5', '#38A169', '#DD6B20', '#D53F8C', '#9B2C2C', '#F6AD55'];

interface PieResearchDisciplineProps {
  auth: AuthState;
}

function PieResearchDiscipline({ auth }: PieResearchDisciplineProps): JSX.Element {
  return (
    <ScholarPieChart
      auth={auth}
      title="Discipline Background"
      propertyAccessor={(scholar) => scholar.discipline}
      colors={DISCIPLINE_COLORS}
    />
  );
}

export default PieResearchDiscipline;