import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { setStatus } from '../store/slices/agentSlice';
import type { RootState } from '../store/store';

export const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { status: agentStatus } = useSelector((state: RootState) => state.agent);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: 'dialer', label: 'Dialer', icon: '📞' },
    { path: 'campaigns', label: 'Campaigns', icon: '📊' },
    { path: 'contacts', label: 'Contacts', icon: '👥' },
    { path: 'history', label: 'History', icon: '📜' },
  ];

  const supervisorItems = [
    { path: 'wallboard', label: 'Wallboard', icon: '📈' },
  ];

  const adminItems = [
    { path: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0B1220' }}>
      {/* Sidebar */}
      <aside className="w-64 glass-card m-4 p-4 flex flex-col">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold" style={{ color: '#7C5CFF' }}>
            NovaDial Pro
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/10"
              style={(props: any) => ({
                background: props.isActive ? 'rgba(124, 92, 255, 0.2)' : 'transparent',
                color: props.isActive ? '#7C5CFF' : '#ffffff',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {user?.role === 'supervisor' && supervisorItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/10"
              style={(props: any) => ({
                background: props.isActive ? 'rgba(124, 92, 255, 0.2)' : 'transparent',
                color: props.isActive ? '#7C5CFF' : '#ffffff',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {(user?.role === 'admin' || user?.role === 'owner') && adminItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/10"
              style={(props: any) => ({
                background: props.isActive ? 'rgba(124, 92, 255, 0.2)' : 'transparent',
                color: props.isActive ? '#7C5CFF' : '#ffffff',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Status Toggle */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <select
            value={agentStatus}
            onChange={(e) => dispatch(setStatus(e.target.value as any))}
            className="input mb-4"
          >
            <option value="available">Available</option>
            <option value="paused">Paused</option>
            <option value="offline">Offline</option>
          </select>

          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary w-full mt-2">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
