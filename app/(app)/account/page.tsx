import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings, Shield, FileText, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/logout-button';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const userData = user ? await supabase.auth.getUser() : null;

  // Fetch user profile with name
  let userProfile = null;
  let isAdmin = false;
  if (userData?.data?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, user_roles')
      .eq('id', userData.data.user.id)
      .single();
    
    userProfile = profile;
    isAdmin = profile?.user_roles === 'admin';
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Account" showNotifications={false} />

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* User Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              {user ? (
                <>
                  <h2 className="text-xl font-bold">
                    {userProfile?.name || 'User'}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold">Guest User</h2>
                  <p className="text-sm text-muted-foreground">Not signed in</p>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {user ? (
              <LogoutButton />
            ) : (
              <>
                <Button className="w-full" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth/sign-up">Create Account</Link>
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Account Options */}
        <div className="space-y-2">
          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <>
              <Link href="/admin/complaints">
                <Card className="p-4 flex items-center gap-4 hover:bg-orange-50 border-orange-200 transition-colors cursor-pointer">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <span className="font-medium text-orange-900">Complaints Panel</span>
                    <p className="text-xs text-orange-700">Manage complaints and reports</p>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/articles">
                <Card className="p-4 flex items-center gap-4 hover:bg-blue-50 border-blue-200 transition-colors cursor-pointer">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <span className="font-medium text-blue-900">Article Management</span>
                    <p className="text-xs text-blue-700">Create and manage news articles</p>
                  </div>
                </Card>
              </Link>
            </>
          )}

          {/* My Complaints - For regular users */}
          {user && (
            <Link href="/account/my-complaints">
              <Card className="p-4 flex items-center gap-4 hover:bg-primary/5 border-primary/20 transition-colors cursor-pointer">
                <ClipboardList className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">My Complaints</span>
                  <p className="text-xs text-muted-foreground">View and track your submitted complaints</p>
                </div>
              </Card>
            </Link>
          )}

          <Link href="/account/settings">
            <Card className="p-4 flex items-center gap-4 hover:bg-secondary/80 transition-colors cursor-pointer">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Settings</span>
            </Card>
          </Link>
        </div>

        {/* About Section */}
        <Card className="p-6">
          <h3 className="font-semibold mb-2">About ZamboSenti</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ez File Complaint - A citizen-focused application that enables Zamboanga City residents to report issues online quickly and securely. Track your complaints from submission to resolution.
          </p>
          <p className="text-xs text-muted-foreground">Version 1.0.0 | Zamboanga City</p>
        </Card>
      </div>
    </div>
  );
}
