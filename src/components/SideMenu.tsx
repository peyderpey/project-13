import React, { useState } from 'react';
import { X, Library, Settings, User, LogOut, LogIn, ExternalLink, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { AuthModal } from './AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppSettings } from '../hooks/useAppSettings';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick: () => void;
  onBackToLibrary?: () => void;
  onExitSession?: () => void;
  currentView: 'library' | 'upload' | 'character-selection' | 'starting-point' | 'practice';
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onSettingsClick,
  onBackToLibrary,
  onExitSession,
  currentView
}) => {
  const { t } = useTranslation();
  const { user, signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { clearSettings } = useAppSettings();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearSettings();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleBackToLibrary = () => {
    if (onBackToLibrary) {
      onBackToLibrary();
    }
    onClose();
  };

  const handleExitSession = () => {
    if (onExitSession) {
      onExitSession();
    }
    onClose();
  };

  const handleSettingsClick = () => {
    onSettingsClick();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Side Menu */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-l border-border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 p-6 space-y-4">
            {/* Back to Library / Exit Session */}
            {currentView !== 'library' && (
              <Button
                onClick={currentView === 'practice' ? handleExitSession : handleBackToLibrary}
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                {currentView === 'practice' ? (
                  <>
                    <Library className="w-5 h-5 text-primary mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">Exit Session</p>
                      <p className="text-sm text-muted-foreground">Return to script library</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Home className="w-5 h-5 text-primary mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">Back to Library</p>
                      <p className="text-sm text-muted-foreground">Browse scripts</p>
                    </div>
                  </>
                )}
              </Button>
            )}

            {/* Settings */}
            <Button
              onClick={handleSettingsClick}
              variant="ghost"
              className="w-full justify-start h-auto p-4"
            >
              <Settings className="w-5 h-5 text-muted-foreground mr-3" />
              <div className="text-left">
                <p className="font-medium text-foreground">{t('common.settings')}</p>
                <p className="text-sm text-muted-foreground">Voice, accuracy, language</p>
              </div>
            </Button>

            {/* Divider */}
            <Separator />

            {/* Authentication Section */}
            {isAuthenticated ? (
              <>
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
                  {isLoggingOut ? (
                    <div className="w-5 h-5 animate-spin border-2 border-destructive border-t-transparent rounded-full mr-3" />
                  ) : (
                    <LogOut className="w-5 h-5 text-destructive mr-3" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {isLoggingOut ? 'Signing out...' : t('auth.signOut')}
                    </p>
                    <p className="text-sm text-muted-foreground">End your session</p>
                  </div>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAuthClick}
                variant="outline"
                className="w-full justify-start h-auto p-4 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20"
              >
                <LogIn className="w-5 h-5 text-primary mr-3" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{t('auth.signIn')}</p>
                  <p className="text-sm text-muted-foreground">Save your scripts and progress</p>
                </div>
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border">
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
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};