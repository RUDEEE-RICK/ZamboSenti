"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Newspaper, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Agencies", href: "/agencies", icon: Building2 },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Emergency", href: "/emergency", icon: AlertTriangle },
  { name: "Account", href: "/account", icon: User },
];

const isActiveHref = (href: string, pathname: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = isActiveHref(item.href, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 press-effect",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "text-primary"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium mt-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
