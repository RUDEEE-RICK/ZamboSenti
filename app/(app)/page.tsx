"use client";

import Link from "next/link";
import {
  MapPin,
  ChevronRight,
  FileText,
  Building2,
  Phone,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { quickActions } from "@/lib/data/mockData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGreeting } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { NewsList } from "@/components/news-list";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userBarangay, setUserBarangay] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    solved: 0,
    resolvedPercentage: 0,
  });
  const [showHero, setShowHero] = useState(false);

  // Check if user is logged in and control hero display
  useEffect(() => {
    if (!loading) {
      setShowHero(!user);
    }
  }, [user, loading]);

  useEffect(() => {
    const checkAdminAndFetchProfile = async () => {
      if (user) {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("user_roles, barangay")
          .eq("id", user.id)
          .single();

        const userIsAdmin = data?.user_roles === "admin";
        setIsAdmin(userIsAdmin);
        setUserBarangay(data?.barangay || null);

        // Fetch stats after determining admin status
        fetchStats(userIsAdmin);
      } else {
        setIsAdmin(false);
        setUserBarangay(null);
        setStats({
          total: 0,
          pending: 0,
          processing: 0,
          solved: 0,
          resolvedPercentage: 0,
        });
      }
    };

    const fetchStats = async (adminStatus: boolean) => {
      const supabase = createClient();

      if (adminStatus) {
        // Admin sees all complaints stats
        const { data: complaints } = await supabase
          .from("complaints")
          .select("status");

        if (complaints) {
          const total = complaints.length;
          const pending = complaints.filter(
            (c) => c.status === "pending"
          ).length;
          const processing = complaints.filter(
            (c) => c.status === "processing"
          ).length;
          const solved = complaints.filter((c) => c.status === "solved").length;
          const resolvedPercentage =
            total > 0 ? Math.round((solved / total) * 100) : 0;

          setStats({ total, pending, processing, solved, resolvedPercentage });
        }
      } else if (user) {
        // Regular user sees their own complaint stats
        const { data: complaints } = await supabase
          .from("complaints")
          .select("status")
          .eq("user_id", user.id);

        if (complaints) {
          const total = complaints.length;
          const pending = complaints.filter(
            (c) => c.status === "pending"
          ).length;
          const processing = complaints.filter(
            (c) => c.status === "processing"
          ).length;
          const solved = complaints.filter((c) => c.status === "solved").length;
          const resolvedPercentage =
            total > 0 ? Math.round((solved / total) * 100) : 0;

          setStats({ total, pending, processing, solved, resolvedPercentage });
        }
      }
    };

    if (!loading) {
      checkAdminAndFetchProfile();
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gradient">ZamSolucion</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1.5 rounded-full border border-primary/10">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold text-primary">
              {user && userBarangay ? userBarangay : "Zamboanga City"}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">ZamSolucion</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {loading ? "Welcome" : getGreeting()}
                {user && user.user_metadata?.name
                  ? `, ${user.user_metadata.name.split(" ")[0]}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <Link
                  href="/account/settings"
                  className="ml-1 p-2 py-1.5 flex items-center gap-2 rounded-full hover:bg-primary/10 transition-colors "
                  title="Update barangay"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {user && userBarangay ? userBarangay : "Zamboanga City"}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:space-y-8 space-y-4">
        {/* Hero Section - Only for non-logged-in users */}
        {showHero && (
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white fade-in">
            <div className="p-6 md:p-10 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 max-w-xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Your Voice,
                  <br />
                  Our Action.
                </h1>
                <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
                  Report issues, track complaints, and stay updated with the
                  latest news in Zamboanga City.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-white text-primary hover:bg-white/90 font-semibold px-6 rounded-full"
                    asChild
                  >
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-white border border-white/30 hover:bg-white/10 font-medium px-6 rounded-full"
                    asChild
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Quick Actions
                </h3>
              </div>

              {isAdmin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/admin/complaints" className="group">
                    <Card className="p-4 card-hover border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">
                            Complaints Panel
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            Manage citizen reports
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Card>
                  </Link>
                </div>
              ) : isAdmin === false ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickActions.map((action, index) => {
                    const colors = [
                      "bg-primary/10 text-primary",
                      "bg-pink-100 text-pink-600",
                      "bg-amber-100 text-amber-600",
                      "bg-cyan-100 text-cyan-600",
                    ];
                    const colorClass = colors[index % colors.length];
                    const IconComponent = action.icon;

                    return (
                      <Link
                        key={action.id}
                        href={action.route}
                        className="group"
                      >
                        <Card className="p-4 h-full card-hover border-gray-100 flex flex-col items-center text-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center transition-transform group-hover:scale-110`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {action.title}
                          </span>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>

            {/* File a Report - For logged-in non-admin users */}
            {user && isAdmin === false && (
              <section className="fade-in delay-100">
                <Link href="/report" className="block group">
                  <Card className="p-4 card-hover border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          File a Report
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Submit a complaint to address it promptly
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              </section>
            )}

            {/* Quick Links */}
            <section className="fade-in delay-200">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/agencies" className="group">
                  <Card className="p-4 card-hover border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm">
                          Agencies
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Government services
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/emergency" className="group">
                  <Card className="p-4 card-hover border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm">
                          Emergency
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Hotlines & safety
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </section>
          </div>

          {/* Right Column - News */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Latest News
              </h3>
              <Link
                href="/news"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Card className="border-gray-100 overflow-hidden">
              <NewsList maxArticles={3} showViewAll={false} />
            </Card>

            {/* Stats Card */}
            <Card className="p-4 border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 text-primary/5">
                <TrendingUp className="w-full h-full" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                {isAdmin === true
                  ? "System Overview"
                  : user
                  ? "Your Reports"
                  : "Did you know?"}
              </h4>
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    {isAdmin === true
                      ? `${stats.total} total complaints • ${stats.solved} resolved`
                      : stats.total > 0
                      ? `You have ${stats.total} ${
                          stats.total === 1 ? "complaint" : "complaints"
                        } submitted`
                      : "You haven't submitted any complaints yet"}
                  </p>
                  {stats.total > 0 && (
                    <>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                          style={{ width: `${stats.resolvedPercentage}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {isAdmin === true ? "Overall Resolved" : "Your Resolved"}
                        </span>
                        <span className="font-semibold text-foreground">
                          {stats.resolvedPercentage}%
                        </span>
                      </div>
                      {isAdmin === true && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Pending
                            </div>
                            <div className="text-sm font-semibold text-amber-600">
                              {stats.pending}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Processing
                            </div>
                            <div className="text-sm font-semibold text-blue-600">
                              {stats.processing}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Solved
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {stats.solved}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    Join our community to report issues and help improve
                    Zamboanga City.
                  </p>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    asChild
                  >
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
