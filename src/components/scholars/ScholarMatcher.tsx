// components/scholars/ScholarMatcher.tsx
import React from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { CSVScholar, OpenAlexScholar, ProcessedScholarItem } from './batchImportTypes';
import { extractOpenAlexId, getAffiliation } from './batchImportUtils';
import { saveScholarToPalantir } from '@/components/palantir/palantirScholars';

interface ScholarMatcherProps {
  scholars: ProcessedScholarItem[];
  setScholars: React.Dispatch<React.SetStateAction<ProcessedScholarItem[]>>;
  updateOverallStatus: (scholars: ProcessedScholarItem[]) => void;
  authToken?: string;
  onScholarAdded?: () => void;
}

// Define a type that includes the static method
interface ScholarMatcherComponentType extends React.FC<ScholarMatcherProps> {
  importScholar: (
    scholarIndex: number, 
    scholars: ProcessedScholarItem[],
    setScholars: React.Dispatch<React.SetStateAction<ProcessedScholarItem[]>>,
    updateOverallStatus: (scholars: ProcessedScholarItem[]) => void,
    authToken?: string
  ) => Promise<boolean>;
}

const ScholarMatcher: ScholarMatcherComponentType = ({ 
  scholars, 
  setScholars, 
  updateOverallStatus, 
  authToken,
  onScholarAdded 
}) => {
  const searchOpenAlex = async (scholar: CSVScholar, index: number) => {
    if (!scholar.name) return;
    
    setScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      updatedScholars[index] = {
        ...updatedScholars[index],
        isSearching: true,
        message: 'Searching OpenAlex...',
        expanded: true
      };
      return updatedScholars;
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await axios.get<{ results: OpenAlexScholar[] }>('https://api.openalex.org/authors', {
        params: { search: scholar.name, per_page: 5 },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.results && response.data.results.length > 0) {
        setScholars(prevScholars => {
          const updatedScholars = [...prevScholars];
          updatedScholars[index] = {
            ...updatedScholars[index],
            matchOptions: response.data.results,
            isSearching: false,
            message: `Found ${response.data.results.length} potential matches. Please select one.`
          };
          return updatedScholars;
        });
      } else {
        setScholars(prevScholars => {
          const updatedScholars = [...prevScholars];
          updatedScholars[index] = {
            ...updatedScholars[index],
            matchOptions: [],
            isSearching: false,
            message: 'No matches found in OpenAlex. Cannot import without an OpenAlex ID.'
          };
          return updatedScholars;
        });
      }
    } catch (err) {
      console.error('Error searching OpenAlex:', err);
      const errorMessage = err instanceof Error 
        ? (err.name === 'AbortError' 
            ? 'Search timed out. The OpenAlex API may be slow or unavailable.' 
            : err.message)
        : String(err);
      
      setScholars(prevScholars => {
        const updatedScholars = [...prevScholars];
        updatedScholars[index] = {
          ...updatedScholars[index],
          isSearching: false,
          message: `Error searching OpenAlex: ${errorMessage}. Cannot import without an OpenAlex ID.`
        };
        return updatedScholars;
      });
    }
  };

  const toggleExpand = (index: number) => {
    setScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      const scholarItem = updatedScholars[index];

      if (!scholarItem.expanded && scholarItem.status === 'needs_confirmation' && (!scholarItem.matchOptions || scholarItem.matchOptions.length === 0) && !scholarItem.isSearching) {
        searchOpenAlex(scholarItem.csvData, index); 
        return updatedScholars;
      } else {
        updatedScholars[index] = { 
          ...scholarItem, 
          expanded: !scholarItem.expanded 
        };
        return updatedScholars;
      }
    });
  };

  const selectMatch = (scholarIndex: number, match: OpenAlexScholar) => {
    setScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      updatedScholars[scholarIndex] = {
        ...updatedScholars[scholarIndex],
        selectedMatch: match,
        status: 'ready',
        message: `Match selected: ${match.display_name}`,
        expanded: false
      };
      updateOverallStatus(updatedScholars);
      return updatedScholars;
    });
  };

  const importScholar = async (scholarIndex: number) => {
    if (!authToken) return false;
    
    setScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      updatedScholars[scholarIndex] = { 
        ...updatedScholars[scholarIndex], 
        status: 'processing',
        message: 'Importing...' 
      };
      return updatedScholars;
    });

    try {
      const scholarData = scholars[scholarIndex];
      let openAlexIdToUse: string = '';
      let affiliationFromOpenAlex: string = '';
      let openAlexWorksCount: number = 0;
      let openAlexCitedByCount: number = 0;
      let openAlexHIndex: number | undefined = undefined;
      let openAlexI10Index: number | undefined = undefined;

      if (scholarData.selectedMatch) {
          openAlexIdToUse = extractOpenAlexId(scholarData.selectedMatch.id);
          affiliationFromOpenAlex = getAffiliation(scholarData.selectedMatch);
          openAlexWorksCount = scholarData.selectedMatch.works_count || 0;
          openAlexCitedByCount = scholarData.selectedMatch.cited_by_count || 0;
          openAlexHIndex = scholarData.selectedMatch.summary_stats?.h_index;
          openAlexI10Index = scholarData.selectedMatch.summary_stats?.i10_index;
      } else if (scholarData.csvData.openalex_id) {
          openAlexIdToUse = extractOpenAlexId(scholarData.csvData.openalex_id);
      }

      if (!openAlexIdToUse) {
          const errorMessage = 'Cannot import: OpenAlex ID is missing.';
          setScholars(prevScholars => {
              const updatedScholars = [...prevScholars];
              updatedScholars[scholarIndex] = {
                  ...updatedScholars[scholarIndex],
                  status: 'error',
                  message: errorMessage
              };
              updateOverallStatus(updatedScholars);
              return updatedScholars;
          });
          console.error(errorMessage, scholarData.csvData.name);
          return false;
      }
      
      const palantirScholar = {
        id: -1,
        name: scholarData.csvData.name,
        email_domain: '@unknown.edu',
        affiliation: affiliationFromOpenAlex,
        scholar_id: openAlexIdToUse,
        citedby: openAlexCitedByCount,
        citedby5y: 0,
        hindex: openAlexHIndex || 0,
        hindex5y: 0,
        i10index: openAlexI10Index || 0,
        i10index5y: 0,
        total_pub: openAlexWorksCount,
        interests: "",
        full_name: scholarData.csvData.name,
        method: "batch_csv_import",
        summary_training_start: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        homepage: ""
      };

      await saveScholarToPalantir(palantirScholar, authToken);
      
      setScholars(prevScholars => {
        const updatedScholars = [...prevScholars];
        updatedScholars[scholarIndex] = { 
          ...updatedScholars[scholarIndex], 
          status: 'success', 
          message: 'Successfully imported to Palantir' 
        };
        updateOverallStatus(updatedScholars);
        return updatedScholars;
      });
      
      return true;
    } catch (err) {
      console.error('Error importing scholar:', err);
      setScholars(prevScholars => {
        const updatedScholars = [...prevScholars];
        updatedScholars[scholarIndex] = { 
          ...updatedScholars[scholarIndex], 
          status: 'error', 
          message: `Error: ${err instanceof Error ? err.message : String(err)}` 
        };
        updateOverallStatus(updatedScholars);
        return updatedScholars;
      });
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {scholars.map((scholar, index) => (
        <div key={index} className={`border rounded-lg overflow-hidden ${ scholar.status === 'ready' ? 'border-blue-200 bg-blue-50' : scholar.status === 'needs_confirmation' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div className="flex-grow mb-2 sm:mb-0">
                <div className="flex items-center">
                  <p className="font-medium">{scholar.csvData.name}</p>
                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${ scholar.status === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{scholar.status === 'ready' ? 'Ready' : 'Needs OpenAlex ID'}</span>
                </div>
                {scholar.csvData.openalex_id && (!scholar.selectedMatch) && <p className="text-xs text-gray-500 mt-1">CSV OpenAlex ID: {scholar.csvData.openalex_id}</p>}
                {scholar.selectedMatch && <p className="text-xs text-green-600 mt-1">Selected: {scholar.selectedMatch.display_name} (ID: {extractOpenAlexId(scholar.selectedMatch.id)})</p>}
                {scholar.message && (scholar.status !== 'ready' || (scholar.status === 'ready' && scholar.message !== 'Ready to import with provided OpenAlex ID.' && !scholar.message?.startsWith('Match selected:'))) && <p className="text-sm text-gray-600 mt-1">{scholar.message}</p>}
              </div>
              <div className="flex space-x-2">
                {scholar.status === 'needs_confirmation' && (
                  <button onClick={() => toggleExpand(index)} className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm">
                    {scholar.expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />} {scholar.expanded ? 'Hide Matches' : 'Find & Select Match'}
                  </button>
                )}
                {scholar.status === 'ready' && (
                  <button
                    onClick={async () => {
                      const success = await importScholar(index);
                      if (success && onScholarAdded) onScholarAdded();
                    }}
                    disabled={!authToken || scholar.status !== 'ready'}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 text-sm"
                  >
                    Import
                  </button>
                )}
              </div>
            </div>
          </div>
          {scholar.expanded && scholar.status === 'needs_confirmation' && (
            <div className="border-t border-gray-200 bg-white p-4">
              {scholar.isSearching && (
                <div className="flex items-center text-blue-600">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <p>Searching OpenAlex API... This may take a moment.</p>
                </div>
              )}
              
              {!scholar.isSearching && (!scholar.matchOptions || scholar.matchOptions.length === 0) && (
                <div>
                  <p className="text-gray-500">{scholar.message || 'No matches found in OpenAlex. Cannot import without an OpenAlex ID.'}</p>
                  {(scholar.message?.includes('Error searching OpenAlex') || scholar.message?.includes('No matches found')) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">The OpenAlex API may be experiencing issues or no matches were found for this scholar.</p>
                      <p className="text-sm mt-2">You can:</p>
                      <ul className="list-disc ml-6 mt-1 text-sm">
                        <li>Try searching again.</li>
                        <li>Edit your CSV to add an `openalex_id` and re-upload the file.</li>
                      </ul>
                      <button 
                        onClick={() => searchOpenAlex(scholar.csvData, index)}
                        className="mt-3 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Retry Search
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {!scholar.isSearching && scholar.matchOptions && scholar.matchOptions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Potential Matches from OpenAlex - Select one to proceed:</h4>
                  <div className="space-y-3">
                    {scholar.matchOptions.map((match, matchIndex) => (
                      <div key={matchIndex} className="flex justify-between items-start p-3 border rounded hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{match.display_name}</p>
                          <p className="text-sm text-gray-500">{getAffiliation(match) || 'No affiliation information'}</p>
                          <p className="text-xs text-gray-400">ID: {extractOpenAlexId(match.id)}</p>
                          <p className="text-sm text-gray-600 mt-1">Works: {match.works_count || 'N/A'} | Citations: {match.cited_by_count || 'N/A'} | h-index: {match.summary_stats?.h_index || 'N/A'}</p>
                        </div>
                        <button onClick={() => selectMatch(index, match)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Select</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Export a static method so it can be called from BatchScholarImport
ScholarMatcher.importScholar = async (
  scholarIndex: number, 
  scholars: ProcessedScholarItem[],
  setScholars: React.Dispatch<React.SetStateAction<ProcessedScholarItem[]>>,
  updateOverallStatus: (scholars: ProcessedScholarItem[]) => void,
  authToken?: string
) => {
  if (!authToken) return false;
  
  setScholars(prevScholars => {
    const updatedScholars = [...prevScholars];
    updatedScholars[scholarIndex] = { 
      ...updatedScholars[scholarIndex], 
      status: 'processing',
      message: 'Importing...' 
    };
    return updatedScholars;
  });

  try {
    const scholarData = scholars[scholarIndex];
    let openAlexIdToUse: string = '';
    let affiliationFromOpenAlex: string = '';
    let openAlexWorksCount: number = 0;
    let openAlexCitedByCount: number = 0;
    let openAlexHIndex: number | undefined = undefined;
    let openAlexI10Index: number | undefined = undefined;

    if (scholarData.selectedMatch) {
        openAlexIdToUse = extractOpenAlexId(scholarData.selectedMatch.id);
        affiliationFromOpenAlex = getAffiliation(scholarData.selectedMatch);
        openAlexWorksCount = scholarData.selectedMatch.works_count || 0;
        openAlexCitedByCount = scholarData.selectedMatch.cited_by_count || 0;
        openAlexHIndex = scholarData.selectedMatch.summary_stats?.h_index;
        openAlexI10Index = scholarData.selectedMatch.summary_stats?.i10_index;
    } else if (scholarData.csvData.openalex_id) {
        openAlexIdToUse = extractOpenAlexId(scholarData.csvData.openalex_id);
    }

    if (!openAlexIdToUse) {
        const errorMessage = 'Cannot import: OpenAlex ID is missing.';
        setScholars(prevScholars => {
            const updatedScholars = [...prevScholars];
            updatedScholars[scholarIndex] = {
                ...updatedScholars[scholarIndex],
                status: 'error',
                message: errorMessage
            };
            updateOverallStatus(updatedScholars);
            return updatedScholars;
        });
        console.error(errorMessage, scholarData.csvData.name);
        return false;
    }
    
    const palantirScholar = {
      id: -1,
      name: scholarData.csvData.name,
      email_domain: '@unknown.edu',
      affiliation: affiliationFromOpenAlex,
      scholar_id: openAlexIdToUse,
      citedby: openAlexCitedByCount,
      citedby5y: 0,
      hindex: openAlexHIndex || 0,
      hindex5y: 0,
      i10index: openAlexI10Index || 0,
      i10index5y: 0,
      total_pub: openAlexWorksCount,
      interests: "",
      full_name: scholarData.csvData.name,
      method: "batch_csv_import",
      summary_training_start: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      homepage: ""
    };

    await saveScholarToPalantir(palantirScholar, authToken);
    
    setScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      updatedScholars[scholarIndex] = { 
        ...updatedScholars[scholarIndex], 
        status: 'success', 
        message: 'Successfully imported to Palantir' 
      };
      updateOverallStatus(updatedScholars);
      return updatedScholars;
    });
    
    return true;
  } catch (err) {
    console.error('Error importing scholar:', err);
    setScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      updatedScholars[scholarIndex] = { 
        ...updatedScholars[scholarIndex], 
        status: 'error', 
        message: `Error: ${err instanceof Error ? err.message : String(err)}` 
      };
      updateOverallStatus(updatedScholars);
      return updatedScholars;
    });
    return false;
  }
};

export default ScholarMatcher as ScholarMatcherComponentType;