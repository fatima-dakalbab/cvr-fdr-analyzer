import React, { useState } from 'react';
import MapCases from "./components/MapCases";
import {
  Eye, EyeOff, Bell, Search, Home, FileText, Radio, Activity,
  GitMerge, FileBarChart, HelpCircle, Plus, FolderOpen, Clock, Map, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';



const CVRFDRApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [currentView, setCurrentView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');

  const notifications = [
    { id: 1, title: 'Case AAI-UAE-2025-001 updated', desc: 'New report uploaded by Eng. Ahmed Al Mansoori', time: '2h ago' },
    { id: 2, title: 'Reminder', desc: 'Safety review meeting scheduled on 2025-08-30 at 10:00 AM.', time: '5h ago' },
    { id: 3, title: 'Alert', desc: 'CVR data for Case AAI-UAE-2025-013 is incomplete. Please re-upload', time: '1d ago' }
  ];

  const chartData = [
    { month: 'Jan', Accidents: 2, Incidents: 1 },
    { month: 'Feb', Accidents: 1, Incidents: 2 },
    { month: 'Mar', Accidents: 3, Incidents: 1 },
    { month: 'Apr', Accidents: 2, Incidents: 3 },
    { month: 'May', Accidents: 1, Incidents: 2 },
    { month: 'Jun', Accidents: 2, Incidents: 4 }
  ];

  const recentCases = [
    { date: '2025-02-11', org: 'GCAA', examiner: 'Eng. Ahmed', caseNum: 'AAI-UAE-2025-001', caseName: 'Dubai Creek Runway Excursion' },
    { date: '2025-03-06', org: 'GCAA', examiner: 'Dr. Hessa', caseNum: 'AAI-UAE-2025-004', caseName: 'Sharjah Desert UAV Incident' },
    { date: '2025-05-14', org: 'Etihad Airways', examiner: 'Capt. Khalid', caseNum: 'AAI-UAE-2025-009', caseName: 'Abu Dhabi Mid-Air Near Miss' }
  ];

  const mapLocations = [
    { city: 'Dubai', count: 1 },
    { city: 'Abu Dhabi', count: 2 },
    { city: 'Sharjah', count: 2 },
    { city: 'Al Ain', count: 3 }
  ];

  const handleLogin = () => {
    if (loginForm.username && loginForm.password) {
      setCurrentUser(loginForm.username);
      setIsAuthenticated(true);
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
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setLoginForm({ username: '', password: '' });
    setCurrentView('login');
    setShowUserMenu(false);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold" style={{ color: '#019348' }}>CVR/FDR Analyzer</h1>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search cases, analysis or help" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border py-2">
                      <div className="px-4 py-2 border-b font-semibold">Notifications</div>
                      {notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 hover:bg-gray-50 border-b cursor-pointer">
                          <div className="font-medium text-sm">{n.title}</div>
                          <div className="text-gray-600 text-xs mt-1">{n.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#019348' }}>
                      {currentUser.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium">{currentUser}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2">
                      <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Account setting</button>
                      <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">Logout</button>
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
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white rounded-lg font-medium" style={{ backgroundColor: '#019348' }}>
                <Home className="w-5 h-5" /><span>Home</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                <Activity className="w-5 h-5" /><span>FDR Module</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                <Radio className="w-5 h-5" /><span>CVR Module</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                <GitMerge className="w-5 h-5" /><span>Correlate FDR & CVR</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5" /><span>Cases</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                <FileBarChart className="w-5 h-5" /><span>Generate Reports</span>
              </a>
            </nav>
          </aside>

          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Welcome, {currentUser}!</h2>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <button className="text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#019348' }}>
                  <Plus className="w-10 h-10 mb-3" />
                  <h3 className="text-xl font-bold mb-2">Analyze a new case</h3>
                </button>
                <button className="text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#019348' }}>
                  <FolderOpen className="w-10 h-10 mb-3" />
                  <h3 className="text-xl font-bold mb-2">Open a previous case</h3>
                </button>
                <button className="text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#019348' }}>
                  <Clock className="w-10 h-10 mb-3" />
                  <h3 className="text-xl font-bold mb-2">Open Recent</h3>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">Number of Cases Per Month</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Accidents" fill="#ef4444" />
                      <Bar dataKey="Incidents" fill="#019348" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">Cases on Map</h3>
                  <div className="space-y-3">
                    {mapLocations.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <Map className="w-5 h-5" style={{ color: '#019348' }} />
                          <span className="font-medium">{loc.city}</span>
                        </div>
                        <span className="text-white text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#019348' }}>{loc.count}</span>
                      </div>
                    ))}
                  </div>
                </div> */}
                <MapCases />
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Recent Cases</h3>
                <table className="w-full">
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
                    {recentCases.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-3 text-sm">{c.date}</td>
                        <td className="px-4 py-3 text-sm">{c.org}</td>
                        <td className="px-4 py-3 text-sm">{c.examiner}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#019348' }}>{c.caseNum}</td>
                        <td className="px-4 py-3 text-sm">{c.caseName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="w-1/2 relative flex flex-col justify-center items-center overflow-hidden"
        style={{
          minHeight: '100vh',
          backgroundImage: "url('/bg-pattern.png')",
          backgroundSize: '180%', // makes pattern smaller (try 50–80%)
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* GCAA Logo (Centered or Bottom-Left depending on your preference) */}
        {/* <div className="absolute bottom-8 left-8 flex items-center space-x-3">
          <img src="/gcaa-logo.png" alt="GCAA Logo" className="h-28 object-contain" />
        </div> */}
        <img
          src="/gcaa-logo.png"
          alt="GCAA Logo"
          className="h-40 object-contain"
        />
      </div>

      <div className="w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {currentView === 'login' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#019348' }}>CVR/FDR Analyzer</h1>
                <p className="text-gray-600">Welcome back! Please login to your account.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2" placeholder="Enter your username" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2" placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#019348' }} />
                    <span className="ml-2 text-sm">Remember me</span>
                  </label>
                  <button onClick={() => setCurrentView('forgot')} className="text-sm hover:underline" style={{ color: '#019348' }}>Forgot Password</button>
                </div>

                <button onClick={handleLogin} className="w-full text-white py-3 rounded-lg font-semibold shadow-md" style={{ backgroundColor: '#019348' }}>Login</button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span>Don't have an account? </span>
                <button onClick={() => setCurrentView('signup')} className="font-semibold hover:underline" style={{ color: '#019348' }}>Sign up</button>
              </div>
            </div>
          )}

          {currentView === 'signup' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#019348' }}>CVR/FDR Analyzer</h1>
                <p className="text-gray-600">Please complete to create your account.</p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First name</label>
                    <input type="text" value={signupForm.firstName} onChange={(e) => setSignupForm({...signupForm, firstName: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last name</label>
                    <input type="text" value={signupForm.lastName} onChange={(e) => setSignupForm({...signupForm, lastName: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input type="text" value={signupForm.username} onChange={(e) => setSignupForm({...signupForm, username: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} value={signupForm.confirmPassword} onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-start">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 rounded mt-1" style={{ accentColor: '#019348' }} />
                  <span className="ml-2 text-sm">I agree with terms and conditions</span>
                </label>

                <button onClick={handleSignup} className="w-full text-white py-3 rounded-lg font-semibold shadow-md" style={{ backgroundColor: '#019348' }}>Sign up</button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span>Already have an account? </span>
                <button onClick={() => setCurrentView('login')} className="font-semibold hover:underline" style={{ color: '#019348' }}>Sign in</button>
              </div>
            </div>
          )}

          {currentView === 'forgot' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#019348' }}>CVR/FDR Analyzer</h1>
                <p className="text-gray-600">Enter your email and we send you a password reset link.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Enter your email" />
                </div>

                <button onClick={() => alert('Reset link sent!')} className="w-full text-white py-3 rounded-lg font-semibold shadow-md" style={{ backgroundColor: '#019348' }}>Send request</button>
              </div>

              <div className="mt-6 text-center text-sm">
                <button onClick={() => setCurrentView('login')} className="font-semibold hover:underline" style={{ color: '#019348' }}>Back to Login</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVRFDRApp;