'use client'
import React, { useState, useCallback, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Filter, Users, User, BookOpen, Bookmark, Info } from 'lucide-react';
import FilterSection from '@/components/group/FilterSection';
import PublicationTrendsChart from "@/components/visualizations/PublicationTrend";
import { Scholar } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { useFoundryAuth } from '@/hooks/useFoundryAuth';


type FilterType = 'name' | 'affiliation' | 'emailDomain' | 'interests';
type Filter = {
    type: FilterType;
    value: string;
};

type ScholarMatch = {
    group1Name: string;
    group2Name: string;
    matchPercentage?: number;
    matchMessage: string;
    isGroup1Group: boolean;
    isGroup2Group: boolean;
    filters: Filter[];
};

export default function ComparativeAnalysisPage() {
    const auth = useFoundryAuth();
    const [scholars, setScholars] = useState<Scholar[]>([]);
    const [loading, setLoading] = useState(true);
    const [group1Filters, setGroup1Filters] = useState<Filter[]>([]);
    const [group2Filters, setGroup2Filters] = useState<Filter[]>([]);
    const [filteredGroup1Scholars, setFilteredGroup1Scholars] = useState<Scholar[]>([]);
    const [filteredGroup2Scholars, setFilteredGroup2Scholars] = useState<Scholar[]>([]);
    const [group1Metrics, setGroup1Metrics] = useState({
        citations: 0,
        citations5y: 0,
        hIndex: 0,
        hIndex5y: 0,
        i10Index: 0,
        totalPub: 0,
    });
    const [group2Metrics, setGroup2Metrics] = useState({
        citations: 0,
        citations5y: 0,
        hIndex: 0,
        hIndex5y: 0,
        i10Index: 0,
        totalPub: 0,
    });
    const [filtersApplied, setFiltersApplied] = useState(false);
    
    const [possibleMatches, setPossibleMatches] = useState<ScholarMatch[]>([]);
    const [selectedMatchIndex, setSelectedMatchIndex] = useState<number>(0);
    const [matchesProcessed, setMatchesProcessed] = useState(false);

    useEffect(() => {
        const fetchScholars = async () => {
            try {
                if (!auth?.accessToken) {
                    console.log('No access token available, waiting for auth...');
                    return;
                }

                console.log('Fetching scholars with token:', auth.accessToken.substring(0, 10) + '...');

                const response = await fetch('/api/scholars', {
                    headers: {
                        'Authorization': `Bearer ${auth.accessToken}`
                    }
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { error: errorText };
                    }
                    throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                console.log('Successfully fetched scholars:', data.length);
                setScholars(data);
            } catch (error) {
                console.error('Error fetching scholars:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchScholars();
    }, [auth?.accessToken]);

    const getFilteredScholars = useCallback((filters: Filter[], allScholars: Scholar[]): Scholar[] => {
        console.log('getFilteredScholars executing with:', { filters, allScholars });
        const results = allScholars.filter(scholar => {
            return filters.every(filter => {
                const value = filter.value.toLowerCase();
                const matches = (() => {
                    switch (filter.type) {
                        case 'name':
                            return scholar.name?.toLowerCase().includes(value);
                        case 'affiliation':
                            return scholar.affiliation?.toLowerCase().includes(value);
                        case 'emailDomain':
                            return scholar.emailDomain?.toLowerCase().includes(value);
                        case 'interests':
                            return scholar.interests?.toLowerCase().includes(value);
                        default:
                            return true;
                    }
                })();
                console.log(`Filter ${filter.type}:${value} on ${scholar.name} = ${matches}`);
                return matches;
            });
        });
        console.log('getFilteredScholars returning:', results);
        return results;
    }, []);

    useEffect(() => {
        console.log('Filter effect triggered:', {
            group1Filters,
            scholars
        });

        if (group1Filters.length > 0) {
            const filteredScholars = getFilteredScholars(group1Filters, scholars);
            console.log('Setting filtered group 1 scholars:', filteredScholars);
            setFilteredGroup1Scholars(filteredScholars);
            
            setMatchesProcessed(false);
        } else {
            console.log('No filters, setting empty array');
            setFilteredGroup1Scholars([]);
            setPossibleMatches([]);
        }
    }, [group1Filters, getFilteredScholars, scholars]);

    useEffect(() => {
        console.log('Current state:', {
            group1Filters,
            filteredGroup1Scholars,
            group2Filters,
            filteredGroup2Scholars,
            matchesProcessed
        });
    }, [group1Filters, filteredGroup1Scholars, group2Filters, filteredGroup2Scholars, matchesProcessed]);

    const handleFilterChange = (groupId: string, newFilters: Filter[]) => {
        console.log('handleFilterChange:', { groupId, newFilters });
        if (groupId === 'group1') {
            setGroup1Filters(newFilters);
        } else {
            setGroup2Filters(newFilters);
        }
    };

    const handleApplyFilters = () => {
        console.log('handleApplyFilters triggered');
        const group1Scholars = getFilteredScholars(group1Filters, scholars);
        const group2Scholars = getFilteredScholars(group2Filters, scholars);

        console.log('Apply results:', {
            group1Scholars,
            group2Scholars
        });

        setFilteredGroup1Scholars(group1Scholars);
        setFilteredGroup2Scholars(group2Scholars);

        setGroup1Metrics(getAverageMetrics(group1Scholars));
        setGroup2Metrics(getAverageMetrics(group2Scholars));
        setFiltersApplied(true);
    };

    const getAverageMetrics = (scholars: Scholar[]) => {
        console.log('getAverageMetrics executing with:', scholars);
        const total = scholars.length || 1;
        return {
            citations: scholars.reduce((sum, s) => sum + (s.citedby || 0), 0) / total,
            citations5y: scholars.reduce((sum, s) => sum + (s.citedby5y || 0), 0) / total,
            hIndex: scholars.reduce((sum, s) => sum + (s.hindex || 0), 0) / total,
            hIndex5y: scholars.reduce((sum, s) => sum + (s.hindex5y || 0), 0) / total,
            i10Index: scholars.reduce((sum, s) => sum + (s.i10index || 0), 0) / total,
            totalPub: scholars.reduce((sum, s) => sum + (s.totalPub || 0), 0) / total,
        }
    };

    const renderMetricComparison = (
        metric: string,
        value1: number,
        value2: number
    ) => {
        const difference = value2 - value1;
        const percentDiff = ((difference / value1) * 100).toFixed(1);
        const isPositive = difference > 0;

        return (
            <Card key={metric}>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center gap-4">
                        <div className="text-2xl font-bold">{value1.toFixed(1)}</div>
                        <ArrowRight className="text-gray-400" />
                        <div className="text-2xl font-bold">{value2.toFixed(1)}</div>
                    </div>
                    <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{percentDiff}% difference
                    </div>
                </CardContent>
            </Card>
        );
    };

    const comparisonList = [
        {
            trigger: {
                group: 'group1',
                type: 'name',
                value: 'philip chow'
            },
            action: {
                group: 'group2',
                filters: [
                    {
                        type: 'name' as FilterType,
                        value: 'Stephanie M Carpenter'
                    }
                ],
                matchPercentage: 95.84,
                matchMessage: "is a 95.84% match with"
            }
        },
        {
            trigger: {
                group: 'group1',
                type: 'name',
                value: 'philip chow'
            },
            action: {
                group: 'group2',
                filters: [
                    {
                        type: 'name' as FilterType,
                        value: 'Jasmine Mote'
                    }
                ],
                matchPercentage: 26.24,
                matchMessage: "is a 26.24% match with"
            }
        },
        {
            trigger: {
                group: 'group1',
                type: 'name',
                value: 'Natalie (Nat) Benda'
            },
            action: {
                group: 'group2',
                filters: [
                    {
                        type: 'name' as FilterType,
                        value: 'Mustafa Ozkaynak'
                    }
                ],
                matchPercentage: 95.84,
                matchMessage: "is a 99.3% match with"
            }
        },
        {
            trigger: {
                group: 'group1',
                type: 'name',
                value: 'Maia Jacobs'
            },
            action: {
                group: 'group2',
                filters: [
                    {
                        type: 'name' as FilterType,
                        value: 'James Clawson'
                    }
                ],
                matchPercentage: 95.84,
                matchMessage: "is a 96.83% match with"
            }
        },
    ];

    const selectMatch = (index: number) => {
        if (index >= 0 && index < possibleMatches.length) {
            setSelectedMatchIndex(index);
            
            const match = possibleMatches[index];
            setGroup2Filters(match.filters);
            
            const group1Scholars = getFilteredScholars(group1Filters, scholars);
            const group2Scholars = getFilteredScholars(match.filters, scholars);
            
            setFilteredGroup1Scholars(group1Scholars);
            setFilteredGroup2Scholars(group2Scholars);
            
            setGroup1Metrics(getAverageMetrics(group1Scholars));
            setGroup2Metrics(getAverageMetrics(group2Scholars));
            setFiltersApplied(true);
        }
    };

    useEffect(() => {
        if (group1Filters.length > 0 && !matchesProcessed && filteredGroup1Scholars.length > 0) {
            console.log('Finding matches for filters');
            
            const matches: ScholarMatch[] = [];
            
            for (const preset of comparisonList) {
                const matchingFilter = group1Filters.find(
                    filter => filter.type === preset.trigger.type && 
                    filter.value.toLowerCase().includes(preset.trigger.value.toLowerCase())
                );

                if (matchingFilter) {
                    console.log(`Found matching preset for ${matchingFilter.value}`);
                    
                    const isGroup1Group = filteredGroup1Scholars.length > 1 || 
                        group1Filters.some(f => f.type === 'affiliation' || f.type === 'emailDomain');
                    const isGroup2Group = preset.action.filters.length > 1 || 
                        preset.action.filters.some(f => f.type === 'affiliation' || f.type === 'emailDomain');
                    
                    const getDisplayName = (filters: Filter[]) => {
                        if (filters.length === 1) {
                            return filters[0].value;
                        }
                        
                        const byType: Record<string, string[]> = {};
                        filters.forEach(f => {
                            if (!byType[f.type]) byType[f.type] = [];
                            byType[f.type].push(f.value);
                        });
                        
                        const parts: string[] = [];
                        if (byType['affiliation']) {
                            parts.push(`${byType['affiliation'].join(', ')} affiliates`);
                        }
                        if (byType['name']) {
                            parts.push(byType['name'].join(', '));
                        }
                        if (byType['interests']) {
                            parts.push(`${byType['interests'].join(', ')} researchers`);
                        }
                        if (byType['emailDomain']) {
                            parts.push(`${byType['emailDomain'].join(', ')} members`);
                        }
                        
                        return parts.join(' and ');
                    };
                    
                    const group1Name = group1Filters.length === 1 && 
                        group1Filters[0].type === matchingFilter.type && 
                        group1Filters[0].value === matchingFilter.value
                            ? matchingFilter.value
                            : getDisplayName(group1Filters);
                    const group2Name = getDisplayName(preset.action.filters);
                    
                    matches.push({
                        group1Name,
                        group2Name, 
                        matchPercentage: preset.action.matchPercentage,
                        matchMessage: preset.action.matchMessage || "compared with",
                        isGroup1Group,
                        isGroup2Group,
                        filters: preset.action.filters
                    });
                }
            }
            
            if (matches.length > 0) {
                setPossibleMatches(matches);
                setSelectedMatchIndex(0);
                
                const firstMatch = matches[0];
                setGroup2Filters(firstMatch.filters);
                
                const group2Scholars = getFilteredScholars(firstMatch.filters, scholars);
                setFilteredGroup2Scholars(group2Scholars);
                
                setGroup1Metrics(getAverageMetrics(filteredGroup1Scholars));
                setGroup2Metrics(getAverageMetrics(group2Scholars));
                setFiltersApplied(true);
            } else {
                setPossibleMatches([]);
            }
            
            setMatchesProcessed(true);
        }
    }, [
        group1Filters, 
        getFilteredScholars, 
        scholars, 
        filteredGroup1Scholars, 
        matchesProcessed
    ]);

    if (!auth || loading) {
        return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="text-xl">
                {!auth ? 'Authenticating...' : 'Loading scholars...'}
            </div>
        </div>;
    }

    // Extract scholar names from filters for display
    const getScholarNameFromFilters = (filters: Filter[]): string | null => {
        const nameFilter = filters.find(f => f.type === 'name');
        return nameFilter ? nameFilter.value : null;
    };

    const group1ScholarName = getScholarNameFromFilters(group1Filters);
    const group2ScholarName = getScholarNameFromFilters(group2Filters);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Comparative Scholar Analysis</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Group 1</h2>
                            {group1Filters.length > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                                    <Filter size={14} />
                                    {group1Filters.length} filter{group1Filters.length !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                        <FilterSection
                            scholars={scholars}
                            filteredScholars={filteredGroup1Scholars}
                            onFiltersChange={(newFilters) => handleFilterChange('group1', newFilters)}
                        />
                        {group1ScholarName && filtersApplied && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center gap-2">
                                <CheckCircle size={16} className="text-blue-600" />
                                <span className="font-medium">Filter applied: {group1ScholarName}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Group 2</h2>
                            {group2Filters.length > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                                    <Filter size={14} />
                                    {group2Filters.length} filter{group2Filters.length !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                        <FilterSection
                            scholars={scholars}
                            filteredScholars={filteredGroup2Scholars}
                            onFiltersChange={(newFilters) => handleFilterChange('group2', newFilters)}
                        />
                        {group2ScholarName && filtersApplied && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center gap-2">
                                <CheckCircle size={16} className="text-blue-600" />
                                <span className="font-medium">Filter applied: {group2ScholarName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {possibleMatches.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-blue-700 text-center font-medium mb-3">
                            {possibleMatches[selectedMatchIndex].isGroup1Group ? 'Scholars from ' : ''}
                            <span className="font-semibold">{possibleMatches[selectedMatchIndex].group1Name}</span>
                            {possibleMatches[selectedMatchIndex].isGroup1Group ? '' : ' '} 
                            {possibleMatches[selectedMatchIndex].matchMessage}
                            {possibleMatches[selectedMatchIndex].isGroup2Group ? ' scholars from ' : ' '}
                            <span className="font-semibold">{possibleMatches[selectedMatchIndex].group2Name}</span>
                        </div>
                        
                        {possibleMatches.length > 1 && (
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                <div className="text-sm text-blue-800 mr-2 font-medium">Other matches:</div>
                                {possibleMatches.map((match, index) => (
                                    index !== selectedMatchIndex && (
                                        <Button 
                                            key={index}
                                            variant="outline" 
                                            size="sm"
                                            className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                                            onClick={() => selectMatch(index)}
                                        >
                                            {match.group2Name} ({match.matchPercentage}%)
                                        </Button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-center">
                    <Button
                        onClick={handleApplyFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        Apply Filters
                    </Button>
                </div>

                {filtersApplied && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            {Object.entries(group1Metrics).map(([metric, value1]) => {
                                const value2 = group2Metrics[metric as keyof typeof group2Metrics];
                                return renderMetricComparison(metric, value1, value2);
                            })}
                        </div>

                        {/* Publication Trends Graph */}
                        <PublicationTrendsChart 
                        scholars={[...filteredGroup1Scholars, ...filteredGroup2Scholars]} 
                        group1ScholarCount={filteredGroup1Scholars.length} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[
                                { scholars: filteredGroup1Scholars, title: 'Group 1', scholarName: group1ScholarName },
                                { scholars: filteredGroup2Scholars, title: 'Group 2', scholarName: group2ScholarName }
                            ].map(({ scholars, title, scholarName }) => (
                                <Card key={title}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {scholars.length > 1 ? (
                                                    <Users size={18} className="text-blue-600" />
                                                ) : (
                                                    <User size={18} className="text-blue-600" />
                                                )}
                                                <CardTitle>{title} {scholars.length > 1 ? 'Scholars' : 'Scholar'} ({scholars.length})</CardTitle>
                                            </div>
                                            {scholarName && (
                                                <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                                                    {scholarName.includes('Stanford') || scholarName.includes('MIT') ? (
                                                        <BookOpen size={12} />
                                                    ) : (
                                                        <Bookmark size={12} />
                                                    )}
                                                    {scholarName}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-96 overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Affiliation</TableHead>
                                                        <TableHead>Citations</TableHead>
                                                        <TableHead>h-index</TableHead>
                                                        <TableHead>i10-index</TableHead>
                                                        <TableHead>Total Publications</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {scholars.map((scholar) => (
                                                        <TableRow key={scholar.id}>
                                                            <TableCell className="font-medium">
                                                                {scholar.name}
                                                                {scholar.emailDomain && (
                                                                    <div className="text-sm text-gray-500">{scholar.emailDomain}</div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{scholar.affiliation || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                {scholar.citedby || 0}
                                                                {scholar.citedby5y && (
                                                                    <div className="text-xs text-gray-500">Last 5y: {scholar.citedby5y}</div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {scholar.hindex || 0}
                                                                {scholar.hindex5y && (
                                                                    <div className="text-xs text-gray-500">Last 5y: {scholar.hindex5y}</div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{scholar.i10index || 0}</TableCell>
                                                            <TableCell>{scholar.totalPub || 0}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}