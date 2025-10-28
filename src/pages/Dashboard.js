import React from 'react';
import { Plus, FolderOpen, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import MapCases from '../components/MapCases';

const chartData = [
  { month: 'Jan', accidents: 2, incidents: 1 },
  { month: 'Feb', accidents: 1, incidents: 2 },
  { month: 'Mar', accidents: 3, incidents: 1 },
  { month: 'Apr', accidents: 2, incidents: 3 },
  { month: 'May', accidents: 1, incidents: 2 },
  { month: 'Jun', accidents: 2, incidents: 4 },
];

const recentCases = [
  {
    date: '2025-02-11',
    organization: 'GCAA',
    examiner: 'Eng. Ahmed',
    caseNumber: 'AAI-UAE-2025-001',
    caseName: 'Dubai Creek Runway Excursion',
  },
  {
    date: '2025-03-06',
    organization: 'GCAA',
    examiner: 'Dr. Hessa',
    caseNumber: 'AAI-UAE-2025-004',
    caseName: 'Sharjah Desert UAV Incident',
  },
  {
    date: '2025-05-14',
    organization: 'Etihad Airways',
    examiner: 'Capt. Khalid',
    caseNumber: 'AAI-UAE-2025-009',
    caseName: 'Abu Dhabi Mid-Air Near Miss',
  },
];

const actionCards = [
  {
    title: 'Analyze a new case',
    icon: Plus,
    onClickKey: 'startNewCase',
  },
  {
    title: 'Open a previous case',
    icon: FolderOpen,
    onClickKey: 'openCases',
  },
  {
    title: 'Open recent',
    icon: Clock,
    onClickKey: 'openCases',
  },
];

const Dashboard = ({ currentUser = '', onStartNewCase = () => {}, onOpenCases = () => {} }) => {
  const handleAction = (key) => {
    if (key === 'startNewCase') {
      onStartNewCase();
    }

    if (key === 'openCases') {
      onOpenCases();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        {currentUser ? `Welcome back, ${currentUser}!` : 'Welcome back!'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {actionCards.map(({ title, icon: Icon, onClickKey }) => (
          <button
            key={title}
            type="button"
            onClick={() => handleAction(onClickKey)}
            className="text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-start space-y-3"
            style={{ backgroundColor: '#019348' }}
          >
            <Icon className="w-10 h-10" />
            <h3 className="text-xl font-bold">{title}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Number of cases per month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accidents" fill="#ef4444" name="Accidents" />
              <Bar dataKey="incidents" fill="#019348" name="Incidents" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <MapCases />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Recent cases</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Examiner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Case Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Case Name</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.map((caseItem, index) => (
                <tr key={caseItem.caseNumber} className="hover:bg-gray-50 border-b">
                  <td className="px-4 py-3 text-sm">{caseItem.date}</td>
                  <td className="px-4 py-3 text-sm">{caseItem.organization}</td>
                  <td className="px-4 py-3 text-sm">{caseItem.examiner}</td>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: '#019348' }}
                  >
                    {caseItem.caseNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">{caseItem.caseName}</td>
                </tr>
              ))}
              {recentCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No recent cases to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;