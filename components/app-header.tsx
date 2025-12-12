"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/headless/Button";
import { UserAvatar } from "@/components/user-avatar";
import { AnimatedBackground } from "@/components/animated-background";

interface AppHeaderProps {
  title?: string;
  showNotifications?: boolean;
  rightElement?: React.ReactNode;
}

export function AppHeader({
  title,
  showNotifications = true,
  rightElement,
}: AppHeaderProps) {
  return (
    <header className="relative z-40 bg-gradient-to-r from-vinta-purple to-vinta-pink text-white shadow-md overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex items-center justify-between h-16 px-4 max-w-screen-xl mx-auto">
        {title ? (
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-2">
          {rightElement}
          <UserAvatar />
          {showNotifications && (
            <Button
              variant="ghost"
              className="rounded-full w-10 h-10 p-0 text-white hover:bg-white/20"
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
