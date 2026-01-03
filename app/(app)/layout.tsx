"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/lib/context/sidebar-context";
import { cn } from "@/lib/utils";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        "pb-20 md:pb-0 min-h-screen transition-all duration-300 ease-out",
        isCollapsed ? "md:pl-[72px]" : "md:pl-[240px]"
      )}
    >
      <div className="bg-white min-h-screen">{children}</div>
    </main>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <MainContent>{children}</MainContent>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
