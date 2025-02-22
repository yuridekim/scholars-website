import React, { useState, useMemo, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface TopicInfo {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  general_class14: number;
  topic_popularity: number;
  w1: number;
  w2: number;
}

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
  scholarId: string;
  scholarName: string;
}

interface ptViz {
  id: string;
  name: string;
  class: number;
  w1: number;
  w2: number;
}

interface VisualizationProps {
  topicData: TopicInfo[];
  paperData?: PaperTopic[];
  viewMode?: 'cluster' | 'grid';
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

const DualVisualization: React.FC<VisualizationProps> = ({ topicData, paperData = [], viewMode = 'cluster' }) => {
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);
  const [ptVizData, setPtVizData] = useState<ptViz[] | undefined>(undefined);
  const [paperVizData, setPaperVizData] = useState<PaperTopic[] | undefined>(undefined);
  const [scholarError, setScholarError] = useState<string | null>(null);
  const [paperError, setPaperError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPtVizData() {
      try {
        const response = await fetch('/api/ptviz');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPtVizData(data);
        setScholarError(null);
      } catch (error) {
        console.error('Error fetching ptViz data:', error);
        setScholarError('Failed to load scholar data. Please try again later.');
      }
    }

    async function fetchPaperVizData() {
      try {
        const response = await fetch('/api/paperviz');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPaperVizData(data);
        setPaperError(null);
      } catch (error) {
        console.error('Error fetching papers visualization data:', error);
        setPaperError('Failed to load paper data. Please try again later.');
      }
    }

    fetchPtVizData();
    fetchPaperVizData();
  }, []);

  const uniqueClasses = useMemo(() =>
    Array.from(new Set(topicData.map(item => item.general_class14))).sort((a, b) => a - b),
    [topicData]
  );

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
          <p className="font-semibold">Class {item.general_class14 || item.class || item.generalClass14}</p>
          <p className="text-sm text-gray-600">
            Type: {item.topic_name ? 'Topic' : item.title ? 'Paper' : 'Scholar'}
          </p>
          {item.topic_name && (
            <>
              <p className="text-sm text-gray-600">Topic: {item.topic_name}</p>
              <p className="text-sm text-gray-600">Popularity: {item.topic_popularity.toFixed(2)}</p>
            </>
          )}
          {item.title && (
            <>
              <p className="text-sm text-gray-600 max-w-md truncate">Title: {item.title}</p>
              {item.journal && <p className="text-sm text-gray-600">Journal: {item.journal}</p>}
              {item.numCitations !== undefined && (
                <p className="text-sm text-gray-600">Citations: {item.numCitations}</p>
              )}
            </>
          )}
          {item.name && (
            <p className="text-sm text-gray-600">Scholar: {item.name}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CombinedScatterPlot = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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

        {ptVizData && (
          <Scatter
            name="Scholars"
            data={ptVizData}
            fill="none"
            stroke="#808080"
            strokeWidth={2}
            opacity={hoveredClass ? 0.3 : 1}
            shape={(props: any) => {
              const centerX = props.cx;
              const centerY = props.cy;
              const size = 8;
              const pathData = `M ${centerX} ${centerY - size / 2 * Math.sqrt(3) / 2} L ${centerX - size / 2} ${centerY + size / 2 * Math.sqrt(3) / 2} L ${centerX + size / 2} ${centerY + size / 2 * Math.sqrt(3) / 2} Z`;
              return (
                <path
                  d={pathData}
                  style={{
                    fill: "none",
                    stroke: "#808080",
                    strokeWidth: 2
                  }}
                />
              );
            }}
            onClick={(event) => {
              const dataPoint = ptVizData?.find(item => item.w1 === event.w1 && item.w2 === event.w2);
              if (dataPoint?.id) {
                router.push(`/scholars/${dataPoint.id}`);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
        )}

        {uniqueClasses.map((classNum) => (
          <Scatter
            key={`topic-${classNum}`}
            name={`Topics Class ${classNum}`}
            data={topicData.filter(item => item.general_class14 === classNum)}
            fill={CLASS_COLORS[classNum]}
            opacity={hoveredClass ? (hoveredClass === classNum ? 1 : 0.3) : 0.8}
            shape="circle"
            onMouseEnter={() => setHoveredClass(classNum)}
            onMouseLeave={() => setHoveredClass(null)}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );

  const PaperScatterPlot = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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

        {paperVizData && uniqueClasses.map((classNum) => (
          <Scatter
            key={`paper-${classNum}`}
            name={`Papers Class ${classNum}`}
            data={paperVizData.filter(item => item.generalClass14 === classNum)}
            fill={CLASS_COLORS[classNum]}
            opacity={hoveredClass ? (hoveredClass === classNum ? 1 : 0.3) : 0.8}
            shape="circle"
            onMouseEnter={() => setHoveredClass(classNum)}
            onMouseLeave={() => setHoveredClass(null)}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Combined Scholar and Topic Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[700px] w-full">
            {scholarError ? (
              <p className="text-center text-red-500">{scholarError}</p>
            ) : !ptVizData ? (
              <p className="text-center text-gray-500">Loading scholar data...</p>
            ) : (
              <CombinedScatterPlot />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Distribution of Papers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {paperError ? (
              <p className="text-center text-red-500">{paperError}</p>
            ) : !paperVizData ? (
              <p className="text-center text-gray-500">Loading paper data...</p>
            ) : (
              <PaperScatterPlot />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DualVisualization;