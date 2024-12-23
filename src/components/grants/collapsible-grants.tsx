import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Grant } from '@/lib/types';
import { GrantCard } from './grant-card';

const INITIAL_GRANTS_SHOWN = 3;

interface CollapsibleGrantsProps {
  grants: Grant[];
}

export const CollapsibleGrants = ({ grants }: CollapsibleGrantsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleGrants = isExpanded ? grants : grants.slice(0, INITIAL_GRANTS_SHOWN);
  const hasMoreGrants = grants.length > INITIAL_GRANTS_SHOWN;
  
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Research Funding</h2>
      <div className="grid grid-cols-1 gap-4">
        {visibleGrants.map((grant, index) => (
          <GrantCard key={index} grant={grant} />
        ))}
      </div>
      
      {hasMoreGrants && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <span className="mr-2">
            {isExpanded ? 'Show Less' : `Show ${grants.length - INITIAL_GRANTS_SHOWN} More`}
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