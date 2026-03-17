import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { ItemsPage } from './pages/ItemsPage';
import CurrencySettingsPage from './pages/CurrencySettingsPage';
import { useAuthStore } from './store/authStore';
import { useInventoryStore } from './store/inventoryStore';
import { useSettingsStore } from './store/settingsStore';

const App = () => {
  const { restore, isAuthenticated } = useAuthStore();
  const { fetchAll } = useInventoryStore();
  const { restore: restoreSettings } = useSettingsStore();

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void restoreSettings();
    void fetchAll();
  }, [fetchAll, isAuthenticated, restoreSettings]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cards" element={<ItemsPage kind="card" />} />
        <Route path="decks" element={<ItemsPage kind="deck" />} />
        <Route path="accessories" element={<ItemsPage kind="accessory" />} />
        <Route path="currency" element={<CurrencySettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

