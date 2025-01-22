'use client'

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Scholar } from '@/lib/types';

type TimelineDataPoint = {
  year: number;
  publications: number;
  total: number;
};

const PublicationTimeline = ({ scholar }: { scholar: Scholar }) => {
  const timelineData = useMemo(() => {
    if (!scholar.googleScholarPubs) return [];

    const yearCounts = new Map<number, number>();
    scholar.googleScholarPubs.forEach(pub => {
      if (pub.pubYear) {
        yearCounts.set(pub.pubYear, (yearCounts.get(pub.pubYear) || 0) + 1);
      }
    });

    const sortedYears = Array.from(yearCounts.keys()).sort();
    if (sortedYears.length === 0) return [];

    const data: TimelineDataPoint[] = [];
    const startYear = sortedYears[0];
    const endYear = sortedYears[sortedYears.length - 1];
    
    for (let year = startYear; year <= endYear; year++) {
      data.push({
        year,
        publications: yearCounts.get(year) || 0,
        total: 0
      });
    }

    let runningTotal = 0;
    data.forEach(item => {
      runningTotal += item.publications;
      item.total = runningTotal;
    });

    return data;
  }, [scholar.googleScholarPubs]);

  if (!timelineData.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Publication Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-gray-500">
            No publication data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Publication Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                tickFormatter={(value: number) => value.toString()}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value,
                  name === 'publications' ? 'Publications this year' : 'Total publications'
                ]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="publications"
                stroke="#4F46E5"
                strokeWidth={2}
                name="Publications"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total"
                stroke="#059669"
                strokeWidth={2}
                name="Cumulative"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicationTimeline;