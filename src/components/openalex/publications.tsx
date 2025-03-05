import React, { useState, KeyboardEvent } from 'react';
import axios from 'axios';

interface Scholar {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  works_api_url: string;
}

interface Publication {
  id: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  authorships: Array<{
    author: {
      display_name: string;
    };
  }>;
  primary_topic?: {
    display_name: string;
  };
  doi: string;
}

const OpenAlexScholarSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchScholars = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setScholars([]);
    setSelectedScholar(null);
    setPublications([]);

    try {
      const response = await axios.get<{ results: Scholar[] }>('https://api.openalex.org/authors', {
        params: {
          search: searchQuery,
          per_page: 10
        }
      });

      setScholars(response.data.results);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch scholars');
      setIsLoading(false);
    }
  };

  const handleSearch = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      searchScholars();
    }
  };

  const fetchScholarPublications = async (scholar: Scholar) => {
    setIsLoading(true);
    setError(null);
    setSelectedScholar(scholar);

    try {
      const response = await axios.get<{ results: Publication[] }>(scholar.works_api_url, {
        params: {
          per_page: 20,
          sort: 'cited_by_count:desc'
        }
      });

      setPublications(response.data.results);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch publications');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search for a scholar..."
          className="flex-grow p-2 border rounded-l-lg"/>
        <button 
          onClick={searchScholars}
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600">
          Search
        </button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {/* Scholar Search Results */}
      {scholars.length > 0 && !selectedScholar && (
        <div>
          <h2 className="text-xl font-bold mb-4">Select a Scholar</h2>
          {scholars.map((scholar) => (
            <div 
              key={scholar.id} 
              onClick={() => fetchScholarPublications(scholar)}
              className="cursor-pointer bg-white shadow-md rounded-lg p-4 mb-4 hover:bg-gray-100">
              <h3 className="text-lg font-semibold">{scholar.display_name}</h3>
              <p>Works: {scholar.works_count} | Citations: {scholar.cited_by_count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Selected Scholar's Publications */}
      {selectedScholar && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{selectedScholar.display_name}'s Publications</h2>
            <button 
              onClick={() => setSelectedScholar(null)}
              className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 mt-2">
              Back to Scholars
            </button>
          </div>

          {publications.length === 0 && <div>No publications found.</div>}

          {publications.map((pub) => (
            <div 
              key={pub.id} 
              className="bg-white shadow-md rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-blue-700">
                {pub.title}
              </h3>
              <div className="mt-2 text-gray-600">
                <p>
                  <strong>Published:</strong> {pub.publication_year}
                </p>
                <p>
                  <strong>Citations:</strong> {pub.cited_by_count}
                </p>
                {pub.primary_topic && (
                  <p>
                    <strong>Primary Topic:</strong> {pub.primary_topic.display_name}
                  </p>
                )}
                <a 
                  href={pub.doi} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline mt-2 inline-block">
                  View Publication
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpenAlexScholarSearch;