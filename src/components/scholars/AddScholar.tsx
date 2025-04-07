import React, { useState } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ScholarProfile {
  name: string;
  affiliation: string;
  scholarId: string;
  citedby?: number;
  citedby5y?: number;
  hindex?: number;
  i10index?: number;
  totalPubs?: number;
}

// Interface for OpenAlex API responses
interface OpenAlexScholar {
  id: string;
  display_name: string;
  works_count: number;      
  cited_by_count: number;   
  works_api_url: string;
  summary_stats?: {
    h_index?: number;
    i10_index?: number;
    "2yr_mean_citedness"?: number;
  };
  counts_by_year?: Array<{
    year: number;
    works_count: number;
    cited_by_count: number;
  }>;
  affiliations?: Array<{
    institution: {
      display_name: string;
    };
    years?: number[];
  }>;
}

interface AddScholarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showManualEntry: boolean;
  setShowManualEntry: (show: boolean) => void;
  // Optional callback for when a scholar is successfully added
  onScholarAdded?: () => void;
}

const AddScholar: React.FC<AddScholarProps> = ({
  searchQuery,
  setSearchQuery,
  showManualEntry,
  setShowManualEntry,
  onScholarAdded
}) => {
  const [scholars, setScholars] = useState<OpenAlexScholar[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addingScholarId, setAddingScholarId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchOpenAlexScholars = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setScholars([]);
    setSuccessMessage(null);

    try {
      const response = await axios.get<{ results: OpenAlexScholar[] }>('https://api.openalex.org/authors', {
        params: {
          search: searchQuery,
          per_page: 10
        }
      });

      setScholars(response.data.results);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch scholars from OpenAlex');
      setIsLoading(false);
    }
  };

  const getAffiliation = (scholar: OpenAlexScholar): string => {
    if (scholar.affiliations && scholar.affiliations.length > 0) {
      return scholar.affiliations.map(aff => aff.institution.display_name).join(', ');
    }
    return 'No affiliation information';
  };

  const calculateCitations5Years = (scholar: OpenAlexScholar): number | undefined => {
    if (!scholar.counts_by_year || scholar.counts_by_year.length === 0) {
      return undefined;
    }
    
    const currentYear = new Date().getFullYear();
    const last5Years = scholar.counts_by_year
      .filter(count => count.year >= currentYear - 5)
      .reduce((sum, count) => sum + count.cited_by_count, 0);
      
    return last5Years > 0 ? last5Years : undefined;
  };

  const addScholar = async (scholar: OpenAlexScholar) => {
    setAddingScholarId(scholar.id);
    setError(null);
    setSuccessMessage(null);
    
    const citedby5y = calculateCitations5Years(scholar);
    
    const scholarProfile: ScholarProfile = {
      name: scholar.display_name,
      affiliation: getAffiliation(scholar),
      scholarId: scholar.id,
      citedby: scholar.cited_by_count,
      citedby5y: citedby5y,
      hindex: scholar.summary_stats?.h_index,
      i10index: scholar.summary_stats?.i10_index,
      totalPubs: scholar.works_count
    };
    
    try {
      const response = await fetch('/api/scholars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile: scholarProfile }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add scholar');
      }
      
      const data = await response.json();
      setSuccessMessage(`${scholar.display_name} successfully added to the database!`);
      
      if (onScholarAdded) {
        onScholarAdded();
      }
    } catch (err) {
      console.error('Error adding scholar:', err);
      setError(`Failed to add scholar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAddingScholarId(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search scholars by name or affiliation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <p className="text-red-500 mt-2 mb-4">{error}</p>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {searchQuery.trim() !== '' && (
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={searchOpenAlexScholars}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search OpenAlex'}
            </button>
            <Separator orientation="vertical" className="h-8" />
            <button
              onClick={() => setShowManualEntry(true)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add Scholar Manually
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Can't find who you're looking for? Add their information manually.
          </p>
        </div>
      )}

      {scholars.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Potential Matches from OpenAlex</h2>
          <div className="space-y-4">
            {scholars.map((scholar) => (
              <div 
                key={scholar.id} 
                className="p-4 border rounded shadow-sm bg-white hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{scholar.display_name}</p>
                    <p className="text-sm text-gray-500">{getAffiliation(scholar)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Works: {scholar.works_count} | 
                      Citations: {scholar.cited_by_count} | 
                      h-index: {scholar.summary_stats?.h_index || 'N/A'} |
                      i10-index: {scholar.summary_stats?.i10_index || 'N/A'}
                      {calculateCitations5Years(scholar) && (
                        <> | Citations (5y): {calculateCitations5Years(scholar)}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => addScholar(scholar)}
                    disabled={addingScholarId === scholar.id}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors ml-4 whitespace-nowrap"
                  >
                    {addingScholarId === scholar.id ? 'Adding...' : 'Add to Database'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AddScholar;