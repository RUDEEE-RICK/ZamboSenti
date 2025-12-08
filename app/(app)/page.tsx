'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { quickActions} from '@/lib/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGreeting } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { ReportSubmissionForm } from '@/components/report-submission-form';
import { NewsList } from '@/components/news-list';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 bg-gradient-to-r from-primary/90 to-primary">
        <div className="relative max-w-screen-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        <div className="bg-gradient-to-br from-primary via-teal-600 to-cyan-700 rounded-2xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              {loading ? 'Buenas Tardes' : getGreeting()}
            </h2>
            {user && (
              <p className="text-white/90 mb-4">
                Welcome back, {user.user_metadata?.name?.split(' ')[0] || 'Citizen'}! Ready to make Zamboanga City better?
              </p>
            )}
            {!user && (
              <>
                <p className="text-white/90 mb-4">
                  Join ZamboSenti to report issues and help improve our city
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-white text-primary hover:bg-white/90 font-semibold"
                  asChild
                >
                  <Link href="/auth/sign-up">
                    Create your account →
                  </Link>
                </Button>
              </>
            )}
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 opacity-50">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="30" />
              <circle cx="20" cy="20" r="15" />
              <circle cx="80" cy="80" r="20" />
            </svg>
          </div>
        </div>

        <section>
          <h3 className="text-xl font-semibold mb-4">What would you like to do?</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.route}
                className="flex flex-col items-center justify-center p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
              >
                <span className="text-3xl mb-2">{action.icon}</span>
                <span className="text-xs text-center font-medium">{action.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {user && (
          <section>
            <ReportSubmissionForm />
          </section>
        )}

        {!user && (
          <Card className="bg-gradient-to-br from-teal-800 to-teal-700 border-none p-6">
            <h3 className="text-xl font-bold text-white mb-2">Help us improve our city</h3>
            <p className="text-teal-100 mb-4 text-sm">
              Create an account to report local issues directly to the city.
            </p>
            <Button 
              variant="secondary" 
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
              asChild
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </Card>
        )}

        <section>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Latest News</h3>
            <p className="text-sm text-muted-foreground">Latest news and announcements for Zamboanga City</p>
          </div>
          
          <NewsList maxArticles={5} showViewAll={true} />
        </section>

      </div>
    </div>
  );
}
