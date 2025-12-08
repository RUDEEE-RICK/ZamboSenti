'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';

interface AppHeaderProps {
  title?: string;
  showNotifications?: boolean;
  rightElement?: React.ReactNode;
}

export function AppHeader({ title, showNotifications = true, rightElement }: AppHeaderProps) {
  return (
    <header className="z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 max-w-screen-xl mx-auto">
        {title ? (
          <h1 className="text-2xl font-bold">{title}</h1>
        ) : (
          <div className="flex-1" />
        )}
        
        <div className="flex items-center gap-2">
          {rightElement}
          <UserAvatar />
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
