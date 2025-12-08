import { BottomNav } from '@/components/bottom-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="pb-16 min-h-screen bg-background">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
