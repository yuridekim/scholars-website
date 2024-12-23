// components/publications/publication-card.tsx
import React from 'react';
import { GoogleScholarPub } from '@/lib/types';

interface PublicationCardProps {
  publication: GoogleScholarPub;
}

export const PublicationCard = ({ publication }: PublicationCardProps) => (
  <div className="border-b pb-4">
    <h3 className="text-lg font-medium text-gray-900">{publication.title}</h3>
    <p className="text-sm text-gray-500 mt-1">
      {publication.author} ({publication.pubYear})
    </p>
    {publication.journal && (
      <p className="text-sm text-gray-500 mt-1">{publication.journal}</p>
    )}
    {publication.numCitations !== undefined && (
      <p className="text-sm text-gray-500 mt-1">
        Citations: {publication.numCitations}
      </p>
    )}
  </div>
);