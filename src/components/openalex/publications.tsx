import React, { useState, KeyboardEvent } from 'react';
import { Check, RefreshCw, LinkIcon, AlertTriangle, Download } from 'lucide-react'; // Added Download icon
import { GoogleScholarPub } from '@/lib/types';

// Interface for OpenAlex Author structure
interface OpenAlexAuthor {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  works_api_url: string;
  last_known_institution?: {
    id: string;
    display_name: string;
    country_code?: string;
    type?: string;
  };
  affiliations?: Array<{
    institution: {
      id: string;
      display_name: string;
      ror?: string;
      country_code?: string;
      type?: string;
    };
    years?: number[];
  }>;
}

// Interface for OpenAlex Publication structure
interface OpenAlexPublication {
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
  doi?: string;
  primary_location?: {
    source?: {
      display_name?: string;
    };
    landing_page_url?: string;
  };
}

// Props for the component
interface OpenAlexScholarSearchProps {
  existingPublications: GoogleScholarPub[];
  scholarName?: string;
}

const OpenAlexScholarSearch: React.FC<OpenAlexScholarSearchProps> = ({
  existingPublications,
  scholarName = ''
}) => {
  // State variables
  const [searchQuery, setSearchQuery] = useState<string>(scholarName);
  const [scholars, setScholars] = useState<OpenAlexAuthor[]>([]);
  const [selectedScholar, setSelectedScholar] = useState<OpenAlexAuthor | null>(null);
  const [newPublications, setNewPublications] = useState<GoogleScholarPub[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(!scholarName); // Start in search mode if no initial name
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isUpToDate, setIsUpToDate] = useState<boolean>(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);

  // Function to search for scholars on OpenAlex
  const searchScholars = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setScholars([]);

    try {
      const searchParam = encodeURIComponent(searchQuery.trim());
      const url = `https://api.openalex.org/authors?filter=display_name.search:${searchParam}&per_page=10`;

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 403) {
          setIsApiAvailable(false);
          throw new Error(`Access to OpenAlex API is forbidden (403). This may be due to rate limiting or access restrictions.`);
        } else {
          throw new Error(`OpenAlex API error: ${response.status}`);
        }
      }

      const data = await response.json();
      setScholars(data.results || []);

      if (data.results?.length === 0) {
        setError('No authors found matching your search. Try a different name.');
      }

    } catch (err: unknown) {
      console.error('Error searching for scholars:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch scholars: ${errorMessage}. Please try again.`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search on Enter key press
  const handleSearchKeydown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      searchScholars();
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchScholars();
  };

  // Select a scholar from the search results
  const selectScholar = (scholar: OpenAlexAuthor) => {
    setSelectedScholar(scholar);
    setIsSearchMode(false);
    checkForUpdates(scholar); // Check for updates immediately after selecting
  };

  // Convert OpenAlex publication format to GoogleScholarPub format
  const convertPublication = (pub: OpenAlexPublication): GoogleScholarPub => {
    return {
      id: parseInt(pub.id.replace('https://openalex.org/W', ''), 10) || Date.now() + Math.random(), // Ensure unique ID, fallback if parsing fails
      title: pub.title,
      pubYear: pub.publication_year,
      author: pub.authorships.map((a) => a.author.display_name).join(', '),
      journal: pub.primary_location?.source?.display_name || '',
      pubUrl: pub.doi ? `https://doi.org/${pub.doi}` : (pub.primary_location?.landing_page_url || ''),
      numCitations: pub.cited_by_count,
      citation: '', // Placeholder for citation data if needed later
    };
  };

  // Check for new publications for the selected scholar
  const checkForUpdates = async (scholar: OpenAlexAuthor | null = selectedScholar) => {
    if (!scholar) return;

    setIsLoading(true);
    setIsUpToDate(false);
    setError(null);
    setNewPublications([]); // Clear previous new publications

    try {
      // Fetch works sorted by publication date descending
      const workUrl = `https://api.openalex.org/works?filter=author.id:${encodeURIComponent(scholar.id)}&per_page=50&sort=publication_date:desc`;

      console.log("Fetching works with URL:", workUrl);

      const response = await fetch(workUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 403) {
          setIsApiAvailable(false);
          throw new Error(`Access to OpenAlex API is forbidden (403). This may be due to rate limiting or access restrictions.`);
        } else {
          throw new Error(`OpenAlex API error: ${response.status}`);
        }
      }

      const data = await response.json();
      const results = data.results || [];

      const openAlexPubs: GoogleScholarPub[] = results.map((pub: OpenAlexPublication) => convertPublication(pub));

      // Create a set of existing publication titles for efficient lookup
      const existingTitles = new Set(existingPublications.map((p) => p.title.toLowerCase().trim()));
      const newPubs = openAlexPubs.filter((pub) => !existingTitles.has(pub.title.toLowerCase().trim()));

      setNewPublications(newPubs);
      setLastChecked(new Date());
      setIsUpToDate(true); // Mark as up-to-date after check

      if (newPubs.length === 0) {
        console.log('No new publications found');
      } else {
        console.log(`Found ${newPubs.length} new publications`);
      }
    } catch (err: unknown) {
      console.error('Error fetching publications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch publications: ${errorMessage}. Please try again.`);
      setIsUpToDate(false); // Not up-to-date if there was an error
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the component state to allow searching for a different author
  const resetSearch = () => {
    setIsSearchMode(true);
    setScholars([]);
    setNewPublications([]);
    setLastChecked(null);
    setIsUpToDate(false);
    setSelectedScholar(null);
    setSearchQuery(''); // Optionally clear the search query
    setError(null);
  };

  // Function to export new publications to CSV format
  const exportToCSV = () => {
    if (newPublications.length === 0) return;

    // Define CSV columns
    const headers = [
      'id',
      'title',
      'publication_year',
      'journal',
      'authors',
      'publication_url',
      'num_citations',
      'openalex_author_id',
      'openalex_author_name'
    ];

    // Function to safely escape CSV values (handles quotes and commas)
    const escapeCsvValue = (value: string | number | undefined | null): string => {
      if (value === undefined || value === null) {
        return '';
      }
      const stringValue = String(value);
      // If the value contains a comma, newline, or double quote, enclose it in double quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        // Escape existing double quotes by doubling them
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Convert publications to CSV rows
    const csvRows = [
      // Header row
      headers.join(','),

      // Data rows
      ...newPublications.map(pub => {
        const values = [
          escapeCsvValue(pub.id),
          escapeCsvValue(pub.title),
          escapeCsvValue(pub.pubYear),
          escapeCsvValue(pub.journal),
          escapeCsvValue(pub.author),
          escapeCsvValue(pub.pubUrl),
          escapeCsvValue(pub.numCitations),
          escapeCsvValue(selectedScholar?.id),
          escapeCsvValue(selectedScholar?.display_name)
        ];
        return values.join(',');
      })
    ];

    // Join rows with newlines
    const csvContent = csvRows.join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Set up download filename
    const scholarLastName = selectedScholar?.display_name.split(' ').pop() || 'scholar';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    link.setAttribute('href', url);
    link.setAttribute('download', `${scholarLastName}_new_publications_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the object URL
  };


  // Render component for when the OpenAlex API is unavailable
  if (!isApiAvailable) {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Publications</h2>
        </div>

        <div className="border-l-4 border-yellow-400 p-4 bg-yellow-50 rounded">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800">OpenAlex API Unavailable</h3>
              <p className="text-sm text-yellow-700 mt-1">
                We're currently unable to access the OpenAlex API to check for new publications.
                This may be due to rate limiting or access restrictions from your current location.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => setIsApiAvailable(true)} // Allow user to retry
                  className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Still show existing publications */}
        <h3 className="font-medium mt-6 mb-2">Current Publications ({existingPublications.length})</h3>
        <div className="space-y-4">
          {existingPublications.length > 0 ? (
            existingPublications.slice(0, 5).map((pub: GoogleScholarPub) => (
              <div key={pub.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium">{pub.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{pub.author}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {pub.journal && <span>{pub.journal}, </span>}
                  {pub.pubYear}
                </p>
                {pub.numCitations !== undefined && pub.numCitations >= 0 && ( // Show even 0 citations
                  <p className="text-xs text-gray-500 mt-1">Citations: {pub.numCitations}</p>
                )}
                {pub.pubUrl && (
                  <a
                    href={pub.pubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    View publication
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No existing publications found.</p>
          )}
        </div>
        {existingPublications.length > 5 && (
          <button className="mt-4 w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <span className="mr-2">Show {existingPublications.length - 5} More</span> {/* Placeholder, add functionality if needed */}
          </button>
        )}
      </div>
    );
  }

  // Main component render
  return (
    <div className="mt-6">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold">Recent Publications (OpenAlex)</h2>

        <div className="flex items-center flex-wrap gap-2">
          {selectedScholar && !isSearchMode && (
            <div className="flex items-center text-sm text-gray-600">
              <LinkIcon className="h-3 w-3 mr-1" />
              <span>Linked to: <span className="font-medium">{selectedScholar.display_name}</span></span>
            </div>
          )}

          {lastChecked && (
            <span className="text-xs text-gray-500">
              Checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}

          {isUpToDate && newPublications.length === 0 && selectedScholar && (
            <div className="flex items-center text-green-600 text-sm">
              <Check className="h-4 w-4 mr-1" />
              <span>Up to date</span>
            </div>
          )}

          {/* Action Buttons */}
          {selectedScholar && !isSearchMode ? (
            <div className="flex space-x-2">
              <button
                onClick={() => checkForUpdates()}
                disabled={isLoading}
                title="Check OpenAlex for new publications"
                className="flex items-center text-sm px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    <span>Check</span>
                  </>
                )}
              </button>

              <button
                onClick={resetSearch}
                title="Search for a different author"
                className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
              >
                Change Author
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchMode(!isSearchMode)} // Toggle search mode
              className="flex items-center text-sm px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
            >
              {isSearchMode ? 'Cancel Search' : 'Link Author / Check Updates'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Scholar Search UI */}
      {isSearchMode && (
        <div className="border rounded-lg p-4 bg-gray-50 mb-6">
          <h3 className="text-lg font-medium mb-3">Find Author on OpenAlex</h3>
          <form onSubmit={handleSearchSubmit} className="flex mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeydown}
              placeholder="Enter author name..."
              className="flex-grow p-2 border border-r-0 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search for author"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                 <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    <span>Searching...</span>
                 </>
               ) : 'Search'}
            </button>
          </form>

          {/* Scholar Search Results */}
          {isSearching && <div className="text-center py-4 text-gray-600">Loading results...</div>}

          {!isSearching && scholars.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Select the correct author:
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto border rounded bg-white p-2">
                {scholars.map((scholar) => (
                  <button
                    key={scholar.id}
                    onClick={() => selectScholar(scholar)}
                    className="w-full text-left p-3 border rounded hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <div className="font-medium text-blue-700">{scholar.display_name}</div>

                    {/* Display Affiliations */}
                    {scholar.affiliations && scholar.affiliations.length > 0 ? (
                      <div className="mt-1">
                        <ul className="space-y-0.5">
                          {scholar.affiliations
                            .sort((a, b) => Math.max(...(b.years || [0])) - Math.max(...(a.years || [0]))) // Sort by latest year desc
                            .slice(0, 2) // Show top 2 affiliations
                            .map((affiliation, index) => {
                              const latestYear = affiliation.years && affiliation.years.length > 0 ? Math.max(...affiliation.years) : null;
                              const earliestYear = affiliation.years && affiliation.years.length > 0 ? Math.min(...affiliation.years) : null;
                              const yearRange = latestYear && earliestYear
                                ? (latestYear === earliestYear ? `(${latestYear})` : `(${earliestYear}–${latestYear})`)
                                : '';

                              return (
                                <li key={`${scholar.id}-aff-${index}`} className="text-sm text-gray-700">
                                  {affiliation.institution.display_name}
                                  {affiliation.institution.country_code && ` (${affiliation.institution.country_code})`}
                                  {yearRange && <span className="text-gray-500 ml-1">{yearRange}</span>}
                                </li>
                              );
                            })}
                        </ul>
                        {scholar.affiliations.length > 2 && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            + {scholar.affiliations.length - 2} more affiliation(s)
                          </div>
                        )}
                      </div>
                    ) : scholar.last_known_institution ? (
                      <div className="text-sm text-gray-700 mt-1">
                        Last Known: {scholar.last_known_institution.display_name}
                        {scholar.last_known_institution.country_code && ` (${scholar.last_known_institution.country_code})`}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-1 italic">No recent affiliation data</div>
                    )}

                    {/* Stats */}
                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-3">
                      <span>{scholar.works_count} works</span>
                      <span>{scholar.cited_by_count} citations</span>
                      <span>ID: {scholar.id.replace('https://openalex.org/A', '')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Publications Display */}
      {newPublications.length > 0 && (
        <div className="mb-6">
           <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3 flex flex-wrap justify-between items-center gap-2">
            <p className="text-sm text-yellow-800 font-medium">
              Found {newPublications.length} new publication{newPublications.length > 1 ? 's' : ''} on OpenAlex not listed below.
            </p>
            {/* CSV Export Button - Added from the second file */}
            <button
              onClick={exportToCSV}
              title="Download new publications as CSV"
              className="flex items-center text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
            >
              <Download className="h-3 w-3 mr-1.5" />
              <span>Export New to CSV</span>
            </button>
          </div>
          <div className="space-y-4">
            {newPublications.map((pub) => (
              <div key={`new-${pub.id}`} className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg shadow-sm">
                 <div className="flex justify-between items-start">
                    <h3 className="font-medium text-yellow-900 flex-1 mr-2">{pub.title}</h3>
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      New
                    </span>
                 </div>
                <p className="text-sm text-gray-700 mt-1">{pub.author}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {pub.journal && <span>{pub.journal}, </span>}
                  {pub.pubYear}
                </p>
                {pub.numCitations !== undefined && pub.numCitations >= 0 && (
                  <p className="text-xs text-gray-500 mt-1">OpenAlex Citations: {pub.numCitations}</p>
                )}
                {pub.pubUrl && (
                  <a
                    href={pub.pubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block hover:underline"
                  >
                    View publication →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Publications Display */}
      <h3 className="text-lg font-medium mb-3 mt-4">
        Current Publications ({existingPublications.length})
        {isUpToDate && newPublications.length === 0 && selectedScholar && (
            <span className="ml-2 text-sm text-green-600 font-normal">(Up to date with OpenAlex)</span>
        )}
      </h3>
      <div className="space-y-4">
        {existingPublications.length > 0 ? (
          existingPublications.slice(0, 5).map((pub) => ( // Limit display initially
            <div key={pub.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="font-medium">{pub.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{pub.author}</p>
              <p className="text-sm text-gray-500 mt-1">
                {pub.journal && <span>{pub.journal}, </span>}
                {pub.pubYear}
              </p>
              {pub.numCitations !== undefined && pub.numCitations >= 0 && (
                <p className="text-xs text-gray-500 mt-1">Citations: {pub.numCitations}</p>
              )}
              {pub.pubUrl && (
                <a
                  href={pub.pubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block hover:underline"
                >
                  View publication →
                </a>
              )}
            </div>
          ))
        ) : (
          !isSearchMode && !selectedScholar && ( // Only show if not searching and no scholar selected yet
             <p className="text-gray-500 italic">Link an author above to check for publications.</p>
          )
        )}
         {existingPublications.length === 0 && selectedScholar && !isLoading && (
             <p className="text-gray-500 italic">No existing publications found for this profile.</p>
         )}
      </div>

      {/* Placeholder for "Show More" functionality */}
      {existingPublications.length > 5 && (
        <button className="mt-4 w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
          Show {existingPublications.length - 5} More Existing Publications
          {/* Add onClick handler here to expand the list */}
        </button>
      )}
    </div>
  );
};

export default OpenAlexScholarSearch;