import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import DataPreviewPage from './pages/DataPreviewPage';
import ReconciliationPage from './pages/ReconciliationPage';
import ExceptionsPage from './pages/ExceptionsPage';
import ReportsPage from './pages/ReportsPage';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingExceptionsCount, setPendingExceptionsCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Check auth session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getCurrentUser()
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setInitializing(false));
    } else {
      // Default demo login for instant convenience
      api.getCurrentUser()
        .then((userData) => {
          setUser(userData || { username: 'admin', role: 'admin', full_name: 'Lead Reconciliation Engineer' });
        })
        .catch(() => {
          setUser({ username: 'admin', role: 'admin', full_name: 'Lead Reconciliation Engineer' });
        })
        .finally(() => setInitializing(false));
    }
  }, []);

  // Update pending exceptions count for sidebar badge
  const updateExceptionsBadge = async () => {
    try {
      const stats = await api.getExceptionStats();
      setPendingExceptionsCount(stats.pending || 0);
    } catch (err) {
      // Silently handle if not ready
    }
  };

  useEffect(() => {
    if (user) {
      updateExceptionsBadge();
    }
  }, [user, activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await updateExceptionsBadge();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Initializing Reconciliation Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingExceptionsCount={pendingExceptionsCount}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
          {activeTab === 'upload' && <UploadPage setActiveTab={setActiveTab} />}
          {activeTab === 'preview' && <DataPreviewPage />}
          {activeTab === 'reconciliation' && <ReconciliationPage />}
          {activeTab === 'exceptions' && (
            <ExceptionsPage onExceptionsUpdated={(cnt) => setPendingExceptionsCount(cnt)} />
          )}
          {activeTab === 'reports' && <ReportsPage />}
        </main>
      </div>
    </div>
  );
}

