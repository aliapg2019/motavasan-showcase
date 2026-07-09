'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { User, UsageData } from './components/shared/types';
import { getStoredToken, getStoredUser, clearAuth, saveAuth, authFetch } from './components/shared/helpers';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import GeneratorTab from './components/GeneratorTab';
import HistoryTab from './components/HistoryTab';
import BrandVoiceTab from './components/BrandVoiceTab';
import BillingTab from './components/BillingTab';
import AdminTab from './components/AdminTab';
import SupportTab from './components/SupportTab';
import ChangePasswordTab from './components/ChangePasswordTab';

// Initialize dark mode synchronously to avoid flash
function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('contentgen_darkmode');
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [pageTransition, setPageTransition] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Apply dark mode class on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('contentgen_darkmode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      if (storedUser && storedToken) {
        setUser(storedUser);
        setShowLanding(false);
        setLoading(false);
        return;
      }

      try {
        const res = await authFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            saveAuth(data.token, data.user);
          }
          setUser(data.user);
          setShowLanding(false);
        }
      } catch {}
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch usage when user is available
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    authFetch('/api/usage')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data) setUsage(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  // Handle login
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLanding(false);
  };

  // Handle user update (e.g. plan change)
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Handle logout
  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setUsage(null);
    setActiveTab('dashboard');
    setShowLanding(true);
  };

  // Handle tab navigation with transition
  const handleNavigate = (tab: string) => {
    if (tab === activeTab) return;
    setPageTransition(true);
    setTimeout(() => {
      setActiveTab(tab);
      setPageTransition(false);
    }, 150);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 shadow-lg mb-4 animate-subtle-bounce">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 animate-pulse">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  if (showLanding && !user) {
    return <LandingPage onShowAuth={() => setShowLanding(false)} />;
  }

  // Auth screen
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Authenticated layout
  return (
    <div className="min-h-screen gradient-mesh">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          user={user}
          onLogout={handleLogout}
          collapsed={!sidebarOpen}
          onToggle={toggleSidebar}
          onUserUpdate={handleUserUpdate}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            user={user}
            usage={usage}
            onToggleSidebar={toggleSidebar}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-5xl mx-auto">
              <div className={`transition-all duration-150 ${pageTransition ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                {activeTab === 'dashboard' && (
                  <DashboardTab user={user} usage={usage} onNavigate={handleNavigate} />
                )}
                {activeTab === 'generator' && (
                  <GeneratorTab user={user} usage={usage} onNavigate={handleNavigate} />
                )}
                {activeTab === 'history' && (
                  <HistoryTab />
                )}
                {activeTab === 'brand-voice' && (
                  <BrandVoiceTab />
                )}
                {activeTab === 'billing' && (
                  <BillingTab user={user} usage={usage} onUserUpdate={handleUserUpdate} />
                )}
                {activeTab === 'support' && (
                  <SupportTab />
                )}
                {activeTab === 'change-password' && (
                  <ChangePasswordTab />
                )}
                {activeTab === 'admin' && user.role === 'admin' && (
                  <AdminTab />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
