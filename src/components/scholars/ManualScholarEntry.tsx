import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ManualScholarEntryProps {
  showManualEntry: boolean;
  setShowManualEntry: (show: boolean) => void;
  searchLoading: boolean;
  handleManualSubmit: (manualEntry: ManualEntry) => Promise<void>;
  manualEntry: ManualEntry;
  setManualEntry: (manualEntry: ManualEntry) => void;
  error: string | null;
}

interface ManualEntry {
  name: string;
  affiliation: string;
  emailDomain: string;
  citedby: number;
  hindex: number;
}

const ManualScholarEntry: React.FC<ManualScholarEntryProps> = ({
  showManualEntry,
  setShowManualEntry,
  searchLoading,
  handleManualSubmit,
  manualEntry,
  setManualEntry
}) => {


  return (
    <>
      {showManualEntry && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Add Scholar Manually</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={manualEntry.name}
                  onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                <input
                  type="text"
                  value={manualEntry.affiliation}
                  onChange={(e) => setManualEntry({ ...manualEntry, affiliation: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain</label>
                <input
                  type="text"
                  value={manualEntry.emailDomain}
                  onChange={(e) => setManualEntry({ ...manualEntry, emailDomain: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Citations</label>
                <input
                  type="number"
                  value={manualEntry.citedby}
                  onChange={(e) => setManualEntry({ ...manualEntry, citedby: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">h-index</label>
                <input
                  type="number"
                  value={manualEntry.hindex}
                  onChange={(e) => setManualEntry({ ...manualEntry, hindex: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowManualEntry(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManualSubmit(manualEntry)}
                disabled={searchLoading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                {searchLoading ? 'Adding...' : 'Add Scholar'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ManualScholarEntry;