// components/publications/collapsible-publications.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleScholarPub } from '@/lib/types';
import { PublicationCard } from './publication-card';

const INITIAL_PUBLICATIONS_SHOWN = 5;

interface CollapsiblePublicationsProps {
  publications: GoogleScholarPub[];
}

export const CollapsiblePublications = ({ publications }: CollapsiblePublicationsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visiblePublications = isExpanded 
    ? publications 
    : publications.slice(0, INITIAL_PUBLICATIONS_SHOWN);
  const hasMorePublications = publications.length > INITIAL_PUBLICATIONS_SHOWN;
  
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Recent Publications</h2>
      <div className="space-y-4">
        {visiblePublications.map((pub) => (
          <PublicationCard key={pub.id} publication={pub} />
        ))}
      </div>
      
      {hasMorePublications && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <span className="mr-2">
            {isExpanded 
              ? 'Show Less' 
              : `Show ${publications.length - INITIAL_PUBLICATIONS_SHOWN} More`}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};