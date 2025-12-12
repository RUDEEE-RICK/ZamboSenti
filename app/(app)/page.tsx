"use client";

import Link from "next/link";
import { CloudSun, MapPin, Shield, FileText, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { quickActions } from "@/lib/data/mockData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/headless/Button";
import { getGreeting } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { ReportSubmissionForm } from "@/components/report-submission-form";
import { NewsList } from "@/components/news-list";
import { AnimatedBackground } from "@/components/animated-background";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("user_roles")
          .eq("id", user.id)
          .single();

        setIsAdmin(data?.user_roles === "admin");
      } else {
        setIsAdmin(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      {/* Animated Header Background */}
      <div className="relative bg-gradient-to-r from-vinta-purple to-vinta-pink shadow-lg overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 px-4 py-6">
          <div className="flex items-start justify-between text-white">
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">
                ZamSolucion
              </h1>
              <div className="flex items-center gap-2 pl-1">
                <MapPin className="w-4 h-4 opacity-80" />
                <span className="text-sm font-medium opacity-90">
                  Zamboanga City
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
              <CloudSun className="w-5 h-5" />
              <span className="text-sm font-bold">32°C</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-vinta-purple via-vinta-pink to-vinta-orange rounded-3xl p-1 relative overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/5 backdrop-blur-[2px] rounded-[22px] p-6 h-full relative overflow-hidden">
            {/* Decorative Vinta Sail Pattern */}
            <div className="absolute -right-10 -top-10 w-64 h-64 opacity-10 rotate-12">
              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)] rounded-full" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2 animate-float">
                {loading ? "Buenas Tardes" : getGreeting()}
              </h2>
              {user ? (
                <p className="text-white/90 mb-4 text-lg font-light">
                  Welcome back,{" "}
                  <span className="font-semibold">
                    {user.user_metadata?.name?.split(" ")[0] || "Citizen"}
                  </span>
                  !
                  <br />
                  Ready to make Zamboanga City better?
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-white/90 text-lg font-light">
                    Join <span className="font-bold">ZamboSenti</span> to report
                    issues and help improve our city together.
                  </p>
                  <Button
                    variant="secondary"
                    className="bg-white text-vinta-purple hover:bg-white/90 font-bold border-none shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 rounded-xl px-6"
                    as={Link}
                    href="/auth/sign-up"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        {/* Quick Actions Grid or Admin Controls */}
        <section>
          {isAdmin ? (
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
          ) : (
            <>
              <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                <span className="w-1 h-6 bg-vinta-purple rounded-full"></span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map((action, index) => {
                  const colors = [
                    "text-vinta-purple",
                    "text-vinta-pink",
                    "text-vinta-orange",
                    "text-vinta-cyan",
                    "text-vinta-green",
                    "text-vinta-yellow",
                  ];
                  const colorClass = colors[index % colors.length];

                  return (
                    <Link
                      key={action.id}
                      href={action.route}
                      className="flex flex-col items-center justify-center p-4 bg-white border border-border/50 rounded-2xl shadow-sm hover:shadow-lg hover:border-vinta-purple/30 transition-all duration-300 group animate-in zoom-in-50 fill-mode-both"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`p-3 rounded-xl bg-gray-50 group-hover:bg-${colorClass.replace(
                          "text-",
                          ""
                        )}/10 transition-colors duration-300 mb-2`}
                      >
                        <span
                          className={`text-2xl group-hover:scale-110 transition-transform duration-300 block ${colorClass}`}
                        >
                          {action.icon}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-center font-semibold text-muted-foreground group-hover:text-foreground leading-tight">
                        {action.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {user && !isAdmin && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            <ReportSubmissionForm />
          </section>
        )}

        {!user && (
          <Card className="bg-gradient-to-br from-vinta-cyan to-vinta-purple border-none p-1 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-2">
                Help us improve our city
              </h3>
              <p className="text-white/80 mb-4 text-sm">
                Create an account to report local issues directly to the city.
              </p>
              <Button
                variant="secondary"
                className="w-full bg-white text-vinta-purple hover:bg-white/90 font-semibold rounded-xl shadow-md"
                as={Link}
                href="/auth/login"
              >
                Sign in
              </Button>
            </div>
          </Card>
        )}

        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1 h-6 bg-vinta-pink rounded-full"></span>
              Latest News
            </h3>
            <Link
              href="/news"
              className="text-sm text-vinta-purple hover:text-vinta-pink transition-colors font-medium flex items-center gap-1"
            >
              View all <span className="text-xs">→</span>
            </Link>
          </div>
          <NewsList maxArticles={3} />
        </section>
      </div>
    </div>
  );
}
