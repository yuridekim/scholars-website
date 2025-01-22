'use client';

import React, { useState, useEffect } from 'react';

export default function RVizPage() {
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlot();
  }, []);

  const fetchPlot = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/r-plot');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch plot');
      
      setPlotData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visualization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">R Visualization</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {loading && (
          <div className="text-center py-8">Loading visualization...</div>
        )}
        
        {error && (
          <div className="text-red-500 py-4">
            Error: {error}
            <button 
              onClick={fetchPlot}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}
        
        {plotData && (
          <div>
            <div className="mb-6">
              <img
                src={`data:image/png;base64,${plotData.plot}`}
                alt="R Generated Plot"
                className="w-full h-auto"
              />
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Data Points:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(plotData.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}