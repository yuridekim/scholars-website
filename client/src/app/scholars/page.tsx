// src/app/scholars/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scholar } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type GoogleScholarSearchResult = {
    name: string;
    affiliation: string;
    emailDomain?: string;
    scholarId: string;
    citedby: number;
    hindex: number;
};

export default function ScholarsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [scholars, setScholars] = useState<Scholar[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<GoogleScholarSearchResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSearchResult, setSelectedSearchResult] = useState<GoogleScholarSearchResult | null>(null);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualEntry, setManualEntry] = useState({
        name: '',
        affiliation: '',
        emailDomain: '',
        citedby: 0,
        hindex: 0
    });

     useEffect(() => {
        fetch('/api/scholars')
            .then((res) => res.json())
            .then((data: Scholar[]) => {
                setScholars(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching scholars:', error);
                setLoading(false);
                setError('Failed to load scholars');
            });
    }, []);

    const handleScholarClick = (id: number) => {
        router.push(`/scholars/${id}`);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setSearchResults(null);
        setError(null);
        setSelectedSearchResult(null)
    };

    const handleGoogleScholarSearch = async () => {
        setSearchLoading(true);
        setError(null);
        setSearchResults(null);
        setSelectedSearchResult(null);


        try {
             // Mock Google Scholar Search API call (replace with real logic)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockResults: GoogleScholarSearchResult[] = [
                 {
                    name: searchQuery,
                    affiliation: 'Mock University 1',
                    emailDomain: 'mock1.edu',
                    scholarId: "mock_google_id1",
                    citedby: Math.floor(Math.random() * 5000),
                    hindex: Math.floor(Math.random() * 100),
                },
                 {
                    name: searchQuery,
                     affiliation: 'Mock University 2',
                    emailDomain: 'mock2.edu',
                    scholarId: "mock_google_id2",
                     citedby: Math.floor(Math.random() * 5000),
                    hindex: Math.floor(Math.random() * 100),
                }
            ]

          setSearchResults(mockResults);
        } catch (error) {
            console.error('Error during Google Scholar Search:', error);
            setError('Failed to fetch data from Google Scholar.');
        } finally {
            setSearchLoading(false);
        }
    };


      const handleAddScholar = async () => {
          if (!selectedSearchResult){
             setError('Please select a scholar to add')
             return;
          }
          setError(null);
        setSearchLoading(true);
        try {
            const response = await fetch('/api/scholars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profile: selectedSearchResult }),
            });

           if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 409) {
                setError(errorData.error || 'Scholar already exists');
              } else {
                  throw new Error('Failed to add new scholar.');
              }
          } else {
            const data = await response.json()
             // Update the scholars list with the new entry (for display)
               setScholars(prev => [...prev, {...selectedSearchResult, id: data.id}]);
            setSearchResults(null)
             setSelectedSearchResult(null)
         }
        } catch (error) {
            console.error('Error during adding Scholar:', error);
            setError('Failed to add scholar to database.');
        } finally {
             setSearchLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!manualEntry.name) {
            setError('Name is required');
            return;
        }
        
        setError(null);
        setSearchLoading(true);
        
        try {
            const response = await fetch('/api/scholars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profile: {
                        ...manualEntry,
                        scholarId: `manual_${Date.now()}`
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add scholar');
            }

            const data = await response.json();
            setScholars(prev => [...prev, { ...manualEntry, id: data.id }]);
            setShowManualEntry(false);
            setManualEntry({
                name: '',
                affiliation: '',
                emailDomain: '',
                citedby: 0,
                hindex: 0
            });
        } catch (error) {
            console.error('Error during manual scholar addition:', error);
            setError('Failed to add scholar to database.');
        } finally {
            setSearchLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    const filteredScholars = scholars.filter((scholar) =>
        scholar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (scholar.affiliation?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Scholars Directory</h1>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search scholars by name or affiliation..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {error && (
                    <p className="text-red-500 mt-2 mb-4">{error}</p>
                )}

                {searchQuery.trim() !== '' && (
                    <div className="flex flex-col items-center space-y-4 mb-8">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleGoogleScholarSearch}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                                disabled={searchLoading}
                            >
                                {searchLoading ? 'Searching...' : 'Search Google Scholar'}
                            </button>
                            <Separator orientation="vertical" className="h-8" />
                            <button
                                onClick={() => setShowManualEntry(true)}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Add Scholar Manually
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">
                            Can't find who you're looking for? Add their information manually.
                        </p>
                    </div>
                )}

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
                                        onChange={(e) => setManualEntry(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                                    <input
                                        type="text"
                                        value={manualEntry.affiliation}
                                        onChange={(e) => setManualEntry(prev => ({ ...prev, affiliation: e.target.value }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain</label>
                                    <input
                                        type="text"
                                        value={manualEntry.emailDomain}
                                        onChange={(e) => setManualEntry(prev => ({ ...prev, emailDomain: e.target.value }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Citations</label>
                                    <input
                                        type="number"
                                        value={manualEntry.citedby}
                                        onChange={(e) => setManualEntry(prev => ({ ...prev, citedby: parseInt(e.target.value) || 0 }))}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">h-index</label>
                                    <input
                                        type="number"
                                        value={manualEntry.hindex}
                                        onChange={(e) => setManualEntry(prev => ({ ...prev, hindex: parseInt(e.target.value) || 0 }))}
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
                                    onClick={handleManualSubmit}
                                    disabled={searchLoading}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
                                >
                                    {searchLoading ? 'Adding...' : 'Add Scholar'}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliation</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citations</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">h-index</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredScholars.map((scholar) => (
                                <tr
                                    key={scholar.id}
                                    onClick={() => handleScholarClick(scholar.id)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{scholar.name}</div>
                                         {scholar.emailDomain && (
                                            <div className="text-sm text-gray-500">{scholar.emailDomain}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500">{scholar.affiliation || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{scholar.citedby || 0}</div>
                                        {scholar.citedby5y && (
                                            <div className="text-xs text-gray-500">Last 5y: {scholar.citedby5y}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{scholar.hindex || 0}</div>
                                        {scholar.hindex5y && (
                                            <div className="text-xs text-gray-500">Last 5y: {scholar.hindex5y}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
                  

                {searchResults && (
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Potential Matches from Google Scholar</h2>
                    <ul>
                      {searchResults.map((result, index) => (
                        <li key={index} className="mb-2 p-4 border rounded shadow-sm bg-white hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedSearchResult(result)}
                          style={{ backgroundColor: selectedSearchResult?.scholarId === result.scholarId ? '#e0f7fa' : 'white' }}
                        >
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-gray-500">{result.affiliation}</p>
                            <p className="text-sm text-gray-500">Citations: {result.citedby}, H-index: {result.hindex}</p>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-end mt-4">
                      <button
                          onClick={handleAddScholar}
                           disabled={searchLoading || !selectedSearchResult}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
                      >
                        {searchLoading ? 'Adding...' : 'Add Scholar to Database'}
                      </button>
                       </div>
                     </div>
                )}

            </div>
        </div>
    );
}