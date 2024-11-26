// components/grants/info-item.tsx
import React from 'react';

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
}

export const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900">{value}</dd>
  </div>
);