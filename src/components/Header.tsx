import React from 'react';
import { Theater } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTranslation } from '../i18n/useTranslation';

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  showLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  title = "Rehearsify",
  showLogo = true 
}) => {
  const { t } = useTranslation();

  return (
    <header className="hidden lg:block bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showLogo && (
              <>
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                  <Theater className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{title}</h1>
                  <p className="text-sm text-muted-foreground">{t('app.subtitle')}</p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};