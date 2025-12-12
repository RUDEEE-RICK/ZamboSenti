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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20 max-w-screen-xl mx-auto pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 group relative`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-vinta-purple text-white shadow-md -translate-y-1' 
                  : 'bg-transparent text-gray-400 group-hover:text-vinta-purple group-hover:bg-vinta-purple/5'
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] font-medium mt-1 transition-colors ${
                isActive ? 'text-vinta-purple font-bold' : 'text-gray-400 group-hover:text-vinta-purple'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
