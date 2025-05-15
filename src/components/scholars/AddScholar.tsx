import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Separator } from '@/components/ui/separator';
import { saveScholarToPalantir } from '@/components/palantir/palantirScholars';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
  onScholarAdded?: () => void;
}

const AddScholar: React.FC<AddScholarProps> = ({
  searchQuery,
  setSearchQuery,
  showManualEntry,
  setShowManualEntry,
  onScholarAdded
}) => {
  const auth = useFoundryAuth();
  const [scholars, setScholars] = useState<OpenAlexScholar[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addingScholarId, setAddingScholarId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addedScholars, setAddedScholars] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  const extractOpenAlexId = (url: string): string => {
    const urlMatch = url.match(/https:\/\/openalex\.org\/([A-Z0-9]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    return url.split('/').pop() || '';
  };

  const addScholar = async (scholar: OpenAlexScholar) => {
    setAddingScholarId(scholar.id);
    setError(null);

    const citedby5y = calculateCitations5Years(scholar);

    const openAlexId = extractOpenAlexId(scholar.id);

    const numericId = -1;

    const palantirScholar = {
      id: numericId,
      name: scholar.display_name,
      email_domain: getEmailDomain(getAffiliation(scholar)),
      affiliation: getAffiliation(scholar),
      scholar_id: openAlexId,
      citedby: scholar.cited_by_count || 0,
      citedby5y: citedby5y || 0,
      hindex: scholar.summary_stats?.h_index || 0,
      hindex5y: 0,
      i10index: scholar.summary_stats?.i10_index || 0,
      i10index5y: 0,
      total_pub: scholar.works_count || 0,
      interests: "",
      full_name: scholar.display_name,
      method: "",
      summary_training_start: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      homepage: ""
    };

    try {
      if (!auth?.accessToken) {
        throw new Error("No access token available. Please login first.");
      }

      await saveScholarToPalantir(palantirScholar, auth.accessToken);

      setAddedScholars(prev => new Set(prev).add(scholar.id));

      setSuccessMessage(`${scholar.display_name} successfully added to Palantir! Click "Refresh" to update the list.`);

    } catch (err) {
      console.error('Error adding scholar to Palantir:', err);
      setError(`Failed to add scholar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAddingScholarId(null);
    }
  };

  const getEmailDomain = (affiliation: string): string => {
    if (affiliation.includes('UCLA')) return '@ucla.edu';
    if (affiliation.includes('Stanford')) return '@stanford.edu';
    if (affiliation.includes('MIT')) return '@mit.edu';
    if (affiliation.includes('Berkeley') || affiliation.includes('UC Berkeley')) return '@berkeley.edu';
    if (affiliation.includes('Harvard')) return '@harvard.edu';

    const firstPart = affiliation.split(',')[0].trim();
    if (firstPart) {
      const simplifiedName = firstPart.toLowerCase()
        .replace(/university of /gi, '')
        .replace(/[^a-z0-9]/gi, '');

      return `@${simplifiedName}.edu`;
    }

    return '@unknown.edu';
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="font-medium mb-2">Authentication Status</h3>
        <div className="p-2 bg-gray-100 rounded">
          {auth.accessToken && auth.isAuthenticated ? (
            <div className="text-green-600">
              ✓ Authenticated with Foundry
            </div>
          ) : (
            <div className="text-red-600">
              {auth.accessToken && auth.expiresAt && Date.now() >= auth.expiresAt
                ? "✗ Session expired. Please login again."
                : "✗ Not authenticated. Please login first."}
            </div>
          )}
        </div>
      </div>

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
        <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
          <div>
            <p className="font-medium">{successMessage}</p>
            <p className="text-sm text-green-600">Use the Refresh button when ready to update the scholar list.</p>
          </div>
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
            {scholars.map((scholar) => {
              const isAdded = addedScholars.has(scholar.id);

              return (
                <div
                  key={scholar.id}
                  className={`p-4 border rounded shadow-sm ${isAdded ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">{scholar.display_name}</p>
                        {isAdded && (
                          <span className="ml-2 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Added to Palantir
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{getAffiliation(scholar)}</p>
                      <p className="text-xs text-gray-400">ID: {extractOpenAlexId(scholar.id)}</p>
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
                      disabled={addingScholarId === scholar.id || !auth?.accessToken || isAdded}
                      className={`px-4 py-2 rounded transition-colors ml-4 whitespace-nowrap ${
                        isAdded
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed'
                      }`}
                    >
                      {addingScholarId === scholar.id
                        ? 'Adding...'
                        : isAdded
                          ? 'Added ✓'
                          : 'Add to Palantir'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </>
  );
};

export default AddScholar;