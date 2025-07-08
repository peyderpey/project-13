import React from 'react';
import { Menu } from 'lucide-react';
import AppDrawer from "./AppDrawer";
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { AuthModal } from './AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppSettings } from '../hooks/useAppSettings';
import { X, Library, Settings, User, LogOut, LogIn, ExternalLink, Home, Sparkles, Crown } from 'lucide-react';
import { SettingsSheet } from './SettingsSheet';
import { useUserRole } from '../hooks/useUserRole';

interface HeaderProps {
  settings: any;
  updateSettings: any;
  showSettings: boolean;
  setShowSettings: (open: boolean) => void;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  updateSettings,
  showSettings,
  setShowSettings,
  selectedTemplate,
  setSelectedTemplate
}) => {
  const { t } = useTranslation();
  const { user, signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { clearSettings } = useAppSettings();
  const { canAccessAIFeatures } = useUserRole();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearSettings();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">Rehearsify</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-accent/30 transition-colors duration-200"
              aria-label="Open settings"
            >
              <Settings className="w-6 h-6 text-foreground" />
            </Button>
                      </div>
            <AppDrawer>
              <div className="flex flex-col h-full p-6 space-y-4">
              
              {/* AI Voiceover - Only for Premium/Allowed Users */}
              {isAuthenticated && canAccessAIFeatures() && (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 dark:from-purple-950 dark:to-blue-950 dark:hover:from-purple-900 dark:hover:to-blue-900"
                >
                  <div className="flex items-center mr-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <Crown className="w-3 h-3 text-yellow-500 ml-1" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">AI Voiceover</p>
                    <p className="text-sm text-muted-foreground">Generate AI voices for scripts</p>
                  </div>
                </Button>
              )}
              
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
              
              <div className="mt-auto pt-6 border-t border-border space-y-4">
                {/* Settings */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-5 h-5 text-muted-foreground mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t('common.settings')}</p>
                    <p className="text-sm text-muted-foreground">Voice, accuracy, language</p>
                  </div>
                </Button>
                
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
          </AppDrawer>
          
          {/* Settings Sheet */}
          <SettingsSheet
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            accuracyLevel={settings.accuracyLevel}
            onAccuracyLevelChange={(level: string) => updateSettings({ accuracyLevel: level })}
            voiceSettings={settings.voiceSettings}
            onVoiceSettingsChange={(vs: any) => updateSettings({ voiceSettings: vs })}
            autoRecordTimeout={settings.autoRecordTimeout}
            onAutoRecordTimeoutChange={(timeout: number) => updateSettings({ autoRecordTimeout: timeout })}
            practiceMode={settings.autoAdvance ? 'auto' : 'manual'}
            onPracticeModeChange={(mode: string) => updateSettings({ autoAdvance: mode === 'auto' })}
            language={settings.language}
            useNewPracticeSession={settings.useNewPracticeSession}
            onUseNewPracticeSessionChange={(use: boolean) => updateSettings({ useNewPracticeSession: use })}
            onPracticeTemplateChange={(template: string) => {
              setSelectedTemplate(template);
              localStorage.setItem('practiceTemplate-default', template);
            }}
          />
          
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        </div>
      </div>
    </header>
  );
};