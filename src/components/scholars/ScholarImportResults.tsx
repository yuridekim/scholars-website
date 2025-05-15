// components/scholars/ScholarImportResults.tsx
import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { ProcessedScholarItem } from './batchImportTypes';
import { getStep3StatusText } from './batchImportUtils';
import ScholarMatcher from './ScholarMatcher';

interface ScholarImportResultsProps {
  scholars: ProcessedScholarItem[];
  overallStatus: {
    total: number;
    ready: number;
    needsConfirmation: number;
    success: number;
    error: number;
  };
  isProcessingGlobal: boolean;
  resetForm: () => void;
  onScholarAdded?: () => void;
  setScholars: React.Dispatch<React.SetStateAction<ProcessedScholarItem[]>>;
  updateOverallStatus: (scholars: ProcessedScholarItem[]) => void;
  authToken?: string;
}

const ScholarImportResults: React.FC<ScholarImportResultsProps> = ({
  scholars,
  overallStatus,
  isProcessingGlobal,
  resetForm,
  onScholarAdded,
  setScholars,
  updateOverallStatus,
  authToken
}) => {
  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Import Results</h3>
        <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Start New Import</button>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 text-xs sm:text-sm">
        {['Total', 'Success', 'Error'].map(type => (
          <div key={type} className={`px-2 sm:px-4 py-2 rounded-lg ${type === 'Success' ? 'bg-green-100 text-green-800' : type === 'Error' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
            <span className="font-medium">{type}:</span> {overallStatus[type.toLowerCase() as keyof typeof overallStatus]}
          </div>
        ))}
         <div className="px-2 sm:px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
            <span className="font-medium">Pending/Skipped:</span> {overallStatus.total - overallStatus.success - overallStatus.error}
        </div>
      </div>
      <div className="space-y-4">
        {scholars.map((scholar, index) => (
          <div key={index} className={`border rounded-lg p-4 ${scholar.status === 'success' ? 'border-green-200 bg-green-50' : scholar.status === 'error' ? 'border-red-200 bg-red-50' : scholar.status === 'processing' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <p className="font-medium">{scholar.csvData.name}</p>
                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${scholar.status === 'success' ? 'bg-green-100 text-green-800' : scholar.status === 'error' ? 'bg-red-100 text-red-800' : scholar.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {getStep3StatusText(scholar.status)}
                  </span>
                </div>
                {scholar.message && <p className={`text-sm mt-1 ${scholar.status === 'error' ? 'text-red-600' : scholar.status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>{scholar.message}</p>}
              </div>
              {(scholar.status === 'ready' || scholar.status === 'error') && (
                <button
                  onClick={async () => {
                    const success = await ScholarMatcher.importScholar(
                      index,
                      scholars,
                      setScholars,
                      updateOverallStatus,
                      authToken
                    );
                    if (success && onScholarAdded) onScholarAdded();
                  }}
                  disabled={!authToken || isProcessingGlobal}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 text-sm"
                >
                 {scholar.status === 'error' ? 'Retry Import' : 'Import'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {isProcessingGlobal && <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center"><RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-3" /><p>Batch processing scholars... Please wait.</p></div>}
      {overallStatus.success > 0 && !isProcessingGlobal && (
        <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex items-center"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /><p className="font-medium text-green-800">Batch import process complete. {overallStatus.success} scholars imported.</p></div>
          {(overallStatus.error > 0 || (overallStatus.total - overallStatus.success - overallStatus.error > 0)) && 
            <p className="text-green-600 mt-2 text-sm">
                {overallStatus.error > 0 && `${overallStatus.error} scholar(s) failed to import. `}
                {(overallStatus.total - overallStatus.success - overallStatus.error > 0) && `${overallStatus.total - overallStatus.success - overallStatus.error} scholar(s) were skipped or pending.`}
            </p>
          }
          <p className="text-green-600 mt-2 text-sm">Refresh the main scholar list if not automatically updated.</p>
        </div>
      )}
    </div>
  );
};

export default ScholarImportResults;