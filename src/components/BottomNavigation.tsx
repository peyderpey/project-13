import React from 'react';
import { Home, BookOpen, Settings, User, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';

type AppState = 'library' | 'upload' | 'character-selection' | 'starting-point' | 'practice';

interface BottomNavigationProps {
  currentView: AppState;
  onNavigate: (view: AppState) => void;
  onSettingsClick: () => void;
  className?: string;
}

interface NavItem {
  id: AppState | 'settings';
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  requiresAuth?: boolean;
  badge?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onNavigate,
  onSettingsClick,
  className
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'library',
      label: t('library.title'),
      icon: <Home className="w-5 h-5" />,
      isActive: currentView === 'library'
    },
    {
      id: 'practice',
      label: t('practice.title'),
      icon: <Play className="w-5 h-5" />,
      isActive: currentView === 'practice',
      requiresAuth: false,
      badge: currentView === 'practice' ? 'Live' : undefined
    },
    {
      id: 'settings',
      label: t('settings.title'),
      icon: <Settings className="w-5 h-5" />,
      isActive: false
    }
  ];

  const handleNavigation = (item: NavItem) => {
    if (item.id === 'settings') {
      onSettingsClick();
    } else {
      onNavigate(item.id as AppState);
    }
  };

  // Only show on mobile and during relevant states
  const shouldShow = ['library', 'character-selection', 'practice'].includes(currentView);

  if (!shouldShow) return null;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border lg:hidden",
      "safe-area-pb", // For devices with bottom safe area
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          // Skip auth-required items if not authenticated
          if (item.requiresAuth && !isAuthenticated) return null;

          const isDisabled = item.id === 'practice' && currentView !== 'practice';

          return (
            <Button
              key={item.id}
              onClick={() => handleNavigation(item)}
              variant="ghost"
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center justify-center min-h-[60px] flex-1 relative",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                item.isActive && "text-primary bg-primary/10"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 text-xs px-1 py-0 min-w-0 h-4"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium mt-1 leading-none">
                {item.label}
              </span>
              {item.isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};