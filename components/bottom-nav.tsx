'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, FileText, AlertTriangle, Building2, User } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  // { name: 'Services', href: '/services', icon: Grid3x3 },
  { name: 'Agencies', href: '/agencies', icon: Building2 },
  { name: 'News', href: '/news', icon: FileText },
  { name: 'Emergency', href: '/emergency', icon: AlertTriangle },
  { name: 'Account', href: '/account', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
