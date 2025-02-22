import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PaperTopic {
  id: number;
  paperId: string;
  title: string;
  pubYear?: number;
  abstract?: string;
  journal?: string;
  publisher?: string;
  numCitations?: number;
  generalClass14?: number;
  vector2dComponent1: number;
  vector2dComponent2: number;
}

interface PaperVisualizationProps {
  data: PaperTopic[];
  viewMode?: 'cluster' | 'grid';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PaperTopic;
  }>;
}

const CLASS_COLORS: Record<number, string> = {
  1: '#1f77b4',
  2: '#ff7f0e',
  3: '#2ca02c',
  4: '#d62728',
  5: '#9467bd',
  6: '#8c564b',
  7: '#e377c2',
  8: '#7f7f7f',
  9: '#bcbd22',
  10: '#17becf',
  11: '#aec7e8',
  12: '#ffbb78',
  13: '#98df8a',
  14: '#ff9896'
};

const PaperVisualization: React.FC<PaperVisualizationProps> = ({ data, viewMode = 'cluster' }) => {
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);

  // Get unique class numbers
  const uniqueClasses = useMemo(() => 
    Array.from(new Set(data.map(item => item.generalClass14)))
      .filter((classNum): classNum is number => classNum !== undefined)
      .sort((a, b) => a - b),
    [data]
  );

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const paper = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
          <p className="font-semibold">Class {paper.generalClass14}</p>
          <p className="text-sm text-gray-600 max-w-md truncate">{paper.title}</p>
          {paper.journal && <p className="text-sm text-gray-600">Journal: {paper.journal}</p>}
          {paper.numCitations !== undefined && (
            <p className="text-sm text-gray-600">Citations: {paper.numCitations}</p>
          )}
          {paper.pubYear && <p className="text-sm text-gray-600">Year: {paper.pubYear}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Distribution of Research Papers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="vector2dComponent1" 
                name="Component 1"
                domain={viewMode === 'cluster' ? ['auto', 'auto'] : [0, 8]}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="vector2dComponent2" 
                name="Component 2"
                domain={viewMode === 'cluster' ? ['auto', 'auto'] : [0, 8]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {uniqueClasses.map((classNum) => (
                <Scatter
                  key={classNum}
                  name={`Class ${classNum}`}
                  data={data.filter(item => item.generalClass14 === classNum)}
                  fill={CLASS_COLORS[classNum]}
                  opacity={hoveredClass ? (hoveredClass === classNum ? 1 : 0.3) : 1}
                  onMouseEnter={() => setHoveredClass(classNum)}
                  onMouseLeave={() => setHoveredClass(null)}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaperVisualization;