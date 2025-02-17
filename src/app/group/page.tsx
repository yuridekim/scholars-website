// app/page.tsx
'use client'
import React, { useState, useCallback } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowRight } from 'lucide-react';
import { useScholars } from '@/hooks/useScholars';
import FilterSection from '@/components/group/FilterSection';
import { Scholar } from '@/lib/types';
import { Button } from "@/components/ui/button";

type FilterType = 'name' | 'affiliation' | 'emailDomain' | 'interests';
type Filter = {
    id: string;
    type: FilterType;
    value: string;
};

export default function ComparativeAnalysisPage() {
    const { scholars, loading, error } = useScholars();
    const [group1Filters, setGroup1Filters] = useState<Filter[]>([]);
    const [group2Filters, setGroup2Filters] = useState<Filter[]>([]);
    const [filteredGroup1Scholars, setFilteredGroup1Scholars] = useState<Scholar[]>([]);
    const [filteredGroup2Scholars, setFilteredGroup2Scholars] = useState<Scholar[]>([]);

    const getFilteredScholars = useCallback((filters: Filter[], allScholars: Scholar[]): Scholar[] => {
        return allScholars.filter(scholar => {
            return filters.every(filter => {
                const value = filter.value.toLowerCase();
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
            });
        });
    }, []);

    const getAverageMetrics = (scholars: Scholar[]) => {
        const total = scholars.length || 1;
        return {
            citations: scholars.reduce((sum, s) => sum + (s.citedby || 0), 0) / total,
            citations5y: scholars.reduce((sum, s) => sum + (s.citedby5y || 0), 0) / total,
            hIndex: scholars.reduce((sum, s) => sum + (s.hindex || 0), 0) / total,
            hIndex5y: scholars.reduce((sum, s) => sum + (s.hindex5y || 0), 0) / total,
            i10Index: scholars.reduce((sum, s) => sum + (s.i10index || 0), 0) / total,
            totalPub: scholars.reduce((sum, s) => sum + (s.totalPub || 0), 0) / total,
        }
    }

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


    const handleFilterChange = (groupId: string, newFilters: Filter[]) => {
        if (groupId === 'group1') {
            setGroup1Filters(newFilters);
        } else {
            setGroup2Filters(newFilters);
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
    }

    const handleApplyFilters = () => {
        const group1Scholars = getFilteredScholars(group1Filters, scholars);
        const group2Scholars = getFilteredScholars(group2Filters, scholars);

        setFilteredGroup1Scholars(group1Scholars);
        setFilteredGroup2Scholars(group2Scholars);

        setGroup1Metrics(getAverageMetrics(group1Scholars));
        setGroup2Metrics(getAverageMetrics(group2Scholars));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center justify-center mt-20">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Comparative Scholar Analysis</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Group 1</h2>
                        <FilterSection
                            scholars={scholars}
                            filteredScholars={filteredGroup1Scholars}
                            onFiltersChange={(newFilters) => handleFilterChange('group1', newFilters)}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Group 2</h2>
                        <FilterSection
                            scholars={scholars}
                            filteredScholars={filteredGroup2Scholars}
                            onFiltersChange={(newFilters) => handleFilterChange('group2', newFilters)}
                        />
                    </div>
                </div>
                <div className="flex justify-center">
                    <Button 
                        onClick={handleApplyFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        Apply Filters
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {Object.entries(group1Metrics).map(([metric, value1]) => {
                        const value2 = group2Metrics[metric as keyof typeof group2Metrics];
                        return renderMetricComparison(metric, value1, value2);
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[
                        { scholars: filteredGroup1Scholars, title: 'Group 1' },
                        { scholars: filteredGroup2Scholars, title: 'Group 2' }
                    ].map(({ scholars, title }) => (
                        <Card key={title}>
                            <CardHeader>
                                <CardTitle>{title} Scholars ({scholars.length})</CardTitle>
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
            </div>
        </div>
    );
}