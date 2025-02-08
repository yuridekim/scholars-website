import React from 'react';
import { Users } from 'lucide-react';
import { DashboardStats } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


interface ScholarStatsProps {
    stats: DashboardStats;
}

const ScholarStats: React.FC<ScholarStatsProps> = ({ stats }) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-4">
                        <Users className="text-blue-600" size={24} />
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Total Scholars</h3>
                            <p className="text-2xl font-bold">{stats.totalScholars.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Citations</h3>
                        <p className="text-2xl font-bold">{stats.totalCitations.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Average h-index</h3>
                        <p className="text-2xl font-bold">{stats.averageHIndex}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8 overflow-x-auto">
                <h2 className="text-lg font-semibold mb-4">Publication Performance</h2>
                <div className="min-w-[800px]">
                    <BarChart width={800} height={300} data={stats.yearlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="papers" fill="#3b82f6" name="Papers" />
                        <Bar yAxisId="right" dataKey="citations" fill="#10b981" name="Citations" />
                    </BarChart>
                </div>
            </div>
        </>
    );
};

export default ScholarStats;