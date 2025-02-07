import React from 'react';
import { Filter, X } from 'lucide-react';
import { FilterState } from '@/lib/types';

interface ScholarFiltersProps {
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    uniqueAffiliations: string[];
    uniqueEmailDomains: string[];
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
}

const ScholarFilters: React.FC<ScholarFiltersProps> = ({
    filters,
    setFilters,
    uniqueAffiliations,
    uniqueEmailDomains,
    showFilters,
    setShowFilters
}) => {

    const resetFilters = () => {
        setFilters({
            affiliation: '',
            emailDomain: '',
            citationRange: '',
            hIndexRange: '',
        });
        setShowFilters(false);
    };

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters({
            ...filters,
            [key]: value
        });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-8">
            <div className="flex gap-4 mb-4">
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
                                onChange={(e) => handleFilterChange('affiliation', e.target.value)}
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
                                onChange={(e) => handleFilterChange('emailDomain', e.target.value)}
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
                                onChange={(e) => handleFilterChange('citationRange', e.target.value)}
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
                                onChange={(e) => handleFilterChange('hIndexRange', e.target.value)}
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
    );
};

export default ScholarFilters;