// components/group/FilterSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Scholar } from '@/lib/types';
import ComparativeImpactPlot from './Dashboard';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

type FilterType = 'name' | 'affiliation' | 'emailDomain' | 'interests';
export type Filter = {
    id: string;
    type: FilterType;
    value: string;
};


interface FilterSectionProps {
  scholars: Scholar[];
  onFiltersChange: (filters: Filter[]) => void;
  filteredScholars?: Scholar[];
}

const FilterSection: React.FC<FilterSectionProps> = ({ scholars, onFiltersChange, filteredScholars }) => {
    const [filters, setFilters] = useState<Filter[]>([]);
    const [currentFilterType, setCurrentFilterType] = useState<FilterType>('name');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [affiliationCounts, setAffiliationCounts] = useState<{ [key: string]: number }>({});

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const filterOptions: { value: FilterType; label: string }[] = [
        { value: 'name', label: 'Name' },
        { value: 'affiliation', label: 'Affiliation' },
        { value: 'emailDomain', label: 'Email Domain' },
        { value: 'interests', label: 'Interests' }
    ];

    useEffect(() => {
        const counts: { [key: string]: number } = {};
        scholars.forEach(scholar => {
            if (scholar.affiliation) {
                counts[scholar.affiliation] = (counts[scholar.affiliation] || 0) + 1;
            }
        });
        setAffiliationCounts(counts);
    }, [scholars]);

    useEffect(() => {
        if (!currentFilterValue.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const value = currentFilterValue.toLowerCase();
        const uniqueValues = new Set<string>();

        scholars.forEach(scholar => {
            let fieldValue = '';
            switch (currentFilterType) {
                case 'name':
                    fieldValue = scholar.name || '';
                    break;
                case 'affiliation':
                    fieldValue = scholar.affiliation || '';
                    break;
                case 'emailDomain':
                    fieldValue = scholar.emailDomain || '';
                    break;
                case 'interests':
                    fieldValue = scholar.interests || '';
                    break;
            }

            if (currentFilterType === 'interests' && fieldValue) {
                fieldValue.split(',').forEach(interest => {
                    const trimmedInterest = interest.trim();
                    if (trimmedInterest.toLowerCase().includes(value)) {
                        uniqueValues.add(trimmedInterest);
                    }
                });
            } else if (fieldValue.toLowerCase().includes(value)) {
                uniqueValues.add(fieldValue);
            }
        });

        const suggestionList = Array.from(uniqueValues).slice(0, 10);
        setSuggestions(suggestionList);
        setShowSuggestions(suggestionList.length > 0);
    }, [currentFilterType, currentFilterValue, scholars]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addFilter = (value?: string) => {
        const filterValue = value || currentFilterValue;
        if (filterValue.trim()) {
            const newFilter: Filter = {
                id: Math.random().toString(36).substr(2, 9),
                type: currentFilterType,
                value: filterValue.trim()
            };
            const updatedFilters = [...filters, newFilter];
            setFilters(updatedFilters);
            onFiltersChange(updatedFilters);
            setCurrentFilterValue('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const removeFilter = (filterId: string) => {
        const updatedFilters = filters.filter(f => f.id !== filterId);
        setFilters(updatedFilters);
        onFiltersChange(updatedFilters);
    };

    const chartData = {
        labels: Object.keys(affiliationCounts),
        datasets: [{
            label: 'Number of Scholars',
            data: Object.values(affiliationCounts),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
        }]
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {filters.map(filter => (
                    <div
                        key={filter.id}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                        <span className="font-medium">
                            {filterOptions.find(f => f.value === filter.type)?.label}:
                        </span>
                        <span>{filter.value}</span>
                        <button
                            onClick={() => removeFilter(filter.id)}
                            className="hover:text-blue-900"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 relative">
                <Select
                    value={currentFilterType}
                    onValueChange={(value: FilterType) => {
                        setCurrentFilterType(value);
                        setCurrentFilterValue('');
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }}
                >
                    <SelectTrigger className="w-40 bg-white">
                        <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        {filterOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={`Filter by ${filterOptions.find(f => f.value === currentFilterType)?.label.toLowerCase()}...`}
                        value={currentFilterValue}
                        onChange={(e) => {
                            setCurrentFilterValue(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addFilter();
                            }
                        }}
                        className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            ref={suggestionRef}
                            className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto"
                        >
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() => addFilter(suggestion)}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => addFilter()}
                    disabled={!currentFilterValue.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add Filter
                </button>
            </div>

            <div className="mt-6">
            <ComparativeImpactPlot scholars={filteredScholars || scholars}/>
            </div>
        </div>
    );
};

export default FilterSection;