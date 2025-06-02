import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Check, RefreshCw, LinkIcon, AlertTriangle, Database } from 'lucide-react';
import { GoogleScholarPub } from '@/lib/types';
import { PalantirPublication, FetchOptions } from '@/components/palantir/types';
import { Badge } from "@/components/ui/badge";
import { savePublicationsToPalantir, fetchPublicationsFromPalantir } from '@/components/palantir/palantirPublications';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

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

interface UnifiedPublication {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal?: string;
  citations?: number;
  url?: string;
  source: 'Google Scholar' | 'Palantir' | 'OpenAlex' | 'PubMed';
  isNew?: boolean;
}

interface UnifiedPublicationsProps {
  googlePubs: GoogleScholarPub[];
  scholarName?: string;
  scholarId?: string;
}

const UnifiedPublications: React.FC<UnifiedPublicationsProps> = ({ 
  googlePubs, 
  scholarName = '',
  scholarId
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(scholarName);
  const [scholars, setScholars] = useState<OpenAlexAuthor[]>([]);
  const [selectedScholar, setSelectedScholar] = useState<OpenAlexAuthor | null>(null);
  const [openAlexPubs, setOpenAlexPubs] = useState<GoogleScholarPub[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isUpToDate, setIsUpToDate] = useState<boolean>(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  
  const [palantirPubs, setPalantirPubs] = useState<PalantirPublication[]>([]);
  const [palantirLoading, setPalantirLoading] = useState<boolean>(false);
  const [palantirError, setPalantirError] = useState<string | null>(null);
  
  const auth = useFoundryAuth();

  useEffect(() => {
    if (!auth.accessToken) return;
    
    const fetchPalantirPubs = async () => {
      try {
        setPalantirLoading(true);
        setPalantirError(null);
        
        let options: FetchOptions;
        
        if (selectedScholar) {
          options = {
            filter: `openalexAuthorId="${selectedScholar.id}"`
          };
          console.log('Fetching Palantir publications for selected OpenAlex ID:', selectedScholar.id);
        } else if (scholarId) {
          options = {
          filter: `openalexAuthorId="${scholarId}"`,
          pageSize: 200
        };
          console.log('Fetching Palantir publications only for:', scholarId);
        } else {
          setPalantirPubs([]);
          setPalantirLoading(false);
          return;
        }
        
        const response = await fetchPublicationsFromPalantir(auth.accessToken!, options);
        setPalantirPubs(response.data);
        
        console.log(`Fetched ${response.data.length} Palantir publications for ${scholarId}`);
      } catch (error) {
        console.error('Error fetching Palantir publications:', error);
        setPalantirError(error instanceof Error ? error.message : 'Failed to load publications');
      } finally {
        setPalantirLoading(false);
      }
    };
    
    fetchPalantirPubs();
  }, [selectedScholar, auth.accessToken, scholarId]);

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

  const handleSearch = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      searchScholars();
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchScholars();
  };

  const selectScholar = (scholar: OpenAlexAuthor) => {
    console.log('selectScholar called with:', scholar.display_name, scholar.id);
    setSelectedScholar(scholar);
    setIsSearchMode(false);
    checkForUpdates(scholar);
  };
  
  const convertPublication = (pub: OpenAlexPublication): GoogleScholarPub => {
    return {
      id: parseInt(pub.id.replace('https://openalex.org/W', '')) || 0,
      title: pub.title,
      pubYear: pub.publication_year,
      author: pub.authorships.map((a: { author: { display_name: string }}) => a.author.display_name).join(', '),
      journal: pub.primary_location?.source?.display_name || '',
      pubUrl: pub.doi ? `https://doi.org/${pub.doi}` : (pub.primary_location?.landing_page_url || ''),
      numCitations: pub.cited_by_count,
      scholarId: selectedScholar?.id || '',
      citation: '',
      citesId: []
    } as GoogleScholarPub;
  };
  
  const checkForUpdates = async (scholar: OpenAlexAuthor | null = selectedScholar) => {
    if (!scholar) return;
    
    setIsLoading(true);
    setIsUpToDate(false);
    setError(null);
    
    try {
      const workUrl = `https://api.openalex.org/works?filter=author.id:${encodeURIComponent(scholar.id)}&per_page=50&sort=publication_date:desc`;
      
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
      
      const newOpenAlexPubs = results.map((pub: OpenAlexPublication) => convertPublication(pub));
      setOpenAlexPubs(newOpenAlexPubs);
      setLastChecked(new Date());
      setIsUpToDate(true);
      
    } catch (err: unknown) {
      console.error('Error fetching publications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch publications: ${errorMessage}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetSearch = () => {
    setIsSearchMode(true);
    setScholars([]);
    setOpenAlexPubs([]);
    setLastChecked(null);
    setIsUpToDate(false);
    setSelectedScholar(null);
    setSaveSuccess(null);
    // Clear Palantir publications when resetting
    setPalantirPubs([]);
  };
  
  const extractOpenAlexId = (fullId: string): string => {
  if (fullId.startsWith('https://openalex.org/')) {
    return fullId.replace('https://openalex.org/', '');
  }
  return fullId;
};

  const handleSaveToPalantir = async () => {
    if (!selectedScholar || openAlexPubs.length === 0) {
      setError("No new publications to save to Palantir.");
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(null);
    setError(null);
    
    try {
      const publicationsToSave = openAlexPubs.map(pub => ({
        id: pub.id || 0,
        title: pub.title || "",
        publication_year: pub.pubYear || 0,
        journal: pub.journal || "",
        authors: pub.author || "",
        publication_url: pub.pubUrl || "",
        num_citations: pub.numCitations || 0,
        openalex_author_id: extractOpenAlexId(selectedScholar?.id || ""),
        openalex_author_name: selectedScholar?.display_name || ""
      }));
      
      if (auth.accessToken) {
        await savePublicationsToPalantir(publicationsToSave, auth.accessToken);
      } else {
        setError("Authentication required. Please log in again.");
        return;
      }
      
      setSaveSuccess(true);
      console.log(`Successfully saved ${publicationsToSave.length} publications to Palantir`);
      
      // Refresh Palantir publications after saving
      if (selectedScholar) {
        const options: FetchOptions = {
          filter: `openalex_author_id="${selectedScholar.id}"`
        };
        const response = await fetchPublicationsFromPalantir(auth.accessToken!, options);
        setPalantirPubs(response.data);
      } else if (scholarId) {
        const options: FetchOptions = {
          filter: `scholar_id="${scholarId}"`
        };
        const response = await fetchPublicationsFromPalantir(auth.accessToken!, options);
        setPalantirPubs(response.data);
      }
      
    } catch (err: unknown) {
      console.error('Error saving to Palantir:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save to Palantir: ${errorMessage}`);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const existingTitles = new Set([
    ...googlePubs.map(p => p.title.toLowerCase().trim()),
    ...palantirPubs.map(p => p.title.toLowerCase().trim())
  ]);

  const newOpenAlexPubs = openAlexPubs.filter(pub => 
    !existingTitles.has(pub.title.toLowerCase().trim())
  );

  // Determine source for Google Scholar publications (they might actually be PubMed)
  const getSourceForGooglePubs = (pub: GoogleScholarPub): 'Google Scholar' | 'PubMed' => {
    // You can add logic here to determine if it's actually from PubMed
    // For now, let's assume they're PubMed if they have certain characteristics
    return 'PubMed';
  };

  const allPublications: UnifiedPublication[] = [
    ...googlePubs.map(pub => ({
      id: `gs-${pub.id}`,
      title: pub.title || 'Untitled',
      authors: pub.author || 'Unknown',
      year: pub.pubYear || 0,
      journal: pub.journal,
      citations: pub.numCitations,
      source: getSourceForGooglePubs(pub)
    })),
    ...palantirPubs.map(pub => ({
      id: `palantir-${pub.id}`,
      title: pub.title || 'Untitled',
      authors: pub.authors || 'Unknown',
      year: (pub as any).publicationYear || pub.publication_year || 0,
      journal: pub.journal,
      citations: (pub as any).numCitations || pub.num_citations || 0,
      url: (pub as any).publicationUrl || pub.publication_url,
      source: 'Palantir' as const
    })),
    ...newOpenAlexPubs.map(pub => ({
      id: `openalex-${pub.id}`,
      title: pub.title || 'Untitled',
      authors: pub.author || 'Unknown',
      year: pub.pubYear || 0,
      journal: pub.journal,
      citations: pub.numCitations,
      url: pub.pubUrl,
      source: 'OpenAlex' as const,
      isNew: true
    }))
  ];

  allPublications.sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    if (a.year !== b.year) return b.year - a.year;
    return (b.citations || 0) - (a.citations || 0);
  });

  if (!isApiAvailable) {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Publications</h2>
        </div>
        
        <div className="border-l-4 border-yellow-400 p-4 bg-yellow-50 rounded mb-6">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-800">OpenAlex API Unavailable</h3>
              <p className="text-sm text-yellow-700 mt-1">
                We're currently unable to access the OpenAlex API to check for new publications.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => setIsApiAvailable(true)} 
                  className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {allPublications.filter(p => p.source !== 'OpenAlex').length === 0 ? (
          <p className="text-sm text-gray-500">No publications found.</p>
        ) : (
          <div className="space-y-4">
            {allPublications.filter(p => p.source !== 'OpenAlex').map((pub) => (
              <div key={pub.id} className="border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">{pub.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {pub.authors} ({pub.year})
                </p>
                {pub.journal && (
                  <p className="text-sm text-gray-500 mt-1">{pub.journal}</p>
                )}
                {pub.citations !== undefined && (
                  <p className="text-sm text-gray-500 mt-1">
                    Citations: {pub.citations}
                  </p>
                )}
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-1 block"
                  >
                    View Publication
                  </a>
                )}
                <Badge 
                  variant={
                    pub.source === 'PubMed' ? 'outline' : 
                    pub.source === 'Palantir' ? 'secondary' : 'default'
                  } 
                  className="mt-2"
                >
                  {pub.source}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!selectedScholar && !scholarId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
          <p className="text-sm text-blue-700">
            Select an OpenAlex author to see publications from Palantir database that match the author.
          </p>
        </div>
      )}

      {!selectedScholar && scholarId && palantirPubs.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
          <p className="text-sm text-green-700">
            Found {palantirPubs.length} publication{palantirPubs.length !== 1 ? 's' : ''} in Palantir database for this scholar.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Publications</h2>
        
        <div className="flex items-center">
          {selectedScholar && !isSearchMode && (
            <div className="flex items-center text-sm text-gray-600 mr-3">
              <LinkIcon className="h-3 w-3 mr-1" />
              <span>OpenAlex: {selectedScholar.display_name}</span>
            </div>
          )}
          
          {lastChecked && (
            <span className="text-xs text-gray-500 mr-2">
              Last checked: {lastChecked.toLocaleString()}
            </span>
          )}
          
          {isUpToDate && newOpenAlexPubs.length === 0 && selectedScholar && (
            <div className="flex items-center text-green-600 text-sm mr-2">
              <Check className="h-4 w-4 mr-1" />
              <span>Up to date</span>
            </div>
          )}
          
          {palantirLoading && (
            <div className="flex items-center space-x-2 mr-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              <span className="text-sm text-gray-500">Loading Palantir...</span>
            </div>
          )}
          
          {selectedScholar && !isSearchMode ? (
            <div className="flex space-x-2">
              <button
                onClick={() => checkForUpdates()}
                disabled={isLoading}
                className="flex items-center text-sm px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    <span>Check OpenAlex</span>
                  </>
                )}
              </button>
              
              {newOpenAlexPubs.length > 0 && (
                <button
                  onClick={handleSaveToPalantir}
                  disabled={isSaving}
                  className="flex items-center text-sm px-3 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Database className="h-3 w-3 mr-1 animate-pulse" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3 w-3 mr-1" />
                      <span>Save to Palantir</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={resetSearch}
                className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
              >
                Change Author
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchMode(true)}
              className="flex items-center text-sm px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
            >
              {isSearchMode ? 'Hide OpenAlex Search' : 'Update Publications'}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {palantirError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-sm text-red-600">Error loading Palantir publications: {palantirError}</p>
        </div>
      )}
      
      {saveSuccess === true && (
        <div className="p-2 bg-green-50 border border-green-200 rounded mb-4">
          <p className="text-sm text-green-700">
            Successfully saved publications to Palantir database.
          </p>
        </div>
      )}
      
      {saveSuccess === false && !error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded mb-4">
          <p className="text-sm text-red-700">
            Failed to save to Palantir. Please try again.
          </p>
        </div>
      )}
      
      {isSearchMode && (
        <div className="border rounded-lg p-4 bg-white mb-6">
          <h3 className="text-lg font-medium mb-2">Link to OpenAlex Author</h3>
          
          <div className="mb-4 flex">
            <form onSubmit={handleSearchSubmit} className="w-full flex">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search for a scholar..."
                className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
          
          {isSearching && <div className="text-center py-4">Searching...</div>}
          
          {scholars.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Select the correct author based on their institution:
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {scholars.map((scholar: OpenAlexAuthor) => (
                  <button
                    key={scholar.id}
                    onClick={() => selectScholar(scholar)}
                    className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{scholar.display_name}</div>
                    
                    {scholar.affiliations && scholar.affiliations.length > 0 ? (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-gray-700">Affiliations:</div>
                        <ul className="mt-1 space-y-1">
                          {scholar.affiliations
                            .sort((a, b) => {
                              const aLatestYear = a.years && a.years.length > 0 ? Math.max(...a.years) : 0;
                              const bLatestYear = b.years && b.years.length > 0 ? Math.max(...b.years) : 0;
                              return bLatestYear - aLatestYear;
                            })
                            .slice(0, 3)
                            .map((affiliation, index) => {
                              const latestYear = affiliation.years && affiliation.years.length > 0 
                                ? Math.max(...affiliation.years) 
                                : null;
                              const earliestYear = affiliation.years && affiliation.years.length > 0 
                                ? Math.min(...affiliation.years) 
                                : null;
                              
                              return (
                                <li key={index} className="text-sm text-gray-700">
                                  <span className="font-medium">{affiliation.institution.display_name}</span>
                                  {affiliation.institution.country_code && 
                                    <span className="ml-1">({affiliation.institution.country_code})</span>}
                                  {latestYear && earliestYear && latestYear !== earliestYear && 
                                    <span className="text-gray-500 ml-1">({earliestYear}–{latestYear})</span>}
                                  {latestYear && earliestYear && latestYear === earliestYear && 
                                    <span className="text-gray-500 ml-1">({latestYear})</span>}
                                </li>
                              );
                            })}
                        </ul>
                        {scholar.affiliations.length > 3 && (
                          <div className="text-xs text-gray-500 mt-1">
                            + {scholar.affiliations.length - 3} more affiliations
                          </div>
                        )}
                      </div>
                    ) : scholar.last_known_institution ? (
                      <div className="text-sm text-gray-700 mt-1 font-medium">
                        {scholar.last_known_institution.display_name}
                        {scholar.last_known_institution.country_code && ` (${scholar.last_known_institution.country_code})`}
                        {scholar.last_known_institution.type && ` - ${scholar.last_known_institution.type}`}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-1 italic">No affiliation information available</div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-4">
                      <span>{scholar.works_count} publications</span>
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
      
      {newOpenAlexPubs.length > 0 && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-4">
          <p className="text-sm text-yellow-700">
            Found {newOpenAlexPubs.length} new publication{newOpenAlexPubs.length > 1 ? 's' : ''} from OpenAlex
          </p>
        </div>
      )}
      
      {allPublications.length === 0 ? (
        <p className="text-sm text-gray-500">No publications found.</p>
      ) : (
        <div className="space-y-4">
          {allPublications.map((pub) => (
            <div key={pub.id} className={`border-b pb-4 ${pub.isNew ? 'bg-yellow-50 p-4 rounded-lg border border-yellow-200' : ''}`}>
              <h3 className="text-lg font-medium text-gray-900">
                {pub.title}
                {pub.isNew && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    New
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {pub.authors} ({pub.year})
              </p>
              {pub.journal && (
                <p className="text-sm text-gray-500 mt-1">{pub.journal}</p>
              )}
              {pub.citations !== undefined && (
                <p className="text-sm text-gray-500 mt-1">
                  Citations: {pub.citations}
                </p>
              )}
              {pub.url && (
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm mt-1 block"
                >
                  View Publication
                </a>
              )}
              <Badge 
                variant={
                  pub.source === 'PubMed' ? 'outline' : 
                  pub.source === 'Palantir' ? 'secondary' : 'default'
                } 
                className="mt-2"
              >
                {pub.source}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnifiedPublications;