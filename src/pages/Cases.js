import React, { useMemo, useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    Eye,
    Pencil,
    Trash2,
} from 'lucide-react';

const cases = [
    {
        caseNumber: 'AAI-UAE-2025-001',
        caseName: 'Dubai Creek Runway Excursion',
        module: 'CVR & FDR',
        lastUpdated: '2025-06-03',
        status: 'Complete',
        owner: 'Eng. Ahmed Al Mansoori',
    },
    {
        caseNumber: 'AAI-UAE-2025-004',
        caseName: 'Sharjah Desert UAV Incident',
        module: 'FDR',
        lastUpdated: '2025-05-28',
        status: 'In Progress',
        owner: 'Dr. Hessa Al Suwaidi',
    },
    {
        caseNumber: 'AAI-UAE-2025-009',
        caseName: 'Abu Dhabi Mid-Air Near Miss',
        module: 'CVR',
        lastUpdated: '2025-05-16',
        status: 'Pending Review',
        owner: 'Capt. Khalid Al Hameli',
    },
    {
        caseNumber: 'AAI-UAE-2025-013',
        caseName: 'Al Ain Night Landing Deviation',
        module: 'CVR & FDR',
        lastUpdated: '2025-05-09',
        status: 'Data Required',
        owner: 'Salem Al Marri',
    },
    {
        caseNumber: 'AAI-UAE-2025-017',
        caseName: 'Ras Al Khaimah Rotorcraft Incident',
        module: 'FDR',
        lastUpdated: '2025-04-28',
        status: 'Complete',
        owner: 'Mariam Al Zarouni',
    },
];

const statusStyles = {
    Complete: 'bg-emerald-100 text-emerald-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Pending Review': 'bg-sky-100 text-sky-700',
    'Data Required': 'bg-rose-100 text-rose-700',
};

const Cases = ({ onStartNewCase, onOpenFDR, onOpenCVR, onOpenCorrelate }) => {
    const [selectedCaseNumber, setSelectedCaseNumber] = useState(null);

    const selectedCase = useMemo(
        () => cases.find((caseItem) => caseItem.caseNumber === selectedCaseNumber) || null,
        [selectedCaseNumber],
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Cases</h2>
                    <p className="text-gray-600">Search, manage, and monitor all recorded investigations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        type="button"
                        onClick={onStartNewCase}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow-md"
                        style={{ backgroundColor: '#019348' }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Case
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search cases, analysts, or help"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Select</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Case Title</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Case Number</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Module</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Updated</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Owner</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map((caseItem) => {
                                const isSelected = selectedCaseNumber === caseItem.caseNumber;

                                return (
                                    <tr
                                        key={caseItem.caseNumber}
                                        className={`border-b transition-colors ${isSelected ? 'bg-emerald-50/60 border-emerald-200' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-4 py-4">
                                            <label className="flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="selectedCase"
                                                    value={caseItem.caseNumber}
                                                    checked={isSelected}
                                                    onChange={() => setSelectedCaseNumber(caseItem.caseNumber)}
                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                                />
                                            </label>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{caseItem.caseName}</td>
                                        <td className="px-4 py-4 text-sm text-emerald-600 font-semibold">{caseItem.caseNumber}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{caseItem.module}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{caseItem.lastUpdated}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[caseItem.status] || 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {caseItem.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{caseItem.owner}</td>
                                        <td className="px-4 py-4 text-sm text-right">
                                            <div className="flex items-center justify-end gap-2 text-gray-500">
                                                <button type="button" className="p-2 hover:text-emerald-600" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button type="button" className="p-2 hover:text-emerald-600" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button type="button" className="p-2 hover:text-rose-600" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {selectedCase && (
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
                        <div>
                            <p className="text-sm text-emerald-700">Selected</p>
                            <p className="text-lg font-semibold text-emerald-900">{selectedCase.caseName}</p>
                            <p className="text-sm text-emerald-700/80">{selectedCase.caseNumber}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <button
                                type="button"
                                onClick={onOpenFDR}
                                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10"
                            >
                                FDR Analysis
                            </button>
                            <button
                                type="button"
                                onClick={onOpenCVR}
                                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10"
                            >
                                CVR Analysis
                            </button>
                            <button
                                type="button"
                                onClick={onOpenCorrelate}
                                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10"
                            >
                                Correlate
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
                    <p>
                        Showing {cases.length} of {cases.length} cases
                    </p>
                    <div className="flex items-center gap-2">
                        <button type="button" className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Prev
                        </button>
                        <button type="button" className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                            1
                        </button>
                        <button type="button" className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                            2
                        </button>
                        <button type="button" className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                            3
                        </button>
                        <button type="button" className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cases;