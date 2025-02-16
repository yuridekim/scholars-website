'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleScholarSearchResult } from '@/lib/types';
import { ManualScholarEntry, ScholarStats, ScholarList, AddScholar, ScholarFilters } from '@/components/scholars';
import { useScholars } from '@/hooks/useScholars';
import { Download } from 'lucide-react';

export default function ScholarsPage() {
    const router = useRouter();
    const {
        scholars,
        filteredScholars,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        uniqueAffiliations,
        uniqueEmailDomains,
        stats,
    } = useScholars();

    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<GoogleScholarSearchResult[] | null>(null);
    const [selectedSearchResult, setSelectedSearchResult] = useState<GoogleScholarSearchResult | null>(null);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualEntry, setManualEntry] = useState({
      name: '',
      affiliation: '',
      emailDomain: '',
      citedby: 0,
      hindex: 0
  });

    const [filterShowState, setFilterShowState] = useState(false);

    const handleExport = () => {
        const csvContent = [
            ['Name', 'Affiliation', 'Citations', 'H-Index', 'Email Domain'].join(','),
            ...filteredScholars.map(scholar => [
                `"${scholar.name}"`,
                `"${scholar.affiliation || ''}"`,
                scholar.citedby || 0,
                scholar.hindex || 0,
                `"${scholar.emailDomain || ''}"`,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'scholars_data.csv';
        link.click();
    };

    const handleGoogleScholarSearch = async () => {
        setSearchLoading(true);
        //setError(null); // Access error through the hook if needed.
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
        } catch (err) {
            console.error('Error during Google Scholar Search:', err);
            //setError('Failed to fetch data from Google Scholar.'); //Access error through the hook if needed.
        } finally {
            setSearchLoading(false);
        }
    };


    const handleAddScholar = async () => {
        //if (!selectedSearchResult) {
        //    setError('Please select a scholar to add')
        //    return;
        //}
        //setError(null); // Access error through the hook if needed.
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
                    //setError(errorData.error || 'Scholar already exists'); //Access error through the hook if needed.
                } else {
                    throw new Error('Failed to add new scholar.');
                }
            } else {
                const data = await response.json()
                // Update the scholars list with the new entry (for display)
                //setScholars(prev => [...prev, { ...selectedSearchResult, id: data.id }]); // Update via the hook's state setter
                setSearchResults(null)
                setSelectedSearchResult(null)
            }
        } catch (err) {
            console.error('Error during adding Scholar:', err);
           // setError('Failed to add scholar to database.'); //Access error through the hook if needed.
        } finally {
            setSearchLoading(false);
        }
    };

    const handleManualSubmit = async (manualEntry:any) => {
        //if (!manualEntry.name) {
        //    setError('Name is required');
        //    return;
        //}

        //setError(null); // Access error through the hook if needed.
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
            //setScholars(prev => [...prev, { ...manualEntry, id: data.id }]); // Update via the hook's state setter
            setShowManualEntry(false);
            setManualEntry({
              name: '',
              affiliation: '',
              emailDomain: '',
              citedby: 0,
              hindex: 0
          });
        } catch (err) {
            console.error('Error during manual scholar addition:', err);
            //setError('Failed to add scholar to database.'); //Access error through the hook if needed.
        } finally {
            setSearchLoading(false);
        }
    };

    const handleTitleClick = () => {
        router.push('/');
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1
                        className="text-2xl font-bold text-gray-900 cursor-pointer"
                        onClick={handleTitleClick}
                    >
                        Scholar Performance Tracker
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Download size={20} />
                            Export Data ({filteredScholars.length} scholars)
                        </button>
                    </div>
                </div>
                <ScholarFilters
                    filters={filters}
                    setFilters={setFilters}
                    uniqueAffiliations={uniqueAffiliations}
                    uniqueEmailDomains={uniqueEmailDomains}
                    showFilters={filterShowState}
                    setShowFilters={setFilterShowState}
                />

                <ScholarStats stats={stats} />

                <AddScholar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    selectedSearchResult={selectedSearchResult}
                    setSelectedSearchResult={setSelectedSearchResult}
                    handleGoogleScholarSearch={handleGoogleScholarSearch}
                    handleAddScholar={handleAddScholar}
                    searchLoading={searchLoading}
                    error={error}
                    showManualEntry={showManualEntry}
                    setShowManualEntry={setShowManualEntry}
                />

                <ManualScholarEntry
                    showManualEntry={showManualEntry}
                    setShowManualEntry={setShowManualEntry}
                    searchLoading={searchLoading}
                    handleManualSubmit={handleManualSubmit}
                    error={error}
                    manualEntry={manualEntry}  // Pass manualEntry
                    setManualEntry={setManualEntry}  // Pass setManualEntry
                />

                <ScholarList scholars={filteredScholars} />
            </div>
        </div>
    );
}