'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scholar, GoogleScholarPub, PubmedPub } from '@/lib/types';

interface Publication {
    year: number;
    scholarName: string;
}

interface YearlyPublicationData {
    year: number;
    [scholarName: string]: number;
}

type Props = {
    scholars: Scholar[];
}

const CustomLegend = (props: any) => {
    const { payload } = props;
    
    return (
        <ul className="flex justify-center gap-8 pt-2">
            {payload.map((entry: any, index: number) => (
                <li key={`item-${index}`}>
                    <a 
                        href={`/scholars/${index === 0 ? 'ongVzPEAAAAJ' : 'D61rDpwAAAAJ'}`}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                    >
                        <span 
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-700 hover:text-gray-900">
                            {entry.value}
                        </span>
                    </a>
                </li>
            ))}
        </ul>
    );
};

const PublicationTrendsChart = ({ scholars }: Props) => {
    const [loadedScholars, setLoadedScholars] = useState<Scholar[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchScholarsData = async () => {
            if (!scholars.length) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                const scholarData = await Promise.all(
                    scholars.map(async (scholar) => {
                        const response = await fetch(`/api/scholars/${scholar.scholarId}`);
                        if (!response.ok) {
                            throw new Error(`Error fetching data for ${scholar.name}`);
                        }
                        return response.json();
                    })
                );

                console.log('Loaded scholars with publications:', scholarData);
                setLoadedScholars(scholarData);
            } catch (err) {
                console.error('Error fetching scholars:', err);
                setError('Failed to load publication data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchScholarsData();
    }, [scholars]);

    const publicationData = useMemo(() => {
        if (!loadedScholars.length) return [];

        const getGoogleScholarPubs = (scholar: Scholar): Publication[] => {
            const pubs = (scholar.googleScholarPubs || [])
                .filter(pub => pub.pubYear && pub.pubYear > 2000)
                .map(pub => ({
                    year: pub.pubYear!,
                    scholarName: scholar.name
                }));
            console.log(`Google Scholar pubs for ${scholar.name}:`, pubs);
            return pubs;
        };

        const getPubmedPubs = (scholar: Scholar): Publication[] => {
            const pubs = (scholar.pubmedPubs || [])
                .filter(pub => {
                    const yearType = pub.publicationType.find(type => /^\d{4}$/.test(type));
                    const year = yearType ? parseInt(yearType) : null;
                    return year && year > 2000;
                })
                .map(pub => {
                    const yearType = pub.publicationType.find(type => /^\d{4}$/.test(type))!;
                    return {
                        year: parseInt(yearType),
                        scholarName: scholar.name
                    };
                });
            console.log(`PubMed pubs for ${scholar.name}:`, pubs);
            return pubs;
        };

        const allPubs = loadedScholars.flatMap(scholar => {
            const googlePubs = getGoogleScholarPubs(scholar);
            const pubmedPubs = getPubmedPubs(scholar);
            return [...googlePubs, ...pubmedPubs];
        });

        console.log('Combined publications:', allPubs);

        if (!allPubs.length) {
            return Array.from({ length: 5 }, (_, i) => ({
                year: 2019 + i,
                ...Object.fromEntries(scholars.map(s => [s.name, 0]))
            }));
        }

        const yearSet = new Set(allPubs.map(pub => pub.year));
        const years = Array.from(yearSet).sort((a, b) => a - b);
        const scholarNames = Array.from(new Set(allPubs.map(pub => pub.scholarName)));

        return years.map(year => {
            const yearPubs = allPubs.filter(pub => pub.year === year);
            const countsByScholar = Object.fromEntries(
                scholarNames.map(name => [
                    name,
                    yearPubs.filter(pub => pub.scholarName === name).length
                ])
            );
            
            return {
                year,
                ...countsByScholar
            };
        });
    }, [loadedScholars, scholars]);

    if (!scholars.length) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Publication Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full flex items-center justify-center text-gray-500">
                        No scholars selected
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Publication Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full flex items-center justify-center text-gray-500">
                        Loading publication data...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Publication Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-96 w-full flex items-center justify-center text-red-500">
                        {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Publication Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={publicationData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="year" 
                                label={{ 
                                    value: 'Year', 
                                    position: 'bottom', 
                                    offset: 40
                                }}
                                tick={(props) => {
                                    const { x, y, payload } = props;
                                    return (
                                        <g transform={`translate(${x},${y + 20})`}>
                                            <text
                                                textAnchor="middle"
                                                fill="#666"
                                            >
                                                {payload.value}
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                            <YAxis 
                                label={{ 
                                    value: 'Number of Publications', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    offset: 10
                                }}
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    padding: '8px'
                                }}
                            />
                            <Legend 
                                content={<CustomLegend />}
                                verticalAlign="top" 
                                height={36}
                                wrapperStyle={{
                                    paddingTop: '10px'
                                }}
                            />
                            {scholars.map((scholar, index) => (
                                <Line
                                    key={scholar.name}
                                    type="monotone"
                                    dataKey={scholar.name}
                                    stroke={index === 0 ? "#4F46E5" : "#E11D48"}
                                    strokeWidth={2}
                                    dot={{ 
                                        fill: index === 0 ? "#4F46E5" : "#E11D48",
                                        r: 4
                                    }}
                                    activeDot={{
                                        r: 6,
                                        strokeWidth: 2
                                    }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default PublicationTrendsChart;