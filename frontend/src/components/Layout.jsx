import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from './ThemeToggle';

function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/config', label: 'Config Editor', icon: '✏️' },
    { path: '/saved-configs', label: 'Presets', icon: '📋' },
    { path: '/active-drivers', label: 'Active Drivers', icon: '🏎️' },
    { path: '/monitoring', label: 'Monitoring', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 dark:bg-black text-white flex flex-col border-r border-gray-800 dark:border-gray-900">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AC Server Manager</h1>
            <p className="text-gray-400 text-sm mt-1">v0.1.0</p>
          </div>
        </div>
        
        {/* Theme Toggle at top of sidebar */}
        <div className="px-6 pb-4 border-b border-gray-800 dark:border-gray-900">
          <ThemeToggle />
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
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
