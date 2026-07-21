import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'Members', path: '/members', icon: '👥' },
    { label: 'Transactions', path: '/transactions', icon: '💳' },
    { label: 'Export Data', path: '/export', icon: '📥' },
  ];

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav
        className="bg-dark text-white p-3"
        style={{
          width: sidebarOpen ? '250px' : '80px',
          transition: 'width 0.3s',
          overflow: 'hidden',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          {sidebarOpen && <h5 className="mb-0">Loyalty Card</h5>}
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        </div>

        <nav className="nav flex-column">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="nav-link text-white text-start mb-2 py-2 px-3 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span className="ms-2">{item.label}</span>}
            </button>
          ))}
        </nav>

        <hr className="bg-secondary" />

        <div className="mt-auto">
          {sidebarOpen && (
            <div className="mb-3">
              <small className="text-muted">Logged in as:</small>
              <p className="mb-0 small text-truncate">
                <strong>{user?.username}</strong>
              </p>
              <small className="text-muted">{user?.branch}</small>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm w-100"
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 border-bottom">
          <h2 className="mb-1">Loyalty Card Management System</h2>
          <p className="text-muted mb-0">Welcome back, {user?.username}! 👋</p>
        </header>

        {/* Content */}
        <main className="flex-grow-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};