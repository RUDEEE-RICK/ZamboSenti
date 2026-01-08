"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, type SelectOption } from "@/components/headless/Select";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { BARANGAYS } from "@/lib/data/barangays";
import { COMPLAINT_CATEGORIES } from "@/lib/constants/complaint-constants";

interface Complaint {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  barangay: string | null;
  status: string;
  created_at: string;
  user_id: string;
  is_anonymous: boolean;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  profiles: {
    name: string;
  };
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "solved", label: "Solved" },
  { value: "rejected", label: "Rejected" },
];

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

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState<string | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");
  const [groupBy, setGroupBy] = useState<"none" | "barangay">("none");

  // Options for Select components
  const categoryOptions: SelectOption[] = [
    { id: "all", name: "All Categories" },
    ...COMPLAINT_CATEGORIES.map(cat => ({ id: cat, name: cat }))
  ];

  const statusOptions: SelectOption[] = [
    { id: "all", name: "All Status" },
    { id: "pending", name: "Pending" },
    { id: "processing", name: "Processing" },
    { id: "solved", name: "Solved" },
    { id: "rejected", name: "Rejected" }
  ];

  const checkAdminAndFetchComplaints = useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.user_roles !== "admin") {
        setIsAdmin(false);
        setError("Access denied. You do not have admin privileges.");
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchComplaints();
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAndFetchComplaints();
  }, [checkAdminAndFetchComplaints]);

  const fetchComplaints = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: complaintsData, error: fetchError } = await supabase
        .from("complaints")
        .select(
          "id, title, content, category, location, barangay, status, created_at, user_id, is_anonymous, guest_name, guest_phone, guest_email"
        )
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!complaintsData || complaintsData.length === 0) {
        setComplaints([]);
        return;
      }

      const userIds = [...new Set(complaintsData.map((c) => c.user_id).filter((id): id is string => id !== null))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
      const complaintsWithProfiles = complaintsData.map((complaint) => ({
        ...complaint,
        profiles: profilesMap.get(complaint.user_id) || { name: "" },
      }));

      setComplaints(complaintsWithProfiles);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch complaints"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBarangay =
      selectedBarangay === "all" || c.barangay === selectedBarangay;

    const matchesCategory =
      selectedCategory === "all" || c.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || c.status === selectedStatus;

    return matchesSearch && matchesBarangay && matchesCategory && matchesStatus;
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
      <div className="min-h-screen">
        <AppHeader title="Complaints Management" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen">
        <AppHeader title="Access Denied" showNotifications={false} />
        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="p-6 border-rose-200 bg-rose-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-rose-900 mb-1">
                  Access Denied
                </h3>
                <p className="text-sm text-rose-700 mb-4">
                  You do not have permission to access this page.
                </p>
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  size="sm"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-950/20">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complaints Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all citizen complaints
          </p>
        </div>

        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => router.push("/account")}
                className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Account
              </button>
            </div>

            <div className="flex gap-3">
              <Card className="px-4 py-2.5">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{filteredComplaints.length}</p>
              </Card>
              <Card className="px-4 py-2.5 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-700">Pending</p>
                <p className="text-xl font-bold text-amber-800">
                  {filteredComplaints.filter((c) => c.status === "pending").length}
                </p>
              </Card>
              <Card className="px-4 py-2.5 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-700">Processing</p>
                <p className="text-xl font-bold text-blue-800">
                  {filteredComplaints.filter((c) => c.status === "processing").length}
                </p>
              </Card>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search complaints by title, category, location, or content..."
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

          {/* Category Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Category
            </label>
            {/* Desktop: Buttons */}
            <div className="hidden sm:flex flex-wrap gap-2">
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
            {/* Mobile: Dropdown */}
            <div className="sm:hidden">
              <Select
                value={categoryOptions.find(opt => opt.id === selectedCategory) || null}
                onChange={(option) => setSelectedCategory(option.id as string | "all")}
                options={categoryOptions}
                placeholder="Select category"
              />
            </div>
          </div>

          {/* Status and Barangay Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Status
              </label>
              {/* Desktop: Buttons */}
              <div className="hidden sm:flex flex-wrap gap-2">
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
              {/* Mobile: Dropdown */}
              <div className="sm:hidden">
                <Select
                  value={statusOptions.find(opt => opt.id === selectedStatus) || null}
                  onChange={(option) => setSelectedStatus(option.id as string | "all")}
                  options={statusOptions}
                  placeholder="Select status"
                />
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

          {/* Group By Toggle and Clear Filters */}
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

        {/* Error Message */}
        {error && (
          <Card className="border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No complaints found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedBarangay !== "all"
                ? "Try adjusting your search or filter criteria."
                : "When citizens submit complaints, they will appear here."}
            </p>
            {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedBarangay !== "all") && (
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
            )}
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
                    onClick={() => router.push(`/admin/complaints/${complaint.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium text-foreground">
                            {complaint.title}
                          </h4>
                          <Badge
                            className={`${getStatusStyles(
                              complaint.status
                            )} text-xs uppercase`}
                          >
                            {complaint.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {complaint.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {complaint.category}
                          </span>
                          {complaint.barangay && groupBy !== "barangay" && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
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
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {complaint.is_anonymous ? (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                Anonymous
                              </span>
                            ) : complaint.guest_name ? (
                              <span className="inline-flex items-center gap-1 text-purple-600">
                                {complaint.guest_name} (Guest)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                {complaint.profiles?.name || "Unknown"} 
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/complaints/${complaint.id}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
