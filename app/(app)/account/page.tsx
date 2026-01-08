import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  Shield,
  FileText,
  ClipboardList,
  ChevronRight,
  Phone,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { AppHeader } from "@/components/app-header";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const userData = user ? await supabase.auth.getUser() : null;

  let userProfile = null;
  let isAdmin = false;
  if (userData?.data?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, user_roles")
      .eq("id", userData.data.user.id)
      .single();

    userProfile = profile;
    isAdmin = profile?.user_roles === "admin";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings
          </p>
        </div>

        <div className="space-y-6">        {/* User Profile Card */}
        <Card className="p-5 border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {userProfile?.name || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-foreground">
                    Guest User
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sign in to access all features
                  </p>
                </>
              )}
            </div>

            {user ? (
              <LogoutButton />
            ) : (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>
        </Card>

        {/* Account Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            My Account
          </h3>
          <div className="space-y-2">
            <Link href="/account/my-complaints" className="block group">
              <Card className="p-4 card-hover border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground block">
                      My Complaints
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Track status of your reports
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>

            <Link href="/account/settings" className="block group">
              <Card className="p-4 card-hover border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground block">
                      Settings
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Manage profile and security
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="space-y-4 fade-in">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              Admin Controls
            </h3>
            <div className="space-y-2">
              <Link href="/admin/complaints" className="block group">
                <Card className="p-4 card-hover border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-amber-900 block">
                        Complaints Panel
                      </span>
                      <p className="text-xs text-amber-700">
                        Manage all user reports
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                </Card>
              </Link>

              <Link href="/admin/statistics" className="block group">
                <Card className="p-4 card-hover border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-indigo-900 block">
                        System Statistics
                      </span>
                      <p className="text-xs text-indigo-700">
                        View analytics & insights
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Sign Up CTA for guests */}
        {!user && (
          <Card className="p-5 border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
            <h3 className="font-semibold text-foreground mb-2">
              Join ZamSolucion
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to file reports and track your complaints.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/sign-up">Create Account</Link>
            </Button>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}
