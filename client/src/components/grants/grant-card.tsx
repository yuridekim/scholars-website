// components/grants/grant-card.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoItem } from './info-item';
import { Grant } from '@/lib/types';

interface GrantCardProps {
  grant: Grant;
}

export const GrantCard = ({ grant }: GrantCardProps) => (
  <Card className="transition-all duration-200 ease-in-out">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-medium text-gray-900">{grant.Agency}</span>
        <Badge variant="secondary">{grant.Country}</Badge>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="Grant ID" value={grant.GrantID} />
        {grant.Acronym !== 'Not available' && (
          <InfoItem label="Program" value={grant.Acronym} />
        )}
        {grant.GrantNumber !== 'Not available' && (
          <InfoItem label="Grant Number" value={grant.GrantNumber} />
        )}
        {grant.ProjectName !== 'Not available' && (
          <div className="md:col-span-2">
            <InfoItem label="Project" value={grant.ProjectName} />
          </div>
        )}
      </dl>
    </CardContent>
  </Card>
);