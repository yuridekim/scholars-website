import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Scholar } from '@/lib/types';

interface ImpactPlotProps {
  scholars: Scholar[];
}

const ComparativeImpactPlot = ({ scholars }: ImpactPlotProps) => {
  const data = scholars
    .filter(s => s.hindex && s.citedby && s.totalPub)
    .map(s => ({
      name: s.name,
      hIndex: s.hindex || 0,
      citations: s.citedby || 0,
      publications: s.totalPub || 0,
    }));

  return (
    <Card className="w-full">
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <XAxis 
                type="number" 
                dataKey="citations" 
                name="Citations"
                label={{ value: 'Total Citations', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="hIndex" 
                name="h-index"
                label={{ value: 'h-index', angle: -90, position: 'left' }}
              />
              <ZAxis 
                type="number" 
                dataKey="publications" 
                range={[50, 400]} 
                name="Publications"
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p className="font-medium">{data.name}</p>
                        <p>Citations: {data.citations.toLocaleString()}</p>
                        <p>h-index: {data.hIndex}</p>
                        <p>Publications: {data.publications}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Scholars" 
                data={data} 
                fill="#8884d8"
                opacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparativeImpactPlot;