"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Newspaper,
  AlertTriangle,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Expand,
  ArrowLeftToLine,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/lib/context/sidebar-context";

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

const sidebarItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Hub",
    href: "/news",
    icon: Users,
  },
  {
    title: "Agencies",
    href: "/agencies",
    icon: Building2,
  },
  {
    title: "Emergency",
    href: "/emergency",
    icon: AlertTriangle,
  },
  {
    title: "Account",
    href: "/account",
    icon: User,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const { isCollapsed, toggle } = useSidebar();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ease-out",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-gray-100",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="text-lg font-bold text-gradient">ZamSolucion</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          {isCollapsed ? (
            <Expand className="w-4 h-4" />
          ) : (
            <ArrowLeftToLine className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive && "text-primary"
                )}
              />
              {!isCollapsed && (
                <span className="text-sm truncate">{item.title}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.title}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-gray-100">
        {user ? (
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {getInitials(user.user_metadata?.name, user.email)}
              </span>
            </div>

            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        ) : (
          !isCollapsed && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
              asChild
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )
        )}
      </div>
    </aside>
  );
}
