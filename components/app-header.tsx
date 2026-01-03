"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

interface AppHeaderProps {
  title?: string;
  showNotifications?: boolean;
  rightElement?: React.ReactNode;
}

// Get initials from name (first letter of first and last name)
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  return email?.charAt(0).toUpperCase() || "U";
}

export function AppHeader({
  title,
  showNotifications = true,
  rightElement,
}: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 md:hidden">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 max-w-6xl mx-auto">
        {title ? (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-2">
          {rightElement}

          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
          )}

          {user && (
            <Link href="/account">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {getInitials(user.user_metadata?.name, user.email)}
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
