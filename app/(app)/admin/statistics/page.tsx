"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Users,
  Building2,
  Phone,
  Newspaper,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChartIcon,
  Activity,
  MapPin,
  Calendar,
  Target,
  Zap,
  Award,
  AlertCircle,
  Eye,
  UserCheck,
  Timer,
  Layers,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Line,
} from "recharts";

interface ComplaintStats {
  total: number;
  pending: number;
  processing: number;
  solved: number;
  rejected: number;
  anonymous: number;
  byCategory: {
    name: string;
    value: number;
    pending: number;
    solved: number;
  }[];
  byBarangay: {
    name: string;
    total: number;
    pending: number;
    processing: number;
    solved: number;
  }[];
  byMonth: {
    name: string;
    complaints: number;
    solved: number;
    pending: number;
  }[];
  byDayOfWeek: { name: string; value: number }[];
  byHour: { hour: string; value: number }[];
  recentTrend: "up" | "down" | "stable";
  trendPercentage: number;
  resolutionRate: number;
  avgResolutionDays: number;
  todayComplaints: number;
  thisWeekComplaints: number;
  thisMonthComplaints: number;
  peakDay: string;
  peakHour: string;
  mostActiveBarangay: string;
  mostCommonCategory: string;
}

interface SystemStats {
  totalUsers: number;
  totalAgencies: number;
  totalHotlines: number;
  totalArticles: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  userGrowthRate: number;
  complaintPerUser: number;
}

interface UserDemographics {
  byGender: { name: string; value: number }[];
  byBarangay: { name: string; value: number }[];
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#06b6d4",
  "#84cc16",
  "#eab308",
  "#ef4444",
  "#64748b",
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  solved: "#22c55e",
  rejected: "#ef4444",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminStatisticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [complaintStats, setComplaintStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    processing: 0,
    solved: 0,
    rejected: 0,
    anonymous: 0,
    byCategory: [],
    byBarangay: [],
    byMonth: [],
    byDayOfWeek: [],
    byHour: [],
    recentTrend: "stable",
    trendPercentage: 0,
    resolutionRate: 0,
    avgResolutionDays: 0,
    todayComplaints: 0,
    thisWeekComplaints: 0,
    thisMonthComplaints: 0,
    peakDay: "",
    peakHour: "",
    mostActiveBarangay: "",
    mostCommonCategory: "",
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAgencies: 0,
    totalHotlines: 0,
    totalArticles: 0,
    newUsersThisMonth: 0,
    newUsersThisWeek: 0,
    userGrowthRate: 0,
    complaintPerUser: 0,
  });
  const [userDemographics, setUserDemographics] = useState<UserDemographics>({
    byGender: [],
    byBarangay: [],
  });

  const fetchStatistics = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      // Check if user is admin
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      if (profileData?.user_roles !== "admin") {
        setIsAdmin(false);
        router.push("/");
        return;
      }

      setIsAdmin(true);

      // Fetch all complaints with full details
      const { data: complaints } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all profiles for demographics
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, gender, barangay, created_at");

      if (complaints) {
        const now = new Date();
        const total = complaints.length;
        const pending = complaints.filter((c) => c.status === "pending").length;
        const processing = complaints.filter(
          (c) => c.status === "processing"
        ).length;
        const solved = complaints.filter((c) => c.status === "solved").length;
        const rejected = complaints.filter(
          (c) => c.status === "rejected"
        ).length;
        const anonymous = complaints.filter(
          (c) => c.is_anonymous === true
        ).length;

        // Today's complaints
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayComplaints = complaints.filter(
          (c) => new Date(c.created_at) >= today
        ).length;

        // This week's complaints
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const thisWeekComplaints = complaints.filter(
          (c) => new Date(c.created_at) >= weekStart
        ).length;

        // This month's complaints
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthComplaints = complaints.filter(
          (c) => new Date(c.created_at) >= monthStart
        ).length;

        // Group by category with status breakdown
        const categoryMap = new Map<
          string,
          { total: number; pending: number; solved: number }
        >();
        complaints.forEach((c) => {
          const cat = c.category || "Other";
          const existing = categoryMap.get(cat) || {
            total: 0,
            pending: 0,
            solved: 0,
          };
          existing.total++;
          if (c.status === "pending") existing.pending++;
          if (c.status === "solved") existing.solved++;
          categoryMap.set(cat, existing);
        });
        const byCategory = Array.from(categoryMap.entries())
          .map(([name, stats]) => ({
            name,
            value: stats.total,
            pending: stats.pending,
            solved: stats.solved,
          }))
          .sort((a, b) => b.value - a.value);

        // Group by barangay with status breakdown - FIXED: using 'barangay' field instead of 'location'
        const barangayMap = new Map<
          string,
          { total: number; pending: number; processing: number; solved: number }
        >();
        complaints.forEach((c) => {
          const brgy = c.barangay || "Unspecified";
          const existing = barangayMap.get(brgy) || {
            total: 0,
            pending: 0,
            processing: 0,
            solved: 0,
          };
          existing.total++;
          if (c.status === "pending") existing.pending++;
          if (c.status === "processing") existing.processing++;
          if (c.status === "solved") existing.solved++;
          barangayMap.set(brgy, existing);
        });
        const byBarangay = Array.from(barangayMap.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 15);

        // Group by month (last 12 months for better trend)
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            name: date.toLocaleString("default", { month: "short" }),
          });
        }

        const byMonth = months.map((m) => {
          const monthComplaints = complaints.filter((c) => {
            const d = new Date(c.created_at);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
          });
          const monthSolved = monthComplaints.filter(
            (c) => c.status === "solved"
          ).length;
          const monthPending = monthComplaints.filter(
            (c) => c.status === "pending"
          ).length;
          return {
            name: m.name,
            complaints: monthComplaints.length,
            solved: monthSolved,
            pending: monthPending,
          };
        });

        // Group by day of week
        const dayOfWeekMap = new Map<number, number>();
        for (let i = 0; i < 7; i++) dayOfWeekMap.set(i, 0);
        complaints.forEach((c) => {
          const day = new Date(c.created_at).getDay();
          dayOfWeekMap.set(day, (dayOfWeekMap.get(day) || 0) + 1);
        });
        const byDayOfWeek = Array.from(dayOfWeekMap.entries())
          .map(([day, value]) => ({ name: DAY_NAMES[day], value }))
          .sort(
            (a, b) => DAY_NAMES.indexOf(a.name) - DAY_NAMES.indexOf(b.name)
          );

        // Group by hour
        const hourMap = new Map<number, number>();
        for (let i = 0; i < 24; i++) hourMap.set(i, 0);
        complaints.forEach((c) => {
          const hour = new Date(c.created_at).getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });
        const byHour = Array.from(hourMap.entries())
          .map(([hour, value]) => ({
            hour: `${hour.toString().padStart(2, "0")}:00`,
            value,
          }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

        // Calculate trend
        const lastMonth = byMonth[byMonth.length - 1]?.complaints || 0;
        const prevMonth = byMonth[byMonth.length - 2]?.complaints || 0;
        const recentTrend: "up" | "down" | "stable" =
          lastMonth > prevMonth
            ? "up"
            : lastMonth < prevMonth
            ? "down"
            : "stable";
        const trendPercentage =
          prevMonth > 0
            ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100)
            : 0;

        // Resolution rate
        const resolutionRate =
          total > 0 ? Math.round((solved / total) * 100) : 0;

        // Calculate average resolution time
        let totalDays = 0;
        let solvedCount = 0;
        complaints.forEach((c) => {
          if (c.status === "solved" && c.updated_at) {
            const created = new Date(c.created_at);
            const updated = new Date(c.updated_at);
            const days =
              (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            totalDays += days;
            solvedCount++;
          }
        });
        const avgResolutionDays =
          solvedCount > 0 ? Math.round((totalDays / solvedCount) * 10) / 10 : 0;

        // Peak day
        const peakDayData = byDayOfWeek.reduce(
          (max, curr) => (curr.value > max.value ? curr : max),
          byDayOfWeek[0]
        );
        const peakDay = peakDayData?.name || "";

        // Peak hour
        const peakHourData = byHour.reduce(
          (max, curr) => (curr.value > max.value ? curr : max),
          byHour[0]
        );
        const peakHour = peakHourData?.hour || "";

        // Most active barangay
        const mostActiveBarangay = byBarangay[0]?.name || "";

        // Most common category
        const mostCommonCategory = byCategory[0]?.name || "";

        setComplaintStats({
          total,
          pending,
          processing,
          solved,
          rejected,
          anonymous,
          byCategory,
          byBarangay,
          byMonth,
          byDayOfWeek,
          byHour,
          recentTrend,
          trendPercentage,
          resolutionRate,
          avgResolutionDays,
          todayComplaints,
          thisWeekComplaints,
          thisMonthComplaints,
          peakDay,
          peakHour,
          mostActiveBarangay,
          mostCommonCategory,
        });
      }

      // Process user demographics
      if (profiles) {
        const genderMap = new Map<string, number>();
        const userBarangayMap = new Map<string, number>();

        profiles.forEach((p) => {
          const gender = p.gender || "Not Specified";
          genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

          const brgy = p.barangay || "Not Specified";
          userBarangayMap.set(brgy, (userBarangayMap.get(brgy) || 0) + 1);
        });

        setUserDemographics({
          byGender: Array.from(genderMap.entries())
            .map(([name, value]) => ({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              value,
            }))
            .sort((a, b) => b.value - a.value),
          byBarangay: Array.from(userBarangayMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10),
        });
      }

      // Fetch system stats
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: agenciesCount } = await supabase
        .from("agencies")
        .select("*", { count: "exact", head: true });

      const { count: hotlinesCount } = await supabase
        .from("emergency_hotlines")
        .select("*", { count: "exact", head: true });

      const { count: articlesCount } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      // New users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersMonthCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      // New users this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { count: newUsersWeekCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfWeek.toISOString());

      // Calculate growth rate
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      lastMonthStart.setHours(0, 0, 0, 0);

      const lastMonthEnd = new Date(startOfMonth);
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

      const { count: lastMonthUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      const userGrowthRate =
        (lastMonthUsersCount || 0) > 0
          ? Math.round(
              (((newUsersMonthCount || 0) - (lastMonthUsersCount || 0)) /
                (lastMonthUsersCount || 1)) *
                100
            )
          : 0;

      // Complaints per user
      const complaintPerUser =
        (usersCount || 0) > 0
          ? Math.round(((complaints?.length || 0) / (usersCount || 1)) * 100) /
            100
          : 0;

      setSystemStats({
        totalUsers: usersCount || 0,
        totalAgencies: agenciesCount || 0,
        totalHotlines: hotlinesCount || 0,
        totalArticles: articlesCount || 0,
        newUsersThisMonth: newUsersMonthCount || 0,
        newUsersThisWeek: newUsersWeekCount || 0,
        userGrowthRate,
        complaintPerUser,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Admin Statistics" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading statistics...</span>
            <span className="text-xs text-muted-foreground">
              Analyzing platform data
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  const statusData = [
    {
      name: "Pending",
      value: complaintStats.pending,
      color: STATUS_COLORS.pending,
    },
    {
      name: "Processing",
      value: complaintStats.processing,
      color: STATUS_COLORS.processing,
    },
    {
      name: "Solved",
      value: complaintStats.solved,
      color: STATUS_COLORS.solved,
    },
    {
      name: "Rejected",
      value: complaintStats.rejected,
      color: STATUS_COLORS.rejected,
    },
  ];

  const resolutionRadialData = [
    {
      name: "Resolution Rate",
      value: complaintStats.resolutionRate,
      fill: "#22c55e",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            System Statistics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics dashboard for ZamSolucion platform
          </p>
        </div>

        <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/account")}
              className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatistics}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white px-3 py-1.5 rounded-full border border-gray-100">
              <Calendar className="w-3.5 h-3.5" />
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-4 border-gray-100 bg-gradient-to-br from-white to-indigo-50/30">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Today
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {complaintStats.todayComplaints}
            </p>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-br from-white to-violet-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                This Week
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {complaintStats.thisWeekComplaints}
            </p>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-br from-white to-pink-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-pink-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                This Month
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {complaintStats.thisMonthComplaints}
            </p>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-br from-white to-amber-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Anonymous
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {complaintStats.anonymous}
            </p>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-br from-white to-emerald-50/30">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Avg Resolution
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {complaintStats.avgResolutionDays}d
            </p>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-br from-white to-cyan-50/30">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-cyan-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Per User
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {systemStats.complaintPerUser}
            </p>
          </Card>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 border-gray-100 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {complaintStats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              {complaintStats.recentTrend === "up" ? (
                <>
                  <TrendingUp className="w-3 h-3 text-rose-500" />
                  <span className="text-rose-600 font-medium">
                    +{complaintStats.trendPercentage}%
                  </span>
                </>
              ) : complaintStats.recentTrend === "down" ? (
                <>
                  <TrendingDown className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">
                    {complaintStats.trendPercentage}%
                  </span>
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500 font-medium">Stable</span>
                </>
              )}
              <span className="text-gray-400 ml-1">vs last month</span>
            </div>
          </Card>

          <Card className="p-5 border-gray-100 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Resolution Rate
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {complaintStats.resolutionRate}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${complaintStats.resolutionRate}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-gray-100 bg-gradient-to-br from-white to-amber-50/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {complaintStats.pending}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-blue-600 font-medium">
                {complaintStats.processing} processing
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-rose-600 font-medium">
                {complaintStats.rejected} rejected
              </span>
            </div>
          </Card>

          <Card className="p-5 border-gray-100 bg-gradient-to-br from-white to-violet-50/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {systemStats.totalUsers}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              <span className="text-emerald-600 font-medium">
                +{systemStats.newUsersThisWeek} this week
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-primary font-medium">
                +{systemStats.newUsersThisMonth} this month
              </span>
            </div>
          </Card>
        </div>

        {/* Key Insights */}
        <Card className="p-5 border-gray-100 bg-gradient-to-r from-primary/5 to-violet-500/5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Key Insights
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-white border border-gray-100">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Peak Day
              </p>
              <p className="font-semibold text-foreground">
                {complaintStats.peakDay || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-100">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Peak Hour
              </p>
              <p className="font-semibold text-foreground">
                {complaintStats.peakHour || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-100">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Most Active Area
              </p>
              <p className="font-semibold text-foreground truncate">
                {complaintStats.mostActiveBarangay || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-100">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Top Category
              </p>
              <p className="font-semibold text-foreground truncate">
                {complaintStats.mostCommonCategory || "N/A"}
              </p>
            </div>
          </div>
        </Card>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                12-Month Complaint Trend
              </h3>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={complaintStats.byMonth}>
                  <defs>
                    <linearGradient
                      id="colorComplaints"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorComplaints)"
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="solved"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Solved"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Pending"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-primary" />
                Status Distribution
              </h3>
            </div>
            <div className="h-[280px] flex items-center">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 pr-4 min-w-[120px]">
                {statusData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 - Day & Hour Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week Analysis */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Complaints by Day of Week
              </h3>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintStats.byDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Complaints"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Hour Analysis */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Complaints by Hour (24h)
              </h3>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complaintStats.byHour}>
                  <defs>
                    <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#colorHour)"
                    name="Complaints"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Charts Row 3 - Category & Barangay */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Complaints by Category
              </h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complaintStats.byCategory}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    width={95}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                    name="Total"
                  />
                  <Bar
                    dataKey="pending"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                    name="Pending"
                  />
                  <Bar
                    dataKey="solved"
                    fill="#22c55e"
                    radius={[0, 4, 4, 0]}
                    name="Solved"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Barangay Distribution */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Top Barangays by Complaints
              </h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintStats.byBarangay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="pending"
                    stackId="a"
                    fill="#f59e0b"
                    name="Pending"
                  />
                  <Bar
                    dataKey="processing"
                    stackId="a"
                    fill="#3b82f6"
                    name="Processing"
                  />
                  <Bar
                    dataKey="solved"
                    stackId="a"
                    fill="#22c55e"
                    name="Solved"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* User Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender Distribution */}
          <Card className="p-5 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                User Gender Distribution
              </h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDemographics.byGender}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                  >
                    {userDemographics.byGender.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Users by Barangay */}
          <Card className="p-5 border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Users by Barangay (Top 10)
              </h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userDemographics.byBarangay}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    width={95}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    name="Users"
                  >
                    {userDemographics.byBarangay.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`rgba(139, 92, 246, ${1 - index * 0.08})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* System Resources */}
        <Card className="p-5 border-gray-100">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Platform Resources
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {systemStats.totalAgencies}
                  </p>
                  <p className="text-xs text-emerald-600/70">Agencies</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-700">
                    {systemStats.totalHotlines}
                  </p>
                  <p className="text-xs text-rose-600/70">Hotlines</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {systemStats.totalArticles}
                  </p>
                  <p className="text-xs text-blue-600/70">Articles</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-700">
                    {systemStats.totalUsers}
                  </p>
                  <p className="text-xs text-violet-600/70">Users</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-gray-100 bg-gradient-to-r from-amber-50 to-amber-100/30">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900 text-sm">
                  Needs Attention
                </h4>
                <p className="text-xs text-amber-700/70 mt-0.5">
                  {complaintStats.pending} complaints awaiting review
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 px-2"
                  onClick={() =>
                    router.push("/admin/complaints?status=pending")
                  }
                >
                  View Pending →
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/30">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 text-sm">
                  In Progress
                </h4>
                <p className="text-xs text-blue-700/70 mt-0.5">
                  {complaintStats.processing} complaints being processed
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2"
                  onClick={() =>
                    router.push("/admin/complaints?status=processing")
                  }
                >
                  View Processing →
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-gray-100 bg-gradient-to-r from-emerald-50 to-emerald-100/30">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-emerald-900 text-sm">
                  Resolved
                </h4>
                <p className="text-xs text-emerald-700/70 mt-0.5">
                  {complaintStats.solved} complaints successfully resolved
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 px-2"
                  onClick={() => router.push("/admin/complaints?status=solved")}
                >
                  View Resolved →
                </Button>
              </div>
            </div>
          </Card>
        </div>
        </div>
      </main>
    </div>
  );
}
