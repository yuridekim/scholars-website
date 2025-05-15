// components/scholars/BatchScholarImport.tsx
import React, { useState, useEffect } from 'react';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import axios from 'axios';
import Papa, { ParseResult } from 'papaparse';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Upload, RefreshCw, FileText } from 'lucide-react';
import { saveScholarToPalantir } from '@/components/palantir/palantirScholars';

interface CSVScholar {
  name: string;
  affiliation?: string;
  openalex_id?: string;
  email_domain?: string;
  [key: string]: string | number | undefined;
}

interface OpenAlexScholar {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  summary_stats?: {
    h_index?: number;
    i10_index?: number;
  };
  affiliations?: Array<{
    institution: {
      display_name: string;
    };
  }>;
}

interface ProcessedScholarItem {
  csvData: CSVScholar;
  status: 'ready' | 'needs_confirmation' | 'processing' | 'success' | 'error';
  message?: string;
  matchOptions?: OpenAlexScholar[];
  selectedMatch?: OpenAlexScholar;
  expanded?: boolean;
  isSearching?: boolean;
}

interface BatchScholarImportProps {
  onScholarAdded?: () => void;
}

const BatchScholarImport: React.FC<BatchScholarImportProps> = ({ onScholarAdded }) => {
  const auth = useFoundryAuth();
  const [file, setFile] = useState<File | null>(null);
  const [processedScholars, setProcessedScholars] = useState<Array<ProcessedScholarItem>>([]);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [overallStatus, setOverallStatus] = useState<{
    total: number;
    ready: number;
    needsConfirmation: number;
    success: number;
    error: number;
  }>({ total: 0, ready: 0, needsConfirmation: 0, success: 0, error: 0 });
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCurrentStep(1);
      setProcessedScholars([]);
    }
  };

  const parseCSV = () => {
    if (!file) return;
    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<CSVScholar>) => {
        const parsedScholars = results.data.filter(s => s.name && s.name.trim() !== '');
        initializeScholars(parsedScholars);
        setIsUploading(false);
        setCurrentStep(2);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsUploading(false);
      }
    });
  };

  const initializeScholars = (scholarList: CSVScholar[]) => {
    const initialProcessed = scholarList.map(scholar => {
      if (scholar.openalex_id) {
        return {
          csvData: scholar,
          status: 'ready' as const,
          message: 'Ready to import with OpenAlex ID'
        };
      } else {
        return {
          csvData: scholar,
          status: 'needs_confirmation' as const,
          message: 'Needs manual confirmation or search',
          matchOptions: [],
          expanded: false,
          isSearching: false
        };
      }
    });
    setProcessedScholars(initialProcessed);
    updateOverallStatus(initialProcessed);
  };

  const updateOverallStatus = (scholarsToUpdate: typeof processedScholars) => {
    const status = {
      total: scholarsToUpdate.length,
      ready: scholarsToUpdate.filter(s => s.status === 'ready').length,
      needsConfirmation: scholarsToUpdate.filter(s => s.status === 'needs_confirmation').length,
      success: scholarsToUpdate.filter(s => s.status === 'success').length,
      error: scholarsToUpdate.filter(s => s.status === 'error').length
    };
    setOverallStatus(status);
  };

  const searchOpenAlex = async (scholar: CSVScholar, index: number) => {
    if (!scholar.name) return;
    
    setProcessedScholars(prevScholars => {
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
      
      console.log('OpenAlex response:', response.data);
      
      if (response.data.results && response.data.results.length > 0) {
        setProcessedScholars(prevScholars => {
          const updatedScholars = [...prevScholars];
          updatedScholars[index] = {
            ...updatedScholars[index],
            matchOptions: response.data.results,
            isSearching: false,
            message: `Found ${response.data.results.length} potential matches`
          };
          return updatedScholars;
        });
      } else {
        setProcessedScholars(prevScholars => {
          const updatedScholars = [...prevScholars];
          updatedScholars[index] = {
            ...updatedScholars[index],
            matchOptions: [],
            isSearching: false,
            message: 'No matches found in OpenAlex.'
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
      
      setProcessedScholars(prevScholars => {
        const updatedScholars = [...prevScholars];
        updatedScholars[index] = {
          ...updatedScholars[index],
          isSearching: false,
          message: `Error searching OpenAlex: ${errorMessage}`
        };
        return updatedScholars;
      });
    }
  };

  const toggleExpand = (index: number) => {
    const updatedScholars = [...processedScholars];
    if (!updatedScholars[index].expanded && (!updatedScholars[index].matchOptions || updatedScholars[index].matchOptions!.length === 0) && updatedScholars[index].status === 'needs_confirmation') {
      searchOpenAlex(updatedScholars[index].csvData, index);
    } else {
      updatedScholars[index] = { 
        ...updatedScholars[index], 
        expanded: !updatedScholars[index].expanded 
      };
      setProcessedScholars(updatedScholars);
    }
  };

  const selectMatch = (scholarIndex: number, match: OpenAlexScholar) => {
    const updatedScholars = [...processedScholars];
    updatedScholars[scholarIndex] = {
      ...updatedScholars[scholarIndex],
      selectedMatch: match,
      status: 'ready',
      message: `Match selected: ${match.display_name}`
    };
    setProcessedScholars(updatedScholars);
    updateOverallStatus(updatedScholars);
  };

  const extractOpenAlexId = (url: string): string => {
    const urlMatch = url.match(/https:\/\/openalex\.org\/([A-Z0-9]+)/);
    return (urlMatch && urlMatch[1]) ? urlMatch[1] : (url.split('/').pop() || '');
  };

  const getAffiliation = (scholar: OpenAlexScholar): string => {
    return (scholar.affiliations && scholar.affiliations.length > 0)
      ? scholar.affiliations.map(aff => aff.institution.display_name).join(', ')
      : 'No affiliation information';
  };

  const getEmailDomain = (affiliation: string): string => {
    if (!affiliation) return '@unknown.edu';
    if (affiliation.includes('UCLA')) return '@ucla.edu';
    if (affiliation.includes('Stanford')) return '@stanford.edu';
    if (affiliation.includes('MIT')) return '@mit.edu';
    if (affiliation.includes('Berkeley') || affiliation.includes('UC Berkeley')) return '@berkeley.edu';
    if (affiliation.includes('Harvard')) return '@harvard.edu';
    const firstPart = affiliation.split(',')[0].trim();
    if (firstPart) {
      const simplifiedName = firstPart.toLowerCase().replace(/university of /gi, '').replace(/[^a-z0-9]/gi, '');
      return `@${simplifiedName}.edu`;
    }
    return '@unknown.edu';
  };

  const importScholar = async (scholarIndex: number): Promise<boolean> => {
    if (!auth?.accessToken) return false;
    
    setProcessedScholars(prevScholars => {
      const updatedScholars = [...prevScholars];
      updatedScholars[scholarIndex] = { 
        ...updatedScholars[scholarIndex], 
        status: 'processing' 
      };
      updateOverallStatus(updatedScholars);
      return updatedScholars;
    });

    try {
      const scholarData = processedScholars[scholarIndex];
      
      let openAlexDataToUse: Partial<OpenAlexScholar> = {};
      let finalAffiliation = scholarData.csvData.affiliation || '';

      if (scholarData.selectedMatch) {
        openAlexDataToUse = scholarData.selectedMatch;
        if (!finalAffiliation) finalAffiliation = getAffiliation(scholarData.selectedMatch);
      } else if (scholarData.csvData.openalex_id) {
        openAlexDataToUse = { id: scholarData.csvData.openalex_id };
      } else {
        // If neither is present, we might allow import if manually marked ready
        // For now, we assume an OpenAlex ID (from CSV or match) is preferred,
        // but if it's manually marked ready without one, we can proceed with available CSV data.
        // The current logic means openAlexDataToUse.id might be undefined if no selectedMatch and no csv.openalex_id
        // This should be fine if manuallyAddScholar makes it 'ready' without an ID.
        // The error "No OpenAlex data (ID or selected match) to proceed." might trigger if this path isn't handled.
        // Let's adjust to make openAlexId potentially undefined if no ID is available but status is 'ready' (e.g. manual override)
        // If openAlexDataToUse.id is undefined, extractOpenAlexId will return empty string.
      }

      const openAlexId = openAlexDataToUse.id ? extractOpenAlexId(openAlexDataToUse.id) : '';
      
      const palantirScholar = {
        id: -1,
        name: scholarData.csvData.name,
        email_domain: scholarData.csvData.email_domain || getEmailDomain(finalAffiliation),
        affiliation: finalAffiliation,
        scholar_id: openAlexId, // This will be empty string if no OpenAlex ID
        citedby: openAlexDataToUse.cited_by_count || 0,
        citedby5y: 0,
        hindex: openAlexDataToUse.summary_stats?.h_index || 0,
        hindex5y: 0,
        i10index: openAlexDataToUse.summary_stats?.i10_index || 0,
        i10index5y: 0,
        total_pub: openAlexDataToUse.works_count || 0,
        interests: "",
        full_name: scholarData.csvData.name,
        method: "batch_csv_import",
        summary_training_start: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        homepage: ""
      };

      if (!openAlexId && !scholarData.selectedMatch && !scholarData.csvData.openalex_id) {
        console.warn(`Importing scholar ${scholarData.csvData.name} without an OpenAlex ID.`);
      }


      await saveScholarToPalantir(palantirScholar, auth.accessToken);
      
      setProcessedScholars(prevScholars => {
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
      
      setProcessedScholars(prevScholars => {
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

  const importAllReadyScholars = async () => {
    if (!auth?.accessToken || isProcessingGlobal) return;
    
    setIsProcessingGlobal(true);
    setCurrentStep(3);
    
    let anySuccess = false;
    const readyScholars = processedScholars
      .map((scholar, index) => ({ scholar, index }))
      .filter(item => item.scholar.status === 'ready');
    
    for (const { index } of readyScholars) {
      const success = await importScholar(index);
      if (success) anySuccess = true;
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsProcessingGlobal(false);
    
    setProcessedScholars(current => {
      updateOverallStatus(current);
      return current;
    });
    
    if (anySuccess && onScholarAdded) {
      onScholarAdded();
    }
  };

  const resetForm = () => {
    setFile(null);
    setProcessedScholars([]);
    setCurrentStep(1);
    setOverallStatus({ total: 0, ready: 0, needsConfirmation: 0, success: 0, error: 0 });
    setIsProcessingGlobal(false);
  };

  const getStep3StatusText = (status: ProcessedScholarItem['status']) => {
    switch (status) {
      case 'success': return 'Imported Successfully';
      case 'error': return 'Import Failed';
      case 'processing': return 'Processing...';
      case 'ready': return 'Pending Import (Ready)';
      case 'needs_confirmation': return 'Skipped (Needs Confirmation)';
      default: return 'Unknown Status';
    }
  };

  const manuallyAddScholar = (index: number) => {
    const scholar = processedScholars[index];
    if (!scholar) return;
    
    const updatedScholars = [...processedScholars];
    updatedScholars[index] = {
      ...updatedScholars[index],
      status: 'ready',
      message: 'Manually marked as ready to import. OpenAlex ID may be missing.',
      selectedMatch: undefined, // Clear any previous match if marking manually
      expanded: false // Collapse after marking ready
    };
    
    setProcessedScholars(updatedScholars);
    updateOverallStatus(updatedScholars);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Batch CSV Scholar Import</h2>

      <div className="mb-6">
        <div className="flex items-center">
          {[1, 2, 3].map((stepNum, idx, arr) => (
            <React.Fragment key={stepNum}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= stepNum ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{stepNum}</div>
              {idx < arr.length - 1 && <div className={`h-1 flex-1 ${currentStep > stepNum ? 'bg-blue-500' : 'bg-gray-200'}`}></div>}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-sm mt-1 text-gray-600">
          <span>Upload CSV</span>
          <span>Review & Confirm</span>
          <span>Import Results</span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Authentication Status</h3>
        <div className="p-2 bg-gray-100 rounded">
          {auth.accessToken && auth.isAuthenticated ? (
            <div className="text-green-600 flex items-center"><CheckCircle2 className="h-4 w-4 mr-2" />Authenticated with Foundry</div>
          ) : (
            <div className="text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-2" />
              {auth.accessToken && auth.expiresAt && Date.now() >= auth.expiresAt ? "Session expired. Please login again." : "Not authenticated. Please login first."}
            </div>
          )}
        </div>
      </div>

      {currentStep === 1 && (
        <div className="mt-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-700 mb-4">Upload a CSV file. Required: <strong>name</strong>. Optional: <strong>affiliation</strong>, <strong>openalex_id</strong>, <strong>email_domain</strong>.</p>
            <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
            <label htmlFor="csv-upload" className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"><Upload className="h-4 w-4 mr-2" />Select CSV File</label>
            {file && (
              <div className="mt-4">
                <p className="text-green-600 font-medium flex items-center justify-center"><CheckCircle2 className="h-4 w-4 mr-2" />{file.name} selected</p>
                <button onClick={parseCSV} disabled={isUploading} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300">{isUploading ? <span className="flex items-center"><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Processing...</span> : 'Process CSV'}</button>
              </div>
            )}
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Sample CSV Format</h4>
            <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
              name,affiliation,openalex_id,email_domain{'\n'}
              John Smith,Stanford University,A2208157462,@stanford.edu{'\n'}
              Sarah Johnson,UCLA,A2208093170,@ucla.edu{'\n'}
              Michael Chen,UC Berkeley,,@berkeley.edu{'\n'}
              Emily Rodriguez,Harvard University,,
            </pre>
          </div>
        </div>
      )}

      {currentStep === 2 && processedScholars.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Review Scholars ({processedScholars.length})</h3>
            <div className="flex space-x-4">
              <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Start Over</button>
              <button onClick={importAllReadyScholars} disabled={!auth?.accessToken || overallStatus.ready === 0 || isProcessingGlobal} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300">
                {isProcessingGlobal ? 'Processing...' : `Import ${overallStatus.ready} Ready Scholars`}
              </button>
            </div>
          </div>
          <div className="flex space-x-2 sm:space-x-4 mb-6 text-xs sm:text-sm">
            {['Total', 'Ready', 'Needs Confirmation'].map(type => (
              <div key={type} className={`px-2 sm:px-4 py-2 rounded-lg ${type === 'Ready' ? 'bg-blue-100' : type === 'Needs Confirmation' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <span className="font-medium">{type}:</span> {overallStatus[type.toLowerCase().replace(' ', '') as keyof typeof overallStatus]}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {processedScholars.map((scholar, index) => (
              <div key={index} className={`border rounded-lg overflow-hidden ${ scholar.status === 'ready' ? 'border-blue-200 bg-blue-50' : scholar.status === 'needs_confirmation' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow mb-2 sm:mb-0">
                      <div className="flex items-center">
                        <p className="font-medium">{scholar.csvData.name}</p>
                        <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${ scholar.status === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{scholar.status === 'ready' ? 'Ready' : 'Needs Confirmation'}</span>
                      </div>
                      <p className="text-sm text-gray-500">{scholar.csvData.affiliation || 'No affiliation provided'}</p>
                      {scholar.csvData.openalex_id && <p className="text-xs text-gray-500 mt-1">CSV OpenAlex ID: {scholar.csvData.openalex_id}</p>}
                      {scholar.selectedMatch && <p className="text-xs text-green-600 mt-1">Selected: {scholar.selectedMatch.display_name} (ID: {extractOpenAlexId(scholar.selectedMatch.id)})</p>}
                      {scholar.message && (scholar.status !== 'ready' || (scholar.status === 'ready' && scholar.message !== 'Ready to import with OpenAlex ID' && scholar.message !== `Match selected: ${scholar.selectedMatch?.display_name}`)) && <p className="text-sm text-gray-600 mt-1">{scholar.message}</p>}
                    </div>
                    <div className="flex space-x-2">
                      {scholar.status === 'needs_confirmation' && (
                        <>
                          <button onClick={() => toggleExpand(index)} className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm">
                            {scholar.expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />} {scholar.expanded ? 'Hide Matches' : 'Find Matches'}
                          </button>
                          <button onClick={() => manuallyAddScholar(index)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            Mark as Ready
                          </button>
                        </>
                      )}
                       {scholar.status === 'ready' && (
                        <button
                          onClick={async () => {
                            const success = await importScholar(index);
                            if (success && onScholarAdded) onScholarAdded();
                          }}
                          disabled={!auth?.accessToken || scholar.status !== 'ready'}
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
                        <p className="text-gray-500">{scholar.message || 'No matches found in OpenAlex.'}</p>
                         {(scholar.message?.includes('Error searching OpenAlex') || scholar.message?.includes('No matches found')) && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">The OpenAlex API may be experiencing issues or no matches were found for this scholar.</p>
                            <p className="text-sm mt-2">You can:</p>
                            <ul className="list-disc ml-6 mt-1 text-sm">
                              <li>Try searching again</li>
                              <li>Use the "Mark as Ready" button to continue (OpenAlex ID will be missing)</li>
                              <li>Edit your CSV to add an `openalex_id` and re-upload</li>
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
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Potential Matches from OpenAlex</h4>
                        <div className="space-y-3">
                          {scholar.matchOptions.map((match, matchIndex) => (
                            <div key={matchIndex} className="flex justify-between items-start p-3 border rounded hover:bg-gray-50">
                              <div>
                                <p className="font-medium">{match.display_name}</p>
                                <p className="text-sm text-gray-500">{getAffiliation(match)}</p>
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
        </div>
      )}

      {currentStep === 3 && (
        <div className="mt-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">Import Results</h3>
            <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Start New Import</button>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 text-xs sm:text-sm">
            {['Total', 'Success', 'Error'].map(type => (
              <div key={type} className={`px-2 sm:px-4 py-2 rounded-lg ${type === 'Success' ? 'bg-green-100' : type === 'Error' ? 'bg-red-100' : 'bg-gray-100'}`}>
                <span className="font-medium">{type}:</span> {overallStatus[type.toLowerCase() as keyof typeof overallStatus]}
              </div>
            ))}
             <div className="px-2 sm:px-4 py-2 bg-yellow-100 rounded-lg">
                <span className="font-medium">Pending/Skipped:</span> {overallStatus.total - overallStatus.success - overallStatus.error}
            </div>
          </div>
          <div className="space-y-4">
            {processedScholars.map((scholar, index) => (
              <div key={index} className={`border rounded-lg p-4 ${scholar.status === 'success' ? 'border-green-200 bg-green-50' : scholar.status === 'error' ? 'border-red-200 bg-red-50' : scholar.status === 'processing' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{scholar.csvData.name}</p>
                      <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${scholar.status === 'success' ? 'bg-green-100 text-green-800' : scholar.status === 'error' ? 'bg-red-100 text-red-800' : scholar.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {getStep3StatusText(scholar.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{scholar.csvData.affiliation || 'No affiliation'}</p>
                    {scholar.message && <p className={`text-sm mt-1 ${scholar.status === 'error' ? 'text-red-600' : scholar.status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>{scholar.message}</p>}
                  </div>
                  {scholar.status === 'ready' && currentStep === 3 && (
                    <button
                      onClick={async () => {
                        const success = await importScholar(index);
                        if (success && onScholarAdded) onScholarAdded();
                      }}
                      disabled={!auth?.accessToken || isProcessingGlobal}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 text-sm"
                    >
                      Retry Import
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isProcessingGlobal && <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center"><RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-3" /><p>Batch processing scholars... Please wait.</p></div>}
          {overallStatus.success > 0 && !isProcessingGlobal && currentStep === 3 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /><p className="font-medium text-green-800">Batch import process complete. {overallStatus.success} scholars imported.</p></div>
              <p className="text-green-600 mt-2 text-sm">Refresh the main scholar list if not automatically updated.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BatchScholarImport;