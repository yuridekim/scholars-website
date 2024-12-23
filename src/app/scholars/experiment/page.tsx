// app/scholars/experiment/page.tsx
'use client';
import { useState } from 'react';
import { PubMedResult } from './components/PubMedResult';
import { ParsedPubMedResult } from '@/app/api/scholars/experiment/pubmed/types';

export default function ScholarExperiment() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Example paper data - you would get this from your database
  const samplePapers = [
    {
      title: "Attention Is All You Need",
      author: "Yang Zhang"
    }
    // {
    //   title: "Modeling within-item dependencies in parallel data on test responses and brain activation",
    //   author: "Minjeong Jeon"
    // }
  ];

  const handleFetchPubMed = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scholars/experiment/pubmed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          papers: samplePapers
        }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching PubMed data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Scholar API Experiment</h1>
      
      <div className="space-y-4">
        <button 
          onClick={handleFetchPubMed}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch PubMed Data'}
        </button>

        {results?.data && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            <div className="space-y-6">
              {results.data.map((item: ParsedPubMedResult, index: number) => (
                <PubMedResult key={index} data={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}