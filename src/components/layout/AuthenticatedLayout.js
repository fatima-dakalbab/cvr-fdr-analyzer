import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AudioLines,
  Bell,
  ChevronDown,
  FileBarChart,
  FileText,
  HelpCircle,
  Home,
  PlaneTakeoff,
  Search,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const notifications = [
  {
    id: 1,
    title: 'Case AAI-UAE-2025-001 updated',
    desc: 'New report uploaded by Eng. Ahmed Al Mansoori',
    time: '2h ago',
  },
  {
    id: 2,
    title: 'Reminder',
    desc: 'Safety review meeting scheduled on 2025-08-30 at 10:00 AM.',
    time: '5h ago',
  },
  {
    id: 3,
    title: 'Alert',
    desc: 'CVR data for Case AAI-UAE-2025-013 is incomplete. Please re-upload',
    time: '1d ago',
  },
];

const navigationLinks = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/cases', icon: FileText, label: 'Cases' },
  { to: '/cases/fdr', icon: PlaneTakeoff, label: 'FDR Module' },
  { to: '/cases/cvr', icon: AudioLines, label: 'CVR Module' },
  { to: '/cases/correlate', icon: Workflow, label: 'Correlate FDR & CVR' },
  { to: '/reports', icon: FileBarChart, label: 'Generate Reports' },
];

const AuthenticatedLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initials = (user?.firstName || user?.email || '?').charAt(0).toUpperCase();
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAccountSettings = () => {
    navigate('/account');
    setShowUserMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 shrink-0 focus:outline-none bg-transparent border-0 p-0"
            >
              <img src="/toplogo.png" alt="CVR/FDR Analyzer logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold" style={{ color: '#019348' }}>
                CVR/FDR Analyzer
              </h1>
            </button>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search cases, analysis or help"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <button
                type="button"
                onClick={() => navigate('/help')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600"
              >
                <HelpCircle className="w-5 h-5" /> Help Center
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border py-2">
                    <div className="px-4 py-2 border-b font-semibold">Notifications</div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 border-b cursor-pointer"
                      >
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-gray-600 text-xs mt-1">{notification.desc}</div>
                        <div className="text-gray-400 text-xs mt-1">{notification.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: '#019348' }}
                  >
                    {initials}
                  </div>
                  <span className="text-gray-700 font-medium truncate max-w-[140px]">{displayName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2">
                    <button
                      type="button"
                      onClick={handleAccountSettings}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      Account settings
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4 space-y-2">
            {navigationLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex w-full items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive ? 'text-white shadow' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
                style={({ isActive }) => (isActive ? { backgroundColor: '#019348' } : undefined)}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
