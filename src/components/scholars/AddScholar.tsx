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
  const [selectedScholar, setSelectedScholar] = useState<OpenAlexScholar | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const searchOpenAlexScholars = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setScholars([]);
    setSelectedScholar(null);
    setIsSuccess(false);

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

  const handleSelectScholar = (scholar: OpenAlexScholar) => {
    setSelectedScholar(scholar);
    setIsSuccess(false);
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

  const addSelectedScholar = async () => {
    if (selectedScholar) {
      setIsLoading(true);
      setError(null);
      
      const citedby5y = calculateCitations5Years(selectedScholar);
      
      const scholarProfile: ScholarProfile = {
        name: selectedScholar.display_name,
        affiliation: getAffiliation(selectedScholar),
        scholarId: selectedScholar.id,
        citedby: selectedScholar.cited_by_count,
        citedby5y: citedby5y,
        hindex: selectedScholar.summary_stats?.h_index,
        i10index: selectedScholar.summary_stats?.i10_index,
        totalPubs: selectedScholar.works_count
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
        setIsSuccess(true);
        
        if (onScholarAdded) {
          onScholarAdded();
        }
      } catch (err) {
        console.error('Error adding scholar:', err);
        setError(`Failed to add scholar: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
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
      
      {isSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Scholar successfully added to the database!
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
          <ul>
            {scholars.map((scholar) => (
              <li 
                key={scholar.id} 
                className="mb-2 p-4 border rounded shadow-sm bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectScholar(scholar)}
                style={{ backgroundColor: selectedScholar?.id === scholar.id ? '#e0f7fa' : 'white' }}
              >
                <p className="font-medium">{scholar.display_name}</p>
                <p className="text-sm text-gray-500">{getAffiliation(scholar)}</p>
                <p className="text-sm text-gray-500">
                  Works: {scholar.works_count} | 
                  Citations: {scholar.cited_by_count} | 
                  h-index: {scholar.summary_stats?.h_index || 'N/A'} |
                  i10-index: {scholar.summary_stats?.i10_index || 'N/A'}
                </p>
              </li>
            ))}
          </ul>
          
          {selectedScholar && (
            <div className="mt-4 p-4 border rounded shadow-sm bg-blue-50">
              <h3 className="text-lg font-medium mb-2">Scholar Information</h3>
              <p className="text-sm text-gray-600 mb-3">
                Note: OpenAlex does not provide email addresses or Google Scholar IDs.
              </p>
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700">Available Metrics:</h4>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>Total Publications: {selectedScholar.works_count}</li>
                  <li>Total Citations: {selectedScholar.cited_by_count}</li>
                  <li>h-index: {selectedScholar.summary_stats?.h_index || 'Not available'}</li>
                  <li>i10-index: {selectedScholar.summary_stats?.i10_index || 'Not available'}</li>
                  {calculateCitations5Years(selectedScholar) && (
                    <li>Citations (last 5 years): {calculateCitations5Years(selectedScholar)}</li>
                  )}
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={addSelectedScholar}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Adding...' : 'Add Scholar to Database'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AddScholar;