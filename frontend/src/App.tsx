import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import HeatmapPage from './components/HeatmapPage';

// Lazy load heavy components
const ComparePage = lazy(() => import('./components/ComparePage'));
const GainersLosers = lazy(() => import('./components/GainersLosers'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: '🏠 Dashboard', mobileLabel: 'Dashboard' },
    { path: '/compare', label: '🔀 Compare', mobileLabel: 'Compare' },
    { path: '/heatmap', label: '🔥 Heatmap', mobileLabel: 'Heatmap' },
    { path: '/gainers-losers', label: '📊 Gainers & Losers', mobileLabel: 'G&L' },
    { path: '/settings', label: '⚙️ Settings', mobileLabel: 'Settings' }
  ];

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 border-b-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-md">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
          📊 <span className="hidden sm:inline">Stock Dashboard</span><span className="sm:hidden">Dashboard</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-2">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 xl:px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm xl:text-base ${
                isActive(path)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navLinks.map(({ path, label, mobileLabel }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sm text-center ${
                  isActive(path)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="sm:hidden">{mobileLabel}</div>
                <div className="hidden sm:block">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function AppLayout() {
  const location = useLocation();
  const showSidebar = location.pathname === '/';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <div className="flex flex-1 overflow-hidden relative">
        {showSidebar && (
          <>
            {/* Mobile Sidebar Toggle Button */}
            <button
              className="lg:hidden fixed top-20 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div className={`
              lg:relative lg:translate-x-0 lg:block
              fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          </>
        )}
        
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
            <Route path="/gainers-losers" element={<GainersLosers />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
