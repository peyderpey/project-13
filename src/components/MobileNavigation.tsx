import React, { useState } from 'react';
import { 
  Menu, 
  Home, 
  BookOpen, 
  Settings, 
  User, 
  LogOut, 
  LogIn, 
  Theater,
  Library,
  X,
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { useAppSettings } from '../hooks/useAppSettings';
import { AuthModal } from './AuthModal';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

type AppState = 'library' | 'upload' | 'character-selection' | 'starting-point' | 'practice';

interface MobileNavigationProps {
  currentView: AppState;
  onBackToLibrary?: () => void;
  onExitSession?: () => void;
  onSettingsClick: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  action?: () => void;
  variant?: 'default' | 'destructive' | 'primary';
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onBackToLibrary,
  onExitSession,
  onSettingsClick
}) => {
  const { t } = useTranslation();
  const { user, signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { clearSettings } = useAppSettings();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearSettings();
      setIsSheetOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
    setIsSheetOpen(false);
  };

  const handleBackToLibrary = () => {
    if (onBackToLibrary) {
      onBackToLibrary();
    }
    setIsSheetOpen(false);
  };

  const handleExitSession = () => {
    if (onExitSession) {
      onExitSession();
    }
    setIsSheetOpen(false);
  };

  const handleSettingsClick = () => {
    onSettingsClick();
    setIsSheetOpen(false);
  };

  // Navigation items based on current state and auth status
  const getNavigationItems = (): NavItem[] => {
    const items: NavItem[] = [];

    // Context-specific navigation
    if (currentView === 'practice') {
      items.push({
        id: 'exit-session',
        label: 'Exit Session',
        icon: <Library className="w-5 h-5" />,
        action: handleExitSession,
        variant: 'primary'
      });
    } else if (currentView !== 'library') {
      items.push({
        id: 'back-to-library',
        label: 'Back to Library',
        icon: <Home className="w-5 h-5" />,
        action: handleBackToLibrary,
        variant: 'primary'
      });
    }

    // Settings
    items.push({
      id: 'settings',
      label: t('common.settings'),
      icon: <Settings className="w-5 h-5" />,
      action: handleSettingsClick
    });

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Header with Menu Button */}
      <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
              <Theater className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Rehearsify</h1>
            </div>
          </div>

          {/* Menu Button */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                    <Theater className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">Rehearsify</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {t('app.subtitle')}
                    </p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Navigation Items */}
                {navigationItems.length > 0 && (
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.id}
                        onClick={item.action}
                        variant={item.variant === 'primary' ? 'default' : 'ghost'}
                        className={cn(
                          "w-full justify-start h-auto p-4",
                          item.variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <div className="text-left">
                            <p className="font-medium">{item.label}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Authentication Section */}
                {isAuthenticated ? (
                  <div className="space-y-4">
                    {/* User Info */}
                    <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {user?.email?.split('@')[0]}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Pro
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sign Out */}
                    <Button
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <div className="flex items-center space-x-3">
                        {isLoggingOut ? (
                          <div className="w-5 h-5 animate-spin border-2 border-destructive border-t-transparent rounded-full" />
                        ) : (
                          <LogOut className="w-5 h-5" />
                        )}
                        <div className="text-left">
                          <p className="font-medium">
                            {isLoggingOut ? 'Signing out...' : t('auth.signOut')}
                          </p>
                          <p className="text-sm text-muted-foreground">End your session</p>
                        </div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAuthClick}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20"
                  >
                    <div className="flex items-center space-x-3">
                      <LogIn className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{t('auth.signIn')}</p>
                        <p className="text-sm text-muted-foreground">Save progress & sync scripts</p>
                      </div>
                    </div>
                  </Button>
                )}

                <Separator />

                {/* Footer */}
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 border-0"
                >
                  <a
                    href="https://bolt.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2"
                    title="Built with Bolt.new"
                  >
                    <span className="text-sm font-medium">Built with</span>
                    <span className="text-sm font-bold">Bolt.new</span>
                    <ExternalLink className="w-4 h-4 opacity-75" />
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:min-w-64 lg:h-screen lg:bg-gradient-to-b lg:from-gray-900 lg:to-gray-800 lg:border-r lg:border-border lg:sticky lg:top-0 lg:z-30">
        <div className="flex flex-col h-full p-6">
          {/* Desktop Logo */}
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-700 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
              <Theater className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rehearsify</h1>
              <p className="text-xs text-gray-400">{t('app.subtitle')}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="flex-1 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                onClick={item.action}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50",
                  item.variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="mt-auto pt-6 border-t border-gray-700">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 animate-spin border-2 border-red-400 border-t-transparent rounded-full" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="ml-3">
                    {isLoggingOut ? 'Signing out...' : t('auth.signOut')}
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAuthClick}
                variant="outline"
                className="w-full justify-start bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              >
                <LogIn className="w-4 h-4" />
                <span className="ml-3">{t('auth.signIn')}</span>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};