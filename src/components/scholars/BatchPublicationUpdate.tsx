// BatchPublicationUpdate.tsx
import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';
import { Scholar, GoogleScholarPub } from '@/lib/types';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import { savePublicationsToPalantir } from '@/components/palantir/palantirPublications';

interface OpenAlexAuthor {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
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
  status: 'success' | 'error' | 'no-updates';
  newPublications: number;
  error?: string;
  openAlexAuthorId?: string;
}

interface BatchPublicationUpdateProps {
  scholars: Scholar[];
  onUpdateComplete: () => void;
}

const BatchPublicationUpdate: React.FC<BatchPublicationUpdateProps> = ({
  scholars,
  onUpdateComplete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState<BatchUpdateResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);
  const [saveToPalantir, setSaveToPalantir] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResults, setSaveResults] = useState<{ success: boolean; message: string } | null>(null);
  
  const auth = useFoundryAuth();

  const convertPublication = (pub: OpenAlexPublication, scholarId: string): GoogleScholarPub => {
    return {
      id: parseInt(pub.id.replace('https://openalex.org/W', '')) || 0,
      title: pub.title,
      pubYear: pub.publication_year,
      author: pub.authorships.map(a => a.author.display_name).join(', '),
      journal: pub.primary_location?.source?.display_name || '',
      pubUrl: pub.doi ? `https://doi.org/${pub.doi}` : (pub.primary_location?.landing_page_url || ''),
      numCitations: pub.cited_by_count,
      citation: '',
      citesId: []
    } as GoogleScholarPub;
  };

  const findOpenAlexAuthor = async (scholarName: string): Promise<OpenAlexAuthor | null> => {
    try {
      const searchParam = encodeURIComponent(scholarName.trim());
      const url = `https://api.openalex.org/authors?filter=display_name.search:${searchParam}&per_page=5`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const results = data.results || [];
      
      return results.length > 0 ? results[0] : null;
      
    } catch (error) {
      console.error(`Error finding OpenAlex author for ${scholarName}:`, error);
      return null;
    }
  };

  const getPublicationsForAuthor = async (author: OpenAlexAuthor): Promise<GoogleScholarPub[]> => {
    try {
      const workUrl = `https://api.openalex.org/works?filter=author.id:${encodeURIComponent(author.id)}&per_page=50&sort=publication_date:desc`;
      
      const response = await fetch(workUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const results = data.results || [];
      
      return results.map((pub: OpenAlexPublication) => convertPublication(pub, author.id));
      
    } catch (error) {
      console.error(`Error fetching publications for ${author.display_name}:`, error);
      return [];
    }
  };

  const updateScholarPublications = async (scholar: Scholar): Promise<BatchUpdateResult> => {
    try {
      const scholarId = scholar.scholarId || (scholar as any).id || scholar.name;
      
      const openAlexAuthor = await findOpenAlexAuthor(scholar.name);
      
      if (!openAlexAuthor) {
        return {
          scholarId: scholarId,
          scholarName: scholar.name,
          status: 'error',
          newPublications: 0,
          error: 'Author not found in OpenAlex'
        };
      }

      const openAlexPubs = await getPublicationsForAuthor(openAlexAuthor);
      
      const existingTitles = new Set(
        (scholar.googleScholarPubs || []).map(p => p.title.toLowerCase().trim())
      );
      
      const newPubs = openAlexPubs.filter(
        pub => !existingTitles.has(pub.title.toLowerCase().trim())
      );

      if (newPubs.length > 0) {
        const response = await fetch(`/api/scholars/${scholarId}/publications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.accessToken}`
          },
          body: JSON.stringify({ publications: newPubs })
        });

        if (!response.ok) {
          throw new Error(`Failed to save publications: ${response.statusText}`);
        }
      }

      return {
        scholarId: scholarId,
        scholarName: scholar.name,
        status: newPubs.length > 0 ? 'success' : 'no-updates',
        newPublications: newPubs.length,
        openAlexAuthorId: openAlexAuthor.id
      };

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

  const handleBatchUpdate = async () => {
    if (!auth.accessToken) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsUpdating(true);
    setUpdateResults([]);
    setShowResults(true);
    setProgress({ current: 0, total: scholars.length });

    const results: BatchUpdateResult[] = [];

    for (let i = 0; i < scholars.length; i++) {
      const scholar = scholars[i];
      setProgress({ current: i + 1, total: scholars.length });
      
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
      const allPublications = scholars.flatMap(scholar => {
        const scholarId = scholar.scholarId || (scholar as any).id || scholar.name;
        return (scholar.googleScholarPubs || []).map(pub => ({
          id: pub.id || 0,
          title: pub.title || "",
          publication_year: pub.pubYear || 0,
          journal: pub.journal || "",
          authors: pub.author || "",
          publication_url: pub.pubUrl || "",
          num_citations: pub.numCitations || 0,
          openalex_author_id: scholarId,
          openalex_author_name: scholar.name || ""
        }));
      });

      await savePublicationsToPalantir(allPublications, auth.accessToken);
      
      setSaveResults({
        success: true,
        message: `Successfully saved ${allPublications.length} publications to Palantir`
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

  const successCount = updateResults.filter(r => r.status === 'success').length;
  const errorCount = updateResults.filter(r => r.status === 'error').length;
  const noUpdateCount = updateResults.filter(r => r.status === 'no-updates').length;
  const totalNewPublications = updateResults.reduce((sum, r) => sum + r.newPublications, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Batch Publication Update</h3>
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

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Update publications for all {scholars.length} scholars using OpenAlex data.
        </p>
        <p className="text-xs text-yellow-600">
          ⚠️ This process may take several minutes and will check each scholar individually.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleBatchUpdate}
          disabled={isUpdating || scholars.length === 0}
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
              Update All Publications
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
                Save All to Palantir
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress Bar */}
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

      {/* Save Results */}
      {saveResults && (
        <div className={`mt-4 p-3 rounded-lg ${saveResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${saveResults.success ? 'text-green-700' : 'text-red-700'}`}>
            {saveResults.message}
          </p>
        </div>
      )}

      {/* Results Summary */}
      {showResults && updateResults.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Update Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

          {/* Detailed Results */}
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scholar</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Publications</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {updateResults.map((result) => (
                  <tr key={result.scholarId}>
                    <td className="px-4 py-2 text-sm text-gray-900">{result.scholarName}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        result.status === 'success' ? 'bg-green-100 text-green-800' :
                        result.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status === 'success' ? 'Updated' :
                         result.status === 'error' ? 'Error' : 'No Updates'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{result.newPublications}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {result.error || (result.status === 'no-updates' ? 'All publications up to date' : 'Success')}
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