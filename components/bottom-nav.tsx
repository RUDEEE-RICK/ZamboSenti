"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertTriangle, User, Users, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const isActiveHref = (href: string, pathname: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
};

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("user_roles")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.user_roles === "admin");
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Hub", href: "/news", icon: Users },
    { name: "Emergency", href: "/emergency", icon: AlertTriangle },
    { name: "Account", href: "/account", icon: User },
  ];

  const plusButtonHref = isAdmin ? "/admin/complaints" : "/report";
  const PlusIcon = isAdmin ? FileText : Plus;


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {/* First two items */}
        {navItems.slice(0, 2).map((item) => {
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

        {/* Center Plus Button */}
        <Link
          href={plusButtonHref}
          className="flex flex-col items-center justify-center flex-1 h-full py-2"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-200 press-effect">
            <PlusIcon className="w-6 h-6 text-white" />
          </div>
        </Link>

        {/* Last two items */}
        {navItems.slice(2).map((item) => {
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
