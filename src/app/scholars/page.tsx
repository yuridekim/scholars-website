// src/app/scholars/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scholar } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Search, Filter, Download, Users, List, X } from 'lucide-react';

type GoogleScholarSearchResult = {
    name: string;
    affiliation: string;
    emailDomain?: string;
    scholarId: string;
    citedby: number;
    hindex: number;
};

interface YearlyStats {
  name: string;
  papers: number;
  citations: number;
}

interface DashboardStats {
  totalScholars: number;
  totalCitations: number;
  averageHIndex: number;
  yearlyStats: YearlyStats[];
}

interface FilterState {
  affiliation: string;
  emailDomain: string;
  citationRange: string;
  hIndexRange: string;
}

export default function ScholarsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [scholars, setScholars] = useState<Scholar[]>([]);
    const [filteredScholars, setFilteredScholars] = useState<Scholar[]>([]);
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

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
      affiliation: '',
      emailDomain: '',
      citationRange: '',
      hIndexRange: '',
    });
    const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);
    const [uniqueEmailDomains, setUniqueEmailDomains] = useState<string[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
      totalScholars: 0,
      totalCitations: 0,
      averageHIndex: 0,
      yearlyStats: [],
    });


    const calculateStats = (scholarData: Scholar[]) => {
      // Calculate basic stats
      const totalScholars = scholarData.length;
      const totalCitations = scholarData.reduce((sum, scholar) => sum + (scholar.citedby || 0), 0);
      const averageHIndex = scholarData.length > 0 
        ? scholarData.reduce((sum, scholar) => sum + (scholar.hindex || 0), 0) / totalScholars 
        : 0;
  
      // Calculate yearly stats from publications
      const yearlyData: Map<string, { papers: number; citations: number }> = new Map();
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 4;
  
      // Initialize years
      for (let year = startYear; year <= currentYear; year++) {
        yearlyData.set(year.toString(), { papers: 0, citations: 0 });
      }
  
      // Aggregate publication data
      scholarData.forEach(scholar => {
        scholar.googleScholarPubs?.forEach(pub => {
          if (pub.pubYear && pub.pubYear >= startYear) {
            const yearStats = yearlyData.get(pub.pubYear.toString());
            if (yearStats) {
              yearStats.papers += 1;
              yearStats.citations += pub.numCitations || 0;
            }
          }
        });
      });
  
      // Convert to array format for chart
      const yearlyStats = Array.from(yearlyData.entries()).map(([name, data]) => ({
        name,
        ...data
      }));
  
      setStats({
        totalScholars,
        totalCitations,
        averageHIndex: Math.round(averageHIndex * 10) / 10,
        yearlyStats: yearlyStats.sort((a, b) => a.name.localeCompare(b.name))
      });
    };

     useEffect(() => {
        fetch('/api/scholars')
            .then((res) => res.json())
            .then((data: Scholar[]) => {
                setScholars(data);
                setFilteredScholars(data);
                const affiliations = Array.from(new Set(data.map(s => s.affiliation).filter((aff): aff is string => !!aff))).sort();
                const domains = Array.from(new Set(data.map(s => s.emailDomain).filter((domain): domain is string => !!domain))).sort();
                
                setUniqueAffiliations(affiliations);
                setUniqueEmailDomains(domains);
                calculateStats(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching scholars:', error);
                setLoading(false);
                setError('Failed to load scholars');
            });
    }, []);

    useEffect(() => {
      const filtered = scholars.filter(scholar => {
        const matchesSearch = scholar.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAffiliation = !filters.affiliation || scholar.affiliation === filters.affiliation;
        const matchesEmailDomain = !filters.emailDomain || scholar.emailDomain === filters.emailDomain;
        
        let matchesCitations = true;
        if (filters.citationRange) {
          const [min, max] = filters.citationRange.split('-').map(Number);
          const citations = scholar.citedby ?? 0;
          matchesCitations = citations >= min && (!max || citations <= max);
        }
  
        let matchesHIndex = true;
        if (filters.hIndexRange) {
          const [min, max] = filters.hIndexRange.split('-').map(Number);
          const hIndex = scholar.hindex ?? 0;
          matchesHIndex = hIndex >= min && (!max || hIndex <= max);
        }
  
        return matchesSearch && matchesAffiliation && matchesEmailDomain && matchesCitations && matchesHIndex;
      });
  
      setFilteredScholars(filtered);
      calculateStats(filtered);
    }, [searchQuery, filters, scholars]);

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

    const resetFilters = () => {
      setFilters({
        affiliation: '',
        emailDomain: '',
        citationRange: '',
        hIndexRange: '',
      });
      setShowFilters(false);
    };

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

    return (
      <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Scholar Performance Tracker</h1>
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
                <div className="bg-white p-4 rounded-lg shadow mb-8">
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                            <input
                              type="text"
                              placeholder="Search scholars..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border rounded-lg"
                             />
                         </div>
                         <button 
                              onClick={() => setShowFilters(!showFilters)}
                              className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${showFilters ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                              <Filter size={20} />
                              Filters
                              {Object.values(filters).some(f => f) && (
                                <span className="ml-2 px-2 py-0.5 text-sm bg-blue-100 text-blue-800 rounded-full">
                                  {Object.values(filters).filter(f => f).length}
                                </span>
                              )}
                            </button>
                    </div>
                    {showFilters && (
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                            <select
                              value={filters.affiliation}
                              onChange={(e) => setFilters(prev => ({ ...prev, affiliation: e.target.value }))}
                              className="w-full p-2 border rounded-lg"
                            >
                              <option value="">All Affiliations</option>
                              {uniqueAffiliations.map(aff => (
                                <option key={aff} value={aff}>{aff}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain</label>
                            <select
                              value={filters.emailDomain}
                              onChange={(e) => setFilters(prev => ({ ...prev, emailDomain: e.target.value }))}
                              className="w-full p-2 border rounded-lg"
                            >
                              <option value="">All Domains</option>
                              {uniqueEmailDomains.map(domain => (
                                <option key={domain} value={domain}>{domain}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Citations Range</label>
                            <select
                              value={filters.citationRange}
                              onChange={(e) => setFilters(prev => ({ ...prev, citationRange: e.target.value }))}
                              className="w-full p-2 border rounded-lg"
                            >
                              <option value="">Any Citations</option>
                              <option value="0-100">0-100</option>
                              <option value="101-500">101-500</option>
                              <option value="501-1000">501-1,000</option>
                              <option value="1001-5000">1,001-5,000</option>
                              <option value="5001-">5,001+</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">h-index Range</label>
                            <select
                              value={filters.hIndexRange}
                              onChange={(e) => setFilters(prev => ({ ...prev, hIndexRange: e.target.value }))}
                              className="w-full p-2 border rounded-lg"
                            >
                              <option value="">Any h-index</option>
                              <option value="0-10">0-10</option>
                              <option value="11-20">11-20</option>
                              <option value="21-30">21-30</option>
                              <option value="31-50">31-50</option>
                              <option value="51-">51+</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                          >
                            <X size={16} />
                            Reset Filters
                          </button>
                        </div>
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center gap-4">
                            <Users className="text-blue-600" size={24} />
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Total Scholars</h3>
                                <p className="text-2xl font-bold">{stats.totalScholars.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Total Citations</h3>
                            <p className="text-2xl font-bold">{stats.totalCitations.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Average h-index</h3>
                            <p className="text-2xl font-bold">{stats.averageHIndex}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow mb-8 overflow-x-auto">
                    <h2 className="text-lg font-semibold mb-4">Publication Performance</h2>
                      <div className="min-w-[800px]">
                          <BarChart width={800} height={300} data={stats.yearlyStats}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="name" />
                           <YAxis yAxisId="left" />
                           <YAxis yAxisId="right" orientation="right" />
                           <Tooltip />
                           <Legend />
                           <Bar yAxisId="left" dataKey="papers" fill="#3b82f6" name="Papers" />
                           <Bar yAxisId="right" dataKey="citations" fill="#10b981" name="Citations" />
                         </BarChart>
                      </div>
                </div>

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