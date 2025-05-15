'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManualScholarEntry, ScholarStats, ScholarList, AddScholar, ScholarFilters } from '@/components/scholars';
import { useScholars } from '@/hooks/useScholars';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import AuthComponent from '@/components/auth/AuthComponent';
import { Download, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ScholarsPage() {
    const router = useRouter();
    const auth = useFoundryAuth();
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
        refreshScholars
    } = useScholars();

    const [searchLoading, setSearchLoading] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualEntry, setManualEntry] = useState({
        name: '',
        affiliation: '',
        emailDomain: '',
        citedby: 0,
        hindex: 0
    });

    const [filterShowState, setFilterShowState] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshTooltip, setRefreshTooltip] = useState(false);

    const isSessionInvalid = !auth.accessToken || (auth.expiresAt && Date.now() >= auth.expiresAt);

    const handleRefresh = async () => {
        if (isSessionInvalid) return;
        
        setIsRefreshing(true);
        await refreshScholars();
        
        setTimeout(() => {
            setIsRefreshing(false);
            
            setRefreshTooltip(true);
            setTimeout(() => setRefreshTooltip(false), 3000);
        }, 1000);
    };

    const handleExport = () => {
        if (isSessionInvalid || filteredScholars.length === 0) return;
        
        const csvContent = [
            ['Name', 'Affiliation', 'Citations', 'H-Index', 'Email Domain'].join(','),
            ...filteredScholars.map(scholar => [
                `"${scholar.name || ''}"`,
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

    const handleManualSubmit = async (manualEntry: any) => {
        if (isSessionInvalid) {
            return;
        }
        
        setSearchLoading(true);

        try {
            const response = await fetch('/api/scholars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.accessToken}`
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

            await response.json();
            
            handleRefresh();
            
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
                    {!isSessionInvalid && (
                        <div className="flex gap-4 items-center">
                            <div className="relative">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                    title="Refresh scholar data"
                                >
                                    <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </button>
                                
                                {refreshTooltip && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                                        Data refreshed successfully
                                    </div>
                                )}
                            </div>
                            
                            {filteredScholars.length > 0 && (
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Download size={20} />
                                    Export Data ({filteredScholars.length} scholars)
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {isSessionInvalid && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                        <div className="flex items-center">
                            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                            <p className="font-medium text-yellow-700">
                                {auth.expiresAt && Date.now() >= auth.expiresAt 
                                    ? "Session expired. Please login again to access scholar data." 
                                    : "Authentication required. Please login to connect with Palantir."}
                            </p>
                        </div>
                    </div>
                )}

                <AddScholar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showManualEntry={showManualEntry}
                    setShowManualEntry={setShowManualEntry}
                    onScholarAdded={handleRefresh}
                />

                <AuthComponent>
                    <>
                        <ScholarFilters
                            filters={filters}
                            setFilters={setFilters}
                            uniqueAffiliations={uniqueAffiliations}
                            uniqueEmailDomains={uniqueEmailDomains}
                            showFilters={filterShowState}
                            setShowFilters={setFilterShowState}
                        />

                        <ScholarStats stats={stats} />

                        <ManualScholarEntry
                            showManualEntry={showManualEntry}
                            setShowManualEntry={setShowManualEntry}
                            searchLoading={searchLoading}
                            handleManualSubmit={handleManualSubmit}
                            error={error}
                            manualEntry={manualEntry}
                            setManualEntry={setManualEntry}
                        />

                        <ScholarList scholars={filteredScholars} />
                    </>
                </AuthComponent>
            </div>
        </div>
    );
}