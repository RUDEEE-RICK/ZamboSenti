import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/headless/Button";
import {
  User,
  Settings,
  Shield,
  FileText,
  ClipboardList,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { AnimatedBackground } from "@/components/animated-background";

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
      .from("profiles")
      .select("name, user_roles")
      .eq("id", userData.data.user.id)
      .single();

    userProfile = profile;
    isAdmin = profile?.user_roles === "admin";
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <AppHeader title="Account" showNotifications={false} />

      <div className="max-w-screen-xl mx-auto px-4 py-8 relative z-10 space-y-8">
        {/* User Profile Card */}
        <Card className="overflow-hidden relative border-white/50 shadow-xl bg-white/70 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-vinta-purple to-vinta-pink opacity-20" />
          <div className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-vinta-purple to-vinta-pink p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <User className="w-10 h-10 text-vinta-purple" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                {user ? (
                  <>
                    <div>
                      <h2 className="text-3xl font-bold text-foreground">
                        {userProfile?.name || "User"}
                      </h2>
                      <p className="text-muted-foreground font-medium">
                        {user.email}
                      </p>
                    </div>
                    {isAdmin && (
                      <span className="inline-flex items-center px-3 py-1 bg-vinta-orange/10 text-vinta-orange text-xs font-bold rounded-full uppercase tracking-wider border border-vinta-orange/20">
                        <Shield className="w-3 h-3 mr-1" /> Admin Access
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-foreground">
                      Guest User
                    </h2>
                    <p className="text-muted-foreground">
                      Sign in to access all features
                    </p>
                  </>
                )}
              </div>
              <div className="w-full md:w-auto flex justify-center">
                {user ? (
                  <LogoutButton />
                ) : (
                  <div className="flex flex-col gap-3 w-full md:w-48">
                    <Button
                      variant="primary"
                      className="w-full shadow-lg hover:shadow-xl transition-all"
                      as={Link}
                      href="/auth/login"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      as={Link}
                      href="/auth/sign-up"
                    >
                      Create Account
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vinta-purple-dark px-1">
              My Account
            </h3>
            <div className="space-y-3">
              <Link href="/account/my-complaints" className="block group">
                <Card className="p-4 flex items-center gap-4 bg-white/60 backdrop-blur-sm border-white/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-foreground block">
                      My Complaints
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Track status of your reports
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-vinta-purple transition-colors" />
                </Card>
              </Link>

              <Link href="/account/settings" className="block group">
                <Card className="p-4 flex items-center gap-4 bg-white/60 backdrop-blur-sm border-white/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-800 group-hover:text-white transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-foreground block">
                      Settings
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Manage profile and security
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-vinta-purple transition-colors" />
                </Card>
              </Link>
            </div>
          </div>

          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
              <h3 className="text-lg font-semibold text-vinta-orange px-1">
                Admin Controls
              </h3>
              <div className="space-y-3">
                <Link href="/admin/complaints" className="block group">
                  <Card className="p-4 flex items-center gap-4 bg-orange-50/60 backdrop-blur-sm border-orange-100 hover:bg-orange-100/80 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-orange-900 block">
                        Complaints Panel
                      </span>
                      <p className="text-xs text-orange-700">
                        Manage all user reports
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-orange-400 group-hover:text-orange-700 transition-colors" />
                  </Card>
                </Link>

                <Link href="/admin/articles" className="block group">
                  <Card className="p-4 flex items-center gap-4 bg-blue-50/60 backdrop-blur-sm border-blue-100 hover:bg-blue-100/80 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-blue-900 block">
                        Article Management
                      </span>
                      <p className="text-xs text-blue-700">
                        Create and edit news
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-blue-700 transition-colors" />
                  </Card>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
