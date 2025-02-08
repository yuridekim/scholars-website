import React from 'react';
import { Scholar } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ScholarListProps {
    scholars: Scholar[];
}

const ScholarList: React.FC<ScholarListProps> = ({ scholars }) => {
    const router = useRouter();

    const handleScholarClick = (scholarId: string) => {
        router.push(`/scholars/${scholarId}`);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliation</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citations</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">h-index</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {scholars.map((scholar) => (
                        <tr
                            key={scholar.id}
                            onClick={() => handleScholarClick(scholar.scholarId)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{scholar.name}</div>
                                {scholar.emailDomain && (
                                    <div className="text-sm text-gray-500">{scholar.emailDomain}</div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">{scholar.affiliation || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{scholar.citedby || 0}</div>
                                {scholar.citedby5y && (
                                    <div className="text-xs text-gray-500">Last 5y: {scholar.citedby5y}</div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{scholar.hindex || 0}</div>
                                {scholar.hindex5y && (
                                    <div className="text-xs text-gray-500">Last 5y: {scholar.hindex5y}</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScholarList;