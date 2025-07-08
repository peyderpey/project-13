import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  enableSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className,
  enableSidebar = true 
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      enableSidebar && "lg:flex"
    )}>
      {children}
    </div>
  );
};

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
  hasMobileHeader?: boolean;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  children, 
  className,
  hasMobileHeader = true 
}) => {
  return (
    <main className={cn(
      "flex-1 w-full",
      // Mobile padding for header
      hasMobileHeader && "pt-14 lg:pt-0",
      // Desktop padding adjustment for sidebar
      "lg:ml-0",
      // Container styles
      "container mx-auto px-4 py-8",
      className
    )}>
      {children}
    </main>
  );
};