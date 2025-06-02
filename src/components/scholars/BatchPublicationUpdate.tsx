import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Database, Search, UserCheck } from 'lucide-react';
import { Scholar, GoogleScholarPub } from '@/lib/types';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import { savePublicationsToPalantir, fetchPublicationsFromPalantir } from '@/components/palantir/palantirPublications';

interface OpenAlexAuthor {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  affiliations?: Array<{
    institution: {
      display_name: string;
    };
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

interface BatchUpdateResult {
  scholarId: string;
  scholarName: string;
  status: 'success' | 'error' | 'no-updates' | 'needs-selection';
  newPublications: number;
  error?: string;
  openAlexAuthorId?: string;
  searchResults?: OpenAlexAuthor[];
}

interface BatchPublicationUpdateProps {
  scholars: Scholar[];
  onUpdateComplete: () => void;
}

const BatchPublicationUpdate: React.FC<BatchPublicationUpdateProps> = ({
  scholars,
  onUpdateComplete
}) => {
  const auth = useFoundryAuth();
  
  const [selectedScholars, setSelectedScholars] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState<BatchUpdateResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);
  const [saveToPalantir, setSaveToPalantir] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResults, setSaveResults] = useState<{ success: boolean; message: string } | null>(null);
  
  const extractOpenAlexId = (fullId: string): string => {
    if (fullId.startsWith('https://openalex.org/')) {
      return fullId.replace('https://openalex.org/', '');
    }
    return fullId;
  };

  const fetchPalantirPublications = async (scholarId: string): Promise<number[]> => {
    try {
      if (!auth.accessToken) return [];
      
      const options = {
        filter: `openalexAuthorId="${scholarId}"`,
        pageSize: 2000
      };
      
      const response = await fetchPublicationsFromPalantir(auth.accessToken, options);
      
      // Convert IDs to numbers with validation
      const ids = (response.data || [])
        .map((pub: any) => {
          const rawId = pub.id;
          const numericId = typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId);
          
          if (isNaN(numericId)) {
            console.warn(`Invalid ID conversion: "${rawId}" resulted in NaN`);
            return null;
          }
          
          return numericId;
        })
        .filter((id): id is number => id !== null);
      
      return ids;
      
    } catch (error) {
      console.error('Error fetching Palantir publications:', error);
      return [];
    }
  };

  const hasOpenAlexId = (scholar: Scholar): boolean => {
    const id = scholar.scholarId || (scholar as any).id;
    return id && typeof id === 'string' && /^A\d{10}$/.test(id);
  };

  const toggleScholarSelection = (scholarId: string) => {
    const newSelected = new Set(selectedScholars);
    if (newSelected.has(scholarId)) {
      newSelected.delete(scholarId);
    } else {
      newSelected.add(scholarId);
    }
    setSelectedScholars(newSelected);
  };

  const selectAll = () => {
    setSelectedScholars(new Set(scholars.map(s => s.scholarId || (s as any).id || s.name)));
  };

  const selectNone = () => {
    setSelectedScholars(new Set());
  };

  const convertPublication = (pub: OpenAlexPublication, scholarId: string): GoogleScholarPub => {
    let extractedId: number;
    
    if (typeof pub.id === 'string' && pub.id.startsWith('https://openalex.org/W')) {
      const idString = pub.id.replace('https://openalex.org/W', '');
      extractedId = parseInt(idString, 10);
    } else {
      extractedId = typeof pub.id === 'string' ? parseInt(pub.id, 10) : Number(pub.id);
    }
    
    if (isNaN(extractedId)) {
      console.warn(`Failed to extract valid ID from: "${pub.id}"`);
      extractedId = 0;
    }
    
    return {
      id: extractedId,
      title: pub.title,
      pubYear: pub.publication_year,
      author: pub.authorships.map((a: any) => a.author.display_name).join(', '),
      journal: pub.primary_location?.source?.display_name || '',
      pubUrl: pub.doi ? `https://doi.org/${pub.doi}` : (pub.primary_location?.landing_page_url || ''),
      numCitations: pub.cited_by_count,
      citation: '',
      citesId: []
    } as GoogleScholarPub;
  };

  const filterNewPublications = (
    openAlexPubs: GoogleScholarPub[], 
    palantirIds: number[]
  ): GoogleScholarPub[] => {
    const palantirIdsSet = new Set(palantirIds);
    
    return openAlexPubs.filter(pub => {
      const pubId = Number(pub.id);
      
      if (isNaN(pubId)) {
        console.warn(`Invalid publication ID: ${pub.id}`);
        return false;
      }
      
      return !palantirIdsSet.has(pubId);
    });
  };

  const searchOpenAlexAuthors = async (scholarName: string): Promise<OpenAlexAuthor[]> => {
    try {
      const searchParam = encodeURIComponent(scholarName.trim());
      const url = `https://api.openalex.org/authors?filter=display_name.search:${searchParam}&per_page=5`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.results || [];
      
    } catch (error) {
      console.error(`Error searching OpenAlex authors for ${scholarName}:`, error);
      return [];
    }
  };

  const getPublicationsForAuthor = async (authorId: string): Promise<GoogleScholarPub[]> => {
    try {
      const workUrl = `https://api.openalex.org/works?filter=author.id:${encodeURIComponent(authorId)}&per_page=50&sort=publication_date:desc`;
      
      const response = await fetch(workUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const results = data.results || [];
      
      return results.map((pub: OpenAlexPublication) => convertPublication(pub, authorId));
      
    } catch (error) {
      console.error(`Error fetching publications for author ${authorId}:`, error);
      return [];
    }
  };

  const updateScholarPublications = async (scholar: Scholar): Promise<BatchUpdateResult> => {
    try {
      const scholarId = scholar.scholarId || (scholar as any).id || scholar.name;
      
      if (hasOpenAlexId(scholar)) {
        const openAlexAuthorId = `https://openalex.org/${scholarId}`;
        const openAlexPubs = await getPublicationsForAuthor(openAlexAuthorId);
        
        const palantirIds = await fetchPalantirPublications(scholarId);
        const newPubs = filterNewPublications(openAlexPubs, palantirIds);

        if (newPubs.length > 0 && saveToPalantir) {
          const publicationsForPalantir = newPubs.map(pub => ({
            id: pub.id || 0,
            title: pub.title || "",
            publication_year: pub.pubYear || 0,
            journal: pub.journal || "",
            authors: pub.author || "",
            publication_url: pub.pubUrl || "",
            num_citations: pub.numCitations || 0,
            openalex_author_id: extractOpenAlexId(scholarId), // FIXED: Extract clean ID
            openalex_author_name: scholar.name || ""
          }));

          await savePublicationsToPalantir(publicationsForPalantir, auth.accessToken!);
        }

        return {
          scholarId: scholarId,
          scholarName: scholar.name,
          status: newPubs.length > 0 ? 'success' : 'no-updates',
          newPublications: newPubs.length,
          openAlexAuthorId: scholarId
        };
      } 
      else {
        const searchResults = await searchOpenAlexAuthors(scholar.name);
        
        if (searchResults.length === 0) {
          return {
            scholarId: scholarId,
            scholarName: scholar.name,
            status: 'error',
            newPublications: 0,
            error: 'No matches found in OpenAlex'
          };
        }

        return {
          scholarId: scholarId,
          scholarName: scholar.name,
          status: 'needs-selection',
          newPublications: 0,
          searchResults: searchResults
        };
      }

    } catch (error) {
      const scholarId = scholar.scholarId || (scholar as any).id || scholar.name;
      return {
        scholarId: scholarId,
        scholarName: scholar.name,
        status: 'error',
        newPublications: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const selectAuthorForScholar = async (scholarIndex: number, selectedAuthor: OpenAlexAuthor) => {
    const result = updateResults[scholarIndex];
    if (!result) return;

    try {
      const openAlexPubs = await getPublicationsForAuthor(selectedAuthor.id);
      const scholar = scholars.find(s => (s.scholarId || (s as any).id || s.name) === result.scholarId);
      
      if (!scholar) return;

      const palantirIds = await fetchPalantirPublications(result.scholarId);
      const newPubs = filterNewPublications(openAlexPubs, palantirIds);

      if (newPubs.length > 0 && saveToPalantir) {
        const publicationsForPalantir = newPubs.map(pub => ({
          id: pub.id || 0,
          title: pub.title || "",
          publication_year: pub.pubYear || 0,
          journal: pub.journal || "",
          authors: pub.author || "",
          publication_url: pub.pubUrl || "",
          num_citations: pub.numCitations || 0,
          openalex_author_id: result.scholarId,
          openalex_author_name: scholar.name || ""
        }));

        await savePublicationsToPalantir(publicationsForPalantir, auth.accessToken!);
      }

      const updatedResults = [...updateResults];
      updatedResults[scholarIndex] = {
        ...result,
        status: newPubs.length > 0 ? 'success' : 'no-updates',
        newPublications: newPubs.length,
        openAlexAuthorId: selectedAuthor.id,
        searchResults: undefined
      };
      setUpdateResults(updatedResults);

    } catch (error) {
      const updatedResults = [...updateResults];
      updatedResults[scholarIndex] = {
        ...result,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to update publications'
      };
      setUpdateResults(updatedResults);
    }
  };

  const handleBatchUpdate = async () => {
    if (!auth.accessToken) {
      alert('Authentication required. Please log in again.');
      return;
    }

    if (selectedScholars.size === 0) {
      alert('Please select at least one scholar to update.');
      return;
    }

    const scholarsToUpdate = scholars.filter(s => 
      selectedScholars.has(s.scholarId || (s as any).id || s.name)
    );

    setIsUpdating(true);
    setUpdateResults([]);
    setShowResults(true);
    setProgress({ current: 0, total: scholarsToUpdate.length });

    const results: BatchUpdateResult[] = [];

    for (let i = 0; i < scholarsToUpdate.length; i++) {
      const scholar = scholarsToUpdate[i];
      setProgress({ current: i + 1, total: scholarsToUpdate.length });
      
      const result = await updateScholarPublications(scholar);
      results.push(result);
      setUpdateResults([...results]);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsUpdating(false);
    onUpdateComplete();
  };

  const handleSaveAllToPalantir = async () => {
    if (!auth.accessToken) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsSaving(true);
    setSaveResults(null);

    try {
      const selectedScholarsList = scholars.filter(s => 
        selectedScholars.has(s.scholarId || (s as any).id || s.name)
      );

      let allNewPublications: any[] = [];

      for (const scholar of selectedScholarsList) {
        const scholarId = scholar.scholarId || (scholar as any).id || scholar.name;
        
        const palantirIds = await fetchPalantirPublications(scholarId);
        const palantirIdsSet = new Set(palantirIds);
        
        const newPublications = (scholar.googleScholarPubs || [])
          .filter(pub => {
            const pubId = Number(pub.id || 0);
            return !isNaN(pubId) && !palantirIdsSet.has(pubId);
          })
          .map(pub => ({
            id: pub.id || 0,
            title: pub.title || "",
            publication_year: pub.pubYear || 0,
            journal: pub.journal || "",
            authors: pub.author || "",
            publication_url: pub.pubUrl || "",
            num_citations: pub.numCitations || 0,
            openalex_author_id: extractOpenAlexId(scholarId), // FIXED: Extract clean ID
            openalex_author_name: scholar.name || ""
          }));
        
        allNewPublications = allNewPublications.concat(newPublications);
      }

      if (allNewPublications.length === 0) {
        setSaveResults({
          success: true,
          message: "No new publications to save - all publications are already in Palantir"
        });
        return;
      }

      await savePublicationsToPalantir(allNewPublications, auth.accessToken!);
      
      setSaveResults({
        success: true,
        message: `Successfully saved ${allNewPublications.length} new publications to Palantir`
      });

    } catch (error) {
      setSaveResults({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save to Palantir'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const successCount = updateResults.filter((r: BatchUpdateResult) => r.status === 'success').length;
  const errorCount = updateResults.filter((r: BatchUpdateResult) => r.status === 'error').length;
  const noUpdateCount = updateResults.filter((r: BatchUpdateResult) => r.status === 'no-updates').length;
  const needsSelectionCount = updateResults.filter((r: BatchUpdateResult) => r.status === 'needs-selection').length;
  const totalNewPublications = updateResults.reduce((sum: number, r: BatchUpdateResult) => sum + r.newPublications, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Selective Batch Publication Update</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={saveToPalantir}
              onChange={(e) => setSaveToPalantir(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Save to Palantir after update</span>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">Select Scholars to Update ({selectedScholars.size}/{scholars.length})</h4>
          <div className="flex space-x-2">
            <button
              onClick={selectAll}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={selectNone}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Select None
            </button>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto border rounded-lg">
          {scholars.map((scholar) => {
            const scholarId = scholar.scholarId || (scholar as any).id || scholar.name;
            const hasId = hasOpenAlexId(scholar);
            
            return (
              <div
                key={scholarId}
                className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedScholars.has(scholarId)}
                    onChange={() => toggleScholarSelection(scholarId)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{scholar.name}</p>
                    <p className="text-sm text-gray-500">{scholar.affiliation || 'No affiliation'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hasId ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Has OpenAlex ID
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                      <Search className="h-3 w-3 mr-1" />
                      Needs Search
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{scholarId}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleBatchUpdate}
          disabled={isUpdating || selectedScholars.size === 0}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating... ({progress.current}/{progress.total})
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Selected Publications ({selectedScholars.size})
            </>
          )}
        </button>

        {saveToPalantir && updateResults.length > 0 && !isUpdating && (
          <button
            onClick={handleSaveAllToPalantir}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Database className="h-4 w-4 mr-2 animate-pulse" />
                Saving to Palantir...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Save Selected to Palantir
              </>
            )}
          </button>
        )}
      </div>

      {isUpdating && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Processing scholars...</span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {saveResults && (
        <div className={`mt-4 p-3 rounded-lg ${saveResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${saveResults.success ? 'text-green-700' : 'text-red-700'}`}>
            {saveResults.message}
          </p>
        </div>
      )}

      {showResults && updateResults.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Update Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Successful</p>
                  <p className="text-lg font-bold text-green-900">{successCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">No Updates</p>
                  <p className="text-lg font-bold text-gray-900">{noUpdateCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center">
                <Search className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Needs Selection</p>
                  <p className="text-lg font-bold text-yellow-900">{needsSelectionCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-900">Errors</p>
                  <p className="text-lg font-bold text-red-900">{errorCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">New Publications</p>
                  <p className="text-lg font-bold text-blue-900">{totalNewPublications}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scholar</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Publications</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {updateResults.map((result, index) => (
                  <tr key={result.scholarId}>
                    <td className="px-4 py-2 text-sm text-gray-900">{result.scholarName}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        result.status === 'success' ? 'bg-green-100 text-green-800' :
                        result.status === 'error' ? 'bg-red-100 text-red-800' :
                        result.status === 'needs-selection' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status === 'success' ? 'Updated' :
                         result.status === 'error' ? 'Error' :
                         result.status === 'needs-selection' ? 'Choose Author' :
                         'No Updates'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{result.newPublications}</td>
                    <td className="px-4 py-2">
                      {result.status === 'needs-selection' && result.searchResults && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 mb-2">Select matching author:</p>
                          {result.searchResults.map((author) => (
                            <button
                              key={author.id}
                              onClick={() => selectAuthorForScholar(index, author)}
                              className="block w-full text-left p-2 text-xs border rounded hover:bg-gray-50"
                            >
                              <div className="font-medium">{author.display_name}</div>
                              <div className="text-gray-500">
                                {author.works_count} works, {author.cited_by_count} citations
                                {author.affiliations?.[0] && (
                                  <div>@ {author.affiliations[0].institution.display_name}</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {result.status === 'error' && (
                        <span className="text-xs text-red-600">{result.error}</span>
                      )}
                      {result.status === 'success' && (
                        <span className="text-xs text-green-600">✓ Complete</span>
                      )}
                      {result.status === 'no-updates' && (
                        <span className="text-xs text-gray-600">Up to date</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchPublicationUpdate;