// components/scholars/BatchScholarImport.tsx
import React, { useState } from 'react';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import Papa, { ParseResult } from 'papaparse';
import { AlertCircle, CheckCircle2, Upload, RefreshCw, FileText } from 'lucide-react';
import { CSVScholar, ProcessedScholarItem, BatchScholarImportProps } from './batchImportTypes';
import {ScholarMatcher, ScholarImportResults} from '@/components/scholars';

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
    const providedOpenAlexId = scholar.openalex_id && scholar.openalex_id.trim() !== '' ? scholar.openalex_id.trim() : undefined;
    if (providedOpenAlexId) {
      return {
        csvData: { ...scholar, openalex_id: providedOpenAlexId },
        status: 'ready' as const,
        message: 'Ready to import with provided OpenAlex ID. Full details will be fetched during import.'
      };
    } else {
      return {
        csvData: scholar,
        status: 'needs_confirmation' as const,
        message: 'OpenAlex ID required. Search and select a match, or provide ID in CSV.',
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

  const importAllReadyScholars = async () => {
    if (!auth?.accessToken || isProcessingGlobal) return;
    
    setIsProcessingGlobal(true);
    setCurrentStep(3);
    
    let anySuccess = false;
    const readyScholarsIndices = processedScholars
      .map((scholar, index) => ({ scholar, index }))
      .filter(item => item.scholar.status === 'ready')
      .map(item => item.index);
    
    for (const index of readyScholarsIndices) {
      if (processedScholars[index]?.status === 'ready') {
        const success = await ScholarMatcher.importScholar(
          index, 
          processedScholars, 
          setProcessedScholars, 
          updateOverallStatus, 
          auth.accessToken
        );
        if (success) anySuccess = true;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    setIsProcessingGlobal(false);
    
    setProcessedScholars(currentScholars => {
        updateOverallStatus(currentScholars);
        return currentScholars;
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
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
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
            <p className="text-gray-700 mb-4">Upload a CSV file. Required: <strong>name</strong>. Optional: <strong>openalex_id</strong>.</p>
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
              name,openalex_id{'\n'}
              John Smith,A2208157462{'\n'}
              Sarah Johnson,A2208093170{'\n'}
              Michael Chen,{'\n'}
              Emily Rodriguez,
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
              <div key={type} className={`px-2 sm:px-4 py-2 rounded-lg ${type === 'Ready' ? 'bg-blue-100 text-blue-800' : type === 'Needs Confirmation' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
                <span className="font-medium">{type}:</span> {overallStatus[type.toLowerCase().replace(' ', '') as keyof typeof overallStatus]}
              </div>
            ))}
          </div>

          <ScholarMatcher 
            scholars={processedScholars}
            setScholars={setProcessedScholars}
            updateOverallStatus={updateOverallStatus}
            authToken={auth?.accessToken || undefined}
            onScholarAdded={onScholarAdded}
          />
        </div>
      )}

      {currentStep === 3 && (
        <ScholarImportResults
          scholars={processedScholars}
          overallStatus={overallStatus}
          isProcessingGlobal={isProcessingGlobal}
          resetForm={resetForm}
          onScholarAdded={onScholarAdded}
          setScholars={setProcessedScholars}
          updateOverallStatus={updateOverallStatus}
          authToken={auth?.accessToken || undefined}
        />
      )}
    </div>
  );
}

export default BatchScholarImport;