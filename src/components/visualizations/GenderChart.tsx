'use client'
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Scholar } from '@/lib/types';

type GenderDistribution = {
  gender: string;
  count: number;
  percentage: number;
};

const GenderDistributionChart = ({ scholar }: { scholar: Scholar }) => {
  // will be replaced with actual data in the future
  const placeholderData: GenderDistribution[] = [
    { gender: 'Female', count: 0, percentage: 0 },
    { gender: 'Male', count: 0, percentage: 0 },
    { gender: 'Non-Binary', count: 0, percentage: 0 },
    { gender: 'Other', count: 0, percentage: 0 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gender Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={placeholderData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gender" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [value, 'Count'];
                  return [`${value}%`, 'Percentage'];
                }}
              />
              <Bar dataKey="count" fill="#4F46E5" />
              <Bar dataKey="percentage" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center mt-4 text-gray-500 text-sm">
          Gender distribution data will be available in the future
        </div>
      </CardContent>
    </Card>
  );
};

export default GenderDistributionChart;