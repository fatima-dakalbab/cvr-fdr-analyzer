import React, { useState } from 'react';
import {Eye,
  EyeOff,
  Bell,
  Search,
  Home,
  FileText,
  Radio,
  Activity,
  GitMerge,
  FileBarChart,
  HelpCircle,
  ChevronDown,} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCasePage';
import Cases from './pages/Cases';

const CVRFDRApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [currentView, setCurrentView] = useState('login');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

const [loginForm, setLoginForm] = useState({ username: '', password: '' });
const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const notifications = [ {
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

  const handleLogin = () => {
    if (loginForm.username && loginForm.password) {
      setCurrentUser(loginForm.username);
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    } else {
      alert('Please enter username and password');
    }
  };

  const handleSignup = () => {
    if (signupForm.password !== signupForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (!agreeTerms) {
      alert('Please agree to terms and conditions');
      return;
    }

    if (signupForm.username && signupForm.email && signupForm.password) {
      setCurrentUser(signupForm.username);
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setLoginForm({ username: '', password: '' });
    setCurrentView('login');
    setShowUserMenu(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onStartNewCase={() => setCurrentPage('newcase')}
            onOpenCases={() => setCurrentPage('cases')}
          />
        );
      case 'newcase':
        return <NewCase onComplete={() => setCurrentPage('cases')} />;
      case 'cases':
        return <Cases onStartNewCase={() => setCurrentPage('newcase')} />;
      default:
        return null;
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8"></div>
              <h1 className="text-2xl font-bold" style={{ color: '#019348' }}>
                  CVR/FDR Analyzer
                </h1>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search cases, analysis or help"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600"
                >
                  <HelpCircle className="w-5 h-5" />
                  Help Center
                </button>
                <div className="relative">
                    <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"> 
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
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: '#019348' }}
                    >
                      {currentUser.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium">{currentUser}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2">
                      <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
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
        </header>

        <div className="flex">
          <aside className="w-64 bg-white border-r min-h-screen">
            <nav className="p-4 space-y-2">
                <button
                type="button"
                onClick={() => setCurrentPage('dashboard')}
                className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'text-white shadow'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={currentPage === 'dashboard' ? { backgroundColor: '#019348' } : {}}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Activity className="w-5 h-5" />
                <span>FDR Module</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Radio className="w-5 h-5" />
                <span>CVR Module</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <GitMerge className="w-5 h-5" />
                <span>Correlate FDR & CVR</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage('cases')}
                className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'cases'
                    ? 'text-white shadow'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={currentPage === 'cases' ? { backgroundColor: '#019348' } : {}}
              >
                <FileText className="w-5 h-5" />
                <span>Cases</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <FileBarChart className="w-5 h-5" />
                <span>Generate Reports</span>
              </button>
            </nav>
          </aside>

          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="w-1/2 relative flex flex-col justify-center items-center overflow-hidden"
        style={{
          minHeight: '100vh',
          backgroundImage: "url('/bg-pattern.png')",
          backgroundSize: '180%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
       <img src="/gcaa-logo.png" alt="GCAA Logo" className="h-40 object-contain" />
      </div>

      <div className="w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {currentView === 'login' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#019348' }}>
                  CVR/FDR Analyzer
                </h1>
                <p className="text-gray-600">Welcome back! Please login to your account.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                     <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#019348' }}
                    />
                    <span className="ml-2 text-sm">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentView('forgot')}
                    className="text-sm hover:underline"
                    style={{ color: '#019348' }}
                  >
                    Forgot Password
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full text-white py-3 rounded-lg font-semibold shadow-md"
                  style={{ backgroundColor: '#019348' }}
                >
                  Login
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setCurrentView('signup')}
                  className="font-semibold hover:underline"
                  style={{ color: '#019348' }}
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {currentView === 'signup' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#019348' }}>
                  CVR/FDR Analyzer
                </h1>
                <p className="text-gray-600">Please complete to create your account.</p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First name</label>
                    <input
                      type="text"
                      value={signupForm.firstName}
                      onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last name</label>
                    <input
                      type="text"
                      value={signupForm.lastName}
                      onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                   <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                     <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded mt-1"
                    style={{ accentColor: '#019348' }}
                  />
                  <span className="ml-2 text-sm">I agree with terms and conditions</span>
                </label>
                     <button
                  type="button"
                  onClick={handleSignup}
                  className="w-full text-white py-3 rounded-lg font-semibold shadow-md"
                  style={{ backgroundColor: '#019348' }}
                >
                  Sign up
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="font-semibold hover:underline"
                  style={{ color: '#019348' }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {currentView === 'forgot' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#019348' }}>
                  CVR/FDR Analyzer
                </h1>
                <p className="text-gray-600">
                  Enter your email and we send you a password reset link.
                </p>
                </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>

                   <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Enter your email"
                  />
                </div>

                 <button
                  type="button"
                  onClick={() => alert('Reset link sent!')}
                  className="w-full text-white py-3 rounded-lg font-semibold shadow-md"
                  style={{ backgroundColor: '#019348' }}
                >
                  Send request
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="font-semibold hover:underline"
                  style={{ color: '#019348' }}
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVRFDRApp;