import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TopicInfo {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  general_class14: number;
  topic_popularity: number;
  w1: number;
  w2: number;
}

interface TopicVisualizationProps {
  data: TopicInfo[];
  viewMode?: 'cluster' | 'grid';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TopicInfo;
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

const TopicVisualization: React.FC<TopicVisualizationProps> = ({ data, viewMode = 'cluster' }) => {
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);

  // Get unique class numbers
  const uniqueClasses = useMemo(() => 
    Array.from(new Set(data.map(item => item.general_class14))).sort((a, b) => a - b),
    [data]
  );

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const topic = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
          <p className="font-semibold">Class {topic.general_class14}</p>
          <p className="text-sm text-gray-600">Topic: {topic.topic_name}</p>
          <p className="text-sm text-gray-600">Popularity: {topic.topic_popularity.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Topic Distribution by Class</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="w1" 
                name="w1"
                domain={viewMode === 'cluster' ? ['auto', 'auto'] : [0, 8]}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="w2" 
                name="w2"
                domain={viewMode === 'cluster' ? ['auto', 'auto'] : [0, 8]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {uniqueClasses.map((classNum) => (
                <Scatter
                  key={classNum}
                  name={`Class ${classNum}`}
                  data={data.filter(item => item.general_class14 === classNum)}
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

export default TopicVisualization;