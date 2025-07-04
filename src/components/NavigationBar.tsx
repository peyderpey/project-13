import React, { useState } from 'react';
import { Home, BookOpen, Settings, LogOut, Theater, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { useAppSettings } from '../hooks/useAppSettings';

interface NavigationBarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

interface NavItem {
  view: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ 
  currentView, 
  setCurrentView 
}) => {
  const { user, signOut, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { clearSettings } = useAppSettings();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearSettings();
      // Navigation will be handled by auth state change in App.tsx
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems: NavItem[] = [
    { 
      view: 'library', 
      label: t('library.title'), 
      icon: <Home className="w-5 h-5" />,
      requiresAuth: false
    },
    { 
      view: 'practice', 
      label: t('practice.title'), 
      icon: <BookOpen className="w-5 h-5" />,
      requiresAuth: true
    },
    { 
      view: 'settings', 
      label: t('settings.title'), 
      icon: <Settings className="w-5 h-5" />,
      requiresAuth: false
    }
  ];

  // Filter navigation items based on authentication status
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  const handleNavigation = (view: string) => {
    setCurrentView(view);
  };

  return (
    <nav className="nav-sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo Section */}
      <div className="nav-logo">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
          <Theater className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white">Rehearsify</h1>
          <p className="text-xs text-gray-400">{t('app.subtitle')}</p>
        </div>
      </div>

      {/* Main Navigation */}
      <ul className="nav-menu" role="menubar">
        {filteredNavItems.map((item) => (
          <li key={item.view} role="none">
            <button
              role="menuitem"
              onClick={() => handleNavigation(item.view)}
              className={`nav-item ${currentView === item.view ? 'active' : ''}`}
              aria-current={currentView === item.view ? 'page' : undefined}
              title={item.label}
            >
              <span className="nav-item-icon">
                {item.icon}
              </span>
              <span className="nav-item-label">{item.label}</span>
              {currentView === item.view && (
                <ChevronRight className="w-4 h-4 ml-auto text-white" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Footer Section */}
      <div className="nav-footer">
        {isAuthenticated && (
          <>
            {/* User Info */}
            <div className="nav-user-info">
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="nav-logout-btn"
              title={t('auth.signOut')}
              aria-label={t('auth.signOut')}
            >
              <span className="nav-item-icon">
                {isLoggingOut ? (
                  <div className="w-5 h-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </span>
              <span className="nav-item-label">
                {isLoggingOut ? 'Signing out...' : t('auth.signOut')}
              </span>
            </button>
          </>
        )}

        {/* Sign In Prompt for Unauthenticated Users */}
        {!isAuthenticated && (
          <div className="nav-auth-prompt">
            <p className="text-xs text-gray-400 text-center mb-2">
              {t('library.signInRequired')}
            </p>
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              {t('library.signInDescription')}
            </p>
          </div>
        )}
      </div>
    </nav>
  );
};