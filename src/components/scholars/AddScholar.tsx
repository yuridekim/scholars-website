import React from 'react';
import { GoogleScholarSearchResult } from '@/lib/types';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AddScholarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: GoogleScholarSearchResult[] | null;
  selectedSearchResult: GoogleScholarSearchResult | null;
  setSelectedSearchResult: (result: GoogleScholarSearchResult | null) => void;
  handleGoogleScholarSearch: () => Promise<void>;
  handleAddScholar: () => Promise<void>;
  searchLoading: boolean;
  error: string | null;
  showManualEntry: boolean;
  setShowManualEntry: (show: boolean) => void;
}

const AddScholar: React.FC<AddScholarProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  selectedSearchResult,
  setSelectedSearchResult,
  handleGoogleScholarSearch,
  handleAddScholar,
  searchLoading,
  error,
  showManualEntry,
  setShowManualEntry,
}) => {
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

      {searchQuery.trim() !== '' && (
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoogleScholarSearch}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              disabled={searchLoading}
            >
              {searchLoading ? 'Searching...' : 'Search Google Scholar'}
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

      {searchResults && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Potential Matches from Google Scholar</h2>
          <ul>
            {searchResults.map((result, index) => (
              <li key={index} className="mb-2 p-4 border rounded shadow-sm bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedSearchResult(result)}
                style={{ backgroundColor: selectedSearchResult?.scholarId === result.scholarId ? '#e0f7fa' : 'white' }}
              >
                <p className="font-medium">{result.name}</p>
                <p className="text-sm text-gray-500">{result.affiliation}</p>
                <p className="text-sm text-gray-500">Citations: {result.citedby}, H-index: {result.hindex}</p>
              </li>
            ))}
          </ul>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAddScholar}
              disabled={searchLoading || !selectedSearchResult}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {searchLoading ? 'Adding...' : 'Add Scholar to Database'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddScholar;