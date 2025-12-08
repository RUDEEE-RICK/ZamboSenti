"use client";

import { AlertTriangle, House, Newspaper, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

const navItems = [
    { label: "Home", icon: House, ariaLabel: "Home", href: "/home" },
    { label: "Articles", icon: Newspaper, ariaLabel: "Articles", href: "/articles" },
    { label: "Emergency", icon: AlertTriangle, ariaLabel: "Emergency", href: "/emergency" },
    { label: "Settings", icon: Settings, ariaLabel: "Settings", href: "/settings" },
];

const isActiveHref = (href: string, pathname: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
};

export function NavButton() {
    const pathname = usePathname();
    return (
        <div
            role="navigation"
            aria-label="Bottom Navigation"
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 dark:bg-neutral-900 dark:border-neutral-800"
        >
            <nav className="max-w-screen-lg mx-auto px-3 py-2 flex justify-around items-center">
                {navItems.map(({ label, icon: Icon, ariaLabel, href }) => {
                    const active = isActiveHref(href, pathname);
                    const textColor = active ? "text-sky-500" : "text-gray-600 dark:text-neutral-400";
                    return (
                        <Link key={href} href={href} aria-label={ariaLabel} className="flex-1 flex justify-center">
                            <Button variant="ghost" className="flex flex-col items-center justify-center p-2">
                                <Icon className={`w-6 h-6 ${textColor}`} />
                                <span className={`text-xs mt-1 ${textColor}`}>{label}</span>
                            </Button>
                        </Link>
                    );
                })}
            </nav>
        </div>
    )
}