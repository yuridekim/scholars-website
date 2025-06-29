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
import { Scholar } from '@/lib/types';

// Commented out for future use
// import { fetchScholarByIdFromPalantir } from '@/components/palantir/palantirScholars';
// import { useFoundryAuth } from '@/hooks/useFoundryAuth';

interface Publication {
    year: number;
    scholarName: string;
    group: 'group1' | 'group2';
}

type Props = {
    scholars: Scholar[];
    group1ScholarCount?: number;
}

const PublicationTrendsChart = ({ scholars, group1ScholarCount: propGroup1Count }: Props) => {
    const [group1ScholarCount, setGroup1ScholarCount] = useState<number>(0);
    
    const GROUP_COLORS = {
        group1: "#4F46E5",
        group2: "#E11D48"
    };

    useEffect(() => {
        const grp1Count = propGroup1Count !== undefined ? propGroup1Count : Math.floor(scholars.length * 0.75);
        setGroup1ScholarCount(grp1Count);
    }, [scholars, propGroup1Count]);

    const publicationData = useMemo(() => {
        console.log('Processing publication data for scholars:', scholars);
        
        if (!scholars.length) {
            console.log('No scholars, returning empty data');
            return [];
        }

        // For demo purposes, create hardcoded publications
        const getHardcodedPublicationData = () => {
            const hardcodedData: { [key: string]: { [year: number]: number } } = {
                'philip chow': {
                    2018: 2,
                    2019: 3,
                    2020: 1,
                    2021: 4,
                    2022: 5,
                    2023: 3,
                    2024: 2
                },
                'Philip Chow': {
                    2018: 2,
                    2019: 3,
                    2020: 1,
                    2021: 4,
                    2022: 5,
                    2023: 3,
                    2024: 2
                },
                'Stephanie M Carpenter': {
                    2018: 1,
                    2019: 2,
                    2020: 3,
                    2021: 2,
                    2022: 4,
                    2023: 6,
                    2024: 3
                },
                'Natalie (Nat) Benda': {
                    2018: 3,
                    2019: 2,
                    2020: 4,
                    2021: 3,
                    2022: 2,
                    2023: 5,
                    2024: 4
                },
                'Jasmine Mote': {
                    2018: 1,
                    2019: 3,
                    2020: 2,
                    2021: 4,
                    2022: 3,
                    2023: 2,
                    2024: 3
                },
                'Maia Jacobs': {
                    2018: 4,
                    2019: 3,
                    2020: 2,
                    2021: 5,
                    2022: 4,
                    2023: 3,
                    2024: 2
                },
                'James Clawson': {
                    2018: 2,
                    2019: 4,
                    2020: 3,
                    2021: 2,
                    2022: 5,
                    2023: 4,
                    2024: 3
                },
                'Mustafa Ozkaynak': {
                    2018: 3,
                    2019: 2,
                    2020: 4,
                    2021: 6,
                    2022: 3,
                    2023: 4,
                    2024: 2
                }
            };

            const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
            
            return years.map(year => {
                const yearData: any = { year };
                
                scholars.forEach(scholar => {
                    if (hardcodedData[scholar.name]) {
                        yearData[scholar.name] = hardcodedData[scholar.name][year] || 0;
                    } else if (hardcodedData[scholar.name.toLowerCase()]) {
                        yearData[scholar.name] = hardcodedData[scholar.name.toLowerCase()][year] || 0;
                    } else {
                        yearData[scholar.name] = 0;
                    }
                });
                
                return yearData;
            });
        };

        const chartData = getHardcodedPublicationData();
        console.log('Demo publication data:', chartData);
        return chartData;

        /* 
        
        const getGoogleScholarPubs = (scholar: Scholar, index: number): Publication[] => {
            // Try multiple possible field names for Google Scholar publications
            const googlePubs = scholar.googleScholarPubs || scholar.publications || scholar.papers || [];
            
            const pubs = googlePubs
                .filter(pub => {
                    // Check multiple possible year field names
                    const year = pub.pubYear || pub.year || pub.publicationYear || pub.date;
                    return year && year > 2000;
                })
                .map(pub => {
                    const year = pub.pubYear || pub.year || pub.publicationYear || pub.date;
                    return {
                        year: typeof year === 'string' ? parseInt(year) : year,
                        scholarName: scholar.name,
                        group: (index < group1ScholarCount ? 'group1' : 'group2') as 'group1' | 'group2'
                    };
                });
            return pubs;
        };

        const getPubmedPubs = (scholar: Scholar, index: number): Publication[] => {
            // Try multiple possible field names for PubMed publications
            const pubmedPubs = scholar.pubmedPubs || scholar.pubmed || scholar.medlinePubs || [];
            
            const pubs = pubmedPubs
                .filter(pub => {
                    // Try different ways to extract year
                    let year = null;
                    
                    // Method 1: Look in publicationType array for year
                    if (pub.publicationType) {
                        const yearType = pub.publicationType.find(type => /^\d{4}$/.test(type));
                        if (yearType) year = parseInt(yearType);
                    }
                    
                    // Method 2: Direct year fields
                    if (!year) {
                        year = pub.year || pub.pubYear || pub.publicationYear || pub.date;
                        if (typeof year === 'string') year = parseInt(year);
                    }
                    
                    // Method 3: Parse from date string
                    if (!year && pub.pubDate) {
                        const match = pub.pubDate.match(/(\d{4})/);
                        if (match) year = parseInt(match[1]);
                    }
                    
                    return year && year > 2000;
                })
                .map(pub => {
                    // Extract year using same logic as filter
                    let year = null;
                    
                    if (pub.publicationType) {
                        const yearType = pub.publicationType.find(type => /^\d{4}$/.test(type));
                        if (yearType) year = parseInt(yearType);
                    }
                    
                    if (!year) {
                        year = pub.year || pub.pubYear || pub.publicationYear || pub.date;
                        if (typeof year === 'string') year = parseInt(year);
                    }
                    
                    if (!year && pub.pubDate) {
                        const match = pub.pubDate.match(/(\d{4})/);
                        if (match) year = parseInt(match[1]);
                    }
                    
                    return {
                        year: year!,
                        scholarName: scholar.name,
                        group: (index < group1ScholarCount ? 'group1' : 'group2') as 'group1' | 'group2'
                    };
                });
            return pubs;
        };

        // Get all publications from all scholars
        const allPubs = scholars.flatMap((scholar, index) => {
            const googlePubs = getGoogleScholarPubs(scholar, index);
            const pubmedPubs = getPubmedPubs(scholar, index);
            return [...googlePubs, ...pubmedPubs];
        });

        if (!allPubs.length) {
            // Fallback for when no publication data is available
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 5;
            
            return Array.from({ length: 6 }, (_, i) => {
                const year = startYear + i;
                const yearData: any = { year };
                scholars.forEach(scholar => {
                    yearData[scholar.name] = 0;
                });
                return yearData;
            });
        }

        // Create chart data from actual publications
        const yearSet = new Set(allPubs.map(pub => pub.year));
        const years = Array.from(yearSet).sort((a, b) => a - b);
        const scholarNames = scholars.map(s => s.name);

        return years.map(year => {
            const yearPubs = allPubs.filter(pub => pub.year === year);
            const yearData: any = { year };
            
            scholarNames.forEach(scholarName => {
                const scholarPubsThisYear = yearPubs.filter(pub => pub.scholarName === scholarName);
                yearData[scholarName] = scholarPubsThisYear.length;
            });
            
            return yearData;
        });
        */
    }, [scholars, group1ScholarCount]);

    const getScholarColor = (scholar: Scholar, index: number): string => {
        return index < group1ScholarCount ? GROUP_COLORS.group1 : GROUP_COLORS.group2;
    };

    const CustomLegend = (props: any) => {
        const { payload } = props;
        
        return (
            <ul className="flex justify-center gap-8 pt-2">
                {payload.map((entry: any, index: number) => (
                    <li key={`item-${index}`}>
                        <a 
                            href={scholars[index]?.scholarId ? `/scholars/${scholars[index].scholarId}` : '#'}
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

    const getLegendPayload = () => {
        return scholars.map((scholar, index) => ({
            value: scholar.name,
            color: getScholarColor(scholar, index),
            scholarId: scholar.scholarId
        }));
    };

    // Since we're using hardcoded data for demo, no auth/loading needed
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
                                payload={getLegendPayload()}
                            />
                            {scholars.map((scholar, index) => (
                                <Line
                                    key={scholar.name}
                                    type="monotone"
                                    dataKey={scholar.name}
                                    stroke={getScholarColor(scholar, index)}
                                    strokeWidth={2}
                                    dot={{ 
                                        fill: getScholarColor(scholar, index),
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