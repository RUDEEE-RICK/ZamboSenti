"use client";

import { AlertTriangle, Building2, House, Newspaper, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: House, href: "/" },
  { label: "Agencies", icon: Building2, href: "/agencies" },
  { label: "News", icon: Newspaper, href: "/news" },
  { label: "Emergency", icon: AlertTriangle, href: "/emergency" },
  { label: "Account", icon: User, href: "/account" },
];

const isActiveHref = (href: string, pathname: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
};

export function NavButton() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100"
    >
      <div className="max-w-lg mx-auto px-2 py-2 flex justify-around items-center">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = isActiveHref(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
