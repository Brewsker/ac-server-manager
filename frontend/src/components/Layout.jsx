import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import api from '../api/client';

function Layout({ children }) {
  const location = useLocation();
  const [appVersion, setAppVersion] = useState('...');

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      path: '/config',
      label: 'Config Editor',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    fetchAppVersion();
  }, []);

  const fetchAppVersion = async () => {
    try {
      const data = await api.getAppVersion();
      setAppVersion(data.version);
    } catch (error) {
      console.error('Failed to fetch version:', error);
      setAppVersion('0.16.0'); // Fallback
    }
  };

  return (
    <div
      className={`min-h-screen flex ${
        location.pathname === '/dashboard' ? 'bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'
      }`}
    >
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 dark:bg-black text-white flex flex-col border-r border-gray-800 dark:border-gray-900">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AC Server Manager</h1>
            <p className="text-gray-400 text-sm mt-1">v{appVersion}</p>
          </div>
        </div>

        <nav className="mt-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Quick tip at bottom */}
        <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-500">
          <p>Manage presets in Dashboard → AC Server Manager → Presets</p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 ${
          location.pathname === '/dashboard'
            ? 'overflow-hidden bg-gray-900'
            : 'overflow-y-auto bg-white dark:bg-gray-950'
        }`}
      >
        {location.pathname === '/dashboard' ? (
          // Dashboard gets full edge-to-edge layout with no overflow
          children
        ) : (
          // Other pages get full-width layout
          <div className="px-4 py-4">{children}</div>
        )}
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
