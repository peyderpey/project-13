import React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import FunnelMenuIcon from "./FunnelMenuIcon";
import { useTranslation } from '../i18n/useTranslation';

export default function AppDrawer({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="ml-2 p-2 hover:bg-accent/30 transition-colors duration-200 focus:outline-none"
          aria-label="Open menu"
        >
          <FunnelMenuIcon className="w-8 h-8 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-xs w-full p-0">
        <SheetHeader>
          <SheetTitle>{t('drawer.title') || 'Menu & Settings'}</SheetTitle>
          <SheetDescription>{t('drawer.description') || 'Choose an action or adjust your settings.'}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}