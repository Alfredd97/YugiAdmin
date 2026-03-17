import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/cards', label: 'Cards' },
  { to: '/decks', label: 'Decks' },
  { to: '/accessories', label: 'Accessories' },
  { to: '/currency', label: 'Currency Settings' }
];

export const Layout = () => {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="text-lg font-semibold text-primary-400">YugiAdmin</div>
          <div className="text-xs text-slate-400 mt-1">Yu-Gi-Oh! Store Admin</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/70 backdrop-blur">
          <div className="md:hidden">
            <span className="text-primary-400 font-semibold">YugiAdmin</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              Logged in as <span className="font-medium">{username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs rounded-md border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

