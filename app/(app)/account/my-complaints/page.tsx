"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  MapPin,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COMPLAINT_CATEGORIES } from "@/lib/constants/complaint-constants";
import { BARANGAYS } from "@/lib/data/barangays";

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  location: string;
  barangay: string | null;
  is_anonymous: boolean;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "solved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export default function MyComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");
  const [selectedBarangay, setSelectedBarangay] = useState<string | "all">("all");
  const [groupBy, setGroupBy] = useState<"none" | "barangay">("none");

  const fetchUserComplaints = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      const userIsAdmin = profile?.user_roles === "admin";
      setIsAdmin(userIsAdmin);

      // Redirect admins to admin complaints page
      if (userIsAdmin) {
        router.push("/admin/complaints");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select(
          "id, title, category, status, created_at, updated_at, location, barangay, is_anonymous"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setComplaints(data || []);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch complaints"
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserComplaints();
  }, [fetchUserComplaints]);

  // Filter complaints based on all criteria
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      searchQuery === "" ||
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || complaint.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || complaint.status === selectedStatus;

    const matchesBarangay =
      selectedBarangay === "all" || complaint.barangay === selectedBarangay;

    return matchesSearch && matchesCategory && matchesStatus && matchesBarangay;
  });

  // Group by barangay if enabled
  const groupedComplaints =
    groupBy === "barangay"
      ? filteredComplaints.reduce((acc, complaint) => {
          const barangayKey = complaint.barangay || "Unspecified";
          if (!acc[barangayKey]) {
            acc[barangayKey] = [];
          }
          acc[barangayKey].push(complaint);
          return acc;
        }, {} as Record<string, Complaint[]>)
      : { All: filteredComplaints };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="My Complaints" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading complaints...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <AppHeader title="My Complaints" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => router.push("/account")}
                className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Account
              </button>
              <p className="text-sm text-muted-foreground">
                Track the status of your submitted complaints
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/report")}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search complaints by title, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="rounded-full h-8 text-xs"
                >
                  All
                </Button>
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-full h-8 text-xs"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Status and Barangay Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus("all")}
                  className="rounded-full h-8 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={selectedStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus("pending")}
                  className="rounded-full h-8 text-xs"
                >
                  Pending
                </Button>
                <Button
                  variant={selectedStatus === "processing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus("processing")}
                  className="rounded-full h-8 text-xs"
                >
                  Processing
                </Button>
                <Button
                  variant={selectedStatus === "solved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus("solved")}
                  className="rounded-full h-8 text-xs"
                >
                  Solved
                </Button>
                <Button
                  variant={selectedStatus === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus("rejected")}
                  className="rounded-full h-8 text-xs"
                >
                  Rejected
                </Button>
              </div>
            </div>

            {/* Barangay Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Barangay
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 rounded-full border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">All Barangays</option>
                  {BARANGAYS.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group By Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Group by:</span>
              <Button
                variant={groupBy === "none" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupBy("none")}
                className="rounded-full h-7 text-xs"
              >
                None
              </Button>
              <Button
                variant={groupBy === "barangay" ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupBy("barangay")}
                className="rounded-full h-7 text-xs"
              >
                Barangay
              </Button>
            </div>
            {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedBarangay !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedBarangay("all");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven&apos;t submitted any complaints yet. If you notice an
              issue, please report it.
            </p>
            <Button
              onClick={() => router.push("/report")}
              className="bg-primary hover:bg-primary/90"
            >
              Submit a Report
            </Button>
          </Card>
        ) : filteredComplaints.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No complaints match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSelectedBarangay("all");
              }}
            >
              Clear filters
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedComplaints).map(([groupKey, groupComplaints]) => (
              <div key={groupKey} className="space-y-3">
                {/* Group Header */}
                {groupBy === "barangay" && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h2 className="font-semibold text-sm text-foreground">
                        {groupKey}
                      </h2>
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-muted-foreground">
                      {groupComplaints.length} {groupComplaints.length === 1 ? "complaint" : "complaints"}
                    </span>
                  </div>
                )}

                {/* Complaint Cards */}
                {groupComplaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="p-4 card-hover border-gray-100 cursor-pointer transition-all hover:shadow-md"
                    onClick={() =>
                      router.push(`/account/my-complaints/${complaint.id}`)
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-foreground">
                            {complaint.title}
                          </h3>
                          <Badge
                            className={`${getStatusStyles(
                              complaint.status
                            )} text-xs capitalize`}
                          >
                            {complaint.status}
                          </Badge>
                          {complaint.is_anonymous && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              Anonymous
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {complaint.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {complaint.location}
                          </span>
                          {complaint.barangay && groupBy !== "barangay" && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {complaint.barangay}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(complaint.created_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
