import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (!ok) {
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h1 className="text-lg font-semibold text-center mb-1 text-primary-300">
          YugiAdmin
        </h1>
        <p className="text-xs text-slate-400 text-center mb-6">
          Admin console for your Yu-Gi-Oh! store
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              Username<span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-2">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        <p className="text-[11px] text-slate-500 mt-4 text-center">
          Auth is backed by PocketBase. Login is limited to the admin user set in{' '}
          <code>.env</code> (<code>VITE_ADMIN_USER</code>,{' '}
          <code>VITE_ADMIN_PASSWORD</code>).
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

