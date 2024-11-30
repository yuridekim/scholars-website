// app/scholars/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const defaultData = {
  profile: {
    scholarId: "ykMokgsAAAAJ",
    name: "Minjeong Jeon",
    institution: "University of California, Los Angeles",
    email: "verified@ucla.edu",
    citations: 4647,
    interests: ["latent variable modeling", "psychometrics", "statistics", "measurement"]
  },
  publications: [
    {
      title: "Example Publication",
      year: 2023,
      citation: "M Jeon et al.",
      authors: ["Minjeong Jeon", "Other Author"],
      venue: "Journal of Example Studies",
      numCitations: 10,
      citedbyUrl: "https://scholar.google.com/citations?...",
      pubUrl: "https://example.com/paper",
      citesId: ["abc123", "def456"]
    }
  ]
};

export default function NewScholarPage() {
  const router = useRouter();
  const [jsonData, setJsonData] = useState(JSON.stringify(defaultData, null, 2));
  const [error, setError] = useState('');
  const [existingScholarId, setExistingScholarId] = useState<number | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExistingScholarId(null);

    try {
      const parsedData = JSON.parse(jsonData);
      
      const response = await fetch('/api/scholars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });

      if (!response.ok) {
        if (response.status === 409) {
          const data = await response.json();
          if (data.scholarId) {
            setExistingScholarId(data.scholarId);
            throw new Error(data.error || 'Scholar already exists in database');
          }
        }
        throw new Error('Failed to create scholar');
      }

      router.push('/scholars');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Scholar</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          className="w-full h-[600px] font-mono p-4 border rounded"
          spellCheck="false"
        />
        
        {error && (
          <div className="flex items-center gap-4 text-red-500">
            <span>{error}</span>
            {existingScholarId && (
              <button
                type="button"
                onClick={() => router.push(`/scholars/${existingScholarId}`)}
                className="px-4 py-2 text-blue-500 underline hover:text-blue-600"
              >
                View Existing Scholar
              </button>
            )}
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Scholar
          </button>
        </div>
      </form>
    </div>
  );
}