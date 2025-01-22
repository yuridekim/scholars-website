import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Scholar } from '@/lib/types';

type DataPoint = {
  year: number;
  successTotal: number;
  successLabel1: number;
  failedTotal: number;
  failedLabel1: number;
};

const PublicationSuccessChart = ({ scholar }: { scholar: Scholar }) => {
  // Placeholder data that matches the example graph pattern
  const placeholderData: DataPoint[] = [
    { year: 2010, successTotal: 1, successLabel1: 0.3, failedTotal: 1.2, failedLabel1: 0.2 },
    { year: 2011, successTotal: 1.7, successLabel1: 0.2, failedTotal: 1.8, failedLabel1: 0.4 },
    { year: 2012, successTotal: 3, successLabel1: 0.8, failedTotal: 2.3, failedLabel1: 0.6 },
    { year: 2013, successTotal: 4.2, successLabel1: 1.5, failedTotal: 2.5, failedLabel1: 0.8 },
    { year: 2014, successTotal: 5.2, successLabel1: 2, failedTotal: 3.8, failedLabel1: 1.1 },
    { year: 2015, successTotal: 5, successLabel1: 2, failedTotal: 4, failedLabel1: 1.3 },
    { year: 2016, successTotal: 5.1, successLabel1: 2.1, failedTotal: 5, failedLabel1: 1.7 },
    { year: 2017, successTotal: 6.8, successLabel1: 3.2, failedTotal: 5.7, failedLabel1: 1.8 },
    { year: 2018, successTotal: 6.5, successLabel1: 2.8, failedTotal: 6.3, failedLabel1: 1.8 },
    { year: 2019, successTotal: 5.7, successLabel1: 2.5, failedTotal: 7.2, failedLabel1: 2.5 },
    { year: 2020, successTotal: 6.8, successLabel1: 3, failedTotal: 7.5, failedLabel1: 2.8 },
    { year: 2021, successTotal: 8.2, successLabel1: 3.8, failedTotal: 7.3, failedLabel1: 2.7 },
    { year: 2022, successTotal: 7.2, successLabel1: 3.2, failedTotal: 7.7, failedLabel1: 3 },
    { year: 2023, successTotal: 7.3, successLabel1: 2.8, failedTotal: 7.5, failedLabel1: 2.8 }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Publication Success Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={placeholderData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                type="number" 
                domain={['dataMin', 'dataMax']}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine x={2018} stroke="#ff0000" strokeDasharray="3 3" />
              
              {/* Success group lines */}
              <Line
                type="monotone"
                dataKey="successTotal"
                name="All Publications (Success)"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="successLabel1"
                name="Predicted Label 1 Publications (Success)"
                stroke="#4F46E5"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              
              {/* Failed group lines */}
              <Line
                type="monotone"
                dataKey="failedTotal"
                name="All Publications (Failed)"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="failedLabel1"
                name="Predicted Label 1 Publications (Failed)"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center mt-4 text-gray-500 text-sm">
          Publication success/failure analysis will be available when classification data is ready
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicationSuccessChart;