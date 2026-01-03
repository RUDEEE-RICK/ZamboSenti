"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Phone,
  Copy,
  Check,
  Loader2,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ShieldAlert,
  Flame,
  Ambulance,
  Siren,
  CloudLightning,
  Zap,
  HelpCircle,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { EmergencyHotline, EmergencyCategory } from "@/lib/types";
import { BARANGAYS } from "@/lib/data/barangays";

const CATEGORY_CONFIG: Record<
  EmergencyCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  police: {
    label: "Police",
    icon: ShieldAlert,
    color: "bg-blue-100 text-blue-600",
  },
  fire: {
    label: "Fire",
    icon: Flame,
    color: "bg-red-100 text-red-600",
  },
  medical: {
    label: "Medical",
    icon: Ambulance,
    color: "bg-green-100 text-green-600",
  },
  rescue: {
    label: "Rescue",
    icon: Siren,
    color: "bg-orange-100 text-orange-600",
  },
  disaster: {
    label: "Disaster Response",
    icon: CloudLightning,
    color: "bg-purple-100 text-purple-600",
  },
  utility: {
    label: "Utility",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-600",
  },
  other: {
    label: "Other",
    icon: HelpCircle,
    color: "bg-gray-100 text-gray-600",
  },
};

const CATEGORY_OPTIONS: EmergencyCategory[] = [
  "police",
  "fire",
  "medical",
  "rescue",
  "disaster",
  "utility",
  "other",
];

interface GroupedHotlines {
  category: EmergencyCategory;
  hotlines: EmergencyHotline[];
}

interface FormData {
  label: string;
  number: string;
  sim_type: string;
  barangay: string;
  category: EmergencyCategory;
}

const initialFormData: FormData = {
  label: "",
  number: "",
  sim_type: "",
  barangay: "",
  category: "other",
};

export default function EmergencyPage() {
  const [hotlines, setHotlines] = useState<EmergencyHotline[]>([]);
  const [groupedHotlines, setGroupedHotlines] = useState<GroupedHotlines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [userBarangay, setUserBarangay] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    EmergencyCategory | "all"
  >("all");

  // Admin form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAndAdmin = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("barangay, user_roles")
        .eq("id", user.id)
        .single();

      if (profile?.barangay) {
        setUserBarangay(profile.barangay);
      }
      setIsAdmin(profile?.user_roles === "admin");
    }
  }, []);



  const fetchHotlines = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("emergency_hotlines")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching hotlines:", error);
        return;
      }

      setHotlines(data || []);
    } catch (err) {
      console.error("Error fetching hotlines:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndAdmin();
    fetchHotlines();
  }, [fetchUserAndAdmin, fetchHotlines]);

  // Filter and group hotlines by category
  useEffect(() => {
    let filtered = hotlines;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (hotline) => (hotline.category || "other") === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (hotline) => {
          const category = hotline.category || "other";
          return (
            hotline.label.toLowerCase().includes(query) ||
            hotline.number.includes(query) ||
            hotline.sim_type.toLowerCase().includes(query) ||
            hotline.barangay?.toLowerCase().includes(query) ||
            CATEGORY_CONFIG[category as EmergencyCategory].label.toLowerCase().includes(query)
          );
        }
      );
    }

    // Sort: user's barangay first, then city-wide, then other barangays
    const sortedHotlines = [...filtered].sort((a, b) => {
      if (userBarangay) {
        const aInUserBarangay = a.barangay === userBarangay;
        const bInUserBarangay = b.barangay === userBarangay;
        if (aInUserBarangay && !bInUserBarangay) return -1;
        if (!aInUserBarangay && bInUserBarangay) return 1;
      }
      const aIsCityWide = a.barangay === null;
      const bIsCityWide = b.barangay === null;
      if (aIsCityWide && !bIsCityWide) return -1;
      if (!aIsCityWide && bIsCityWide) return 1;
      return 0;
    });

    // Group by category
    const categoryMap = new Map<EmergencyCategory, GroupedHotlines>();
    sortedHotlines.forEach((hotline) => {
      const category = (hotline.category || "other") as EmergencyCategory;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category: category,
          hotlines: [],
        });
      }
      categoryMap.get(category)!.hotlines.push(hotline);
    });

    const groups = Array.from(categoryMap.values()).sort((a, b) => {
      return CATEGORY_CONFIG[a.category].label.localeCompare(
        CATEGORY_CONFIG[b.category].label
      );
    });

    setGroupedHotlines(groups);
  }, [hotlines, searchQuery, userBarangay, selectedCategory]);

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleCallNumber = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, "")}`;
  };

  // Admin handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (
      !formData.label.trim() ||
      !formData.number.trim() ||
      !formData.sim_type.trim()
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("emergency_hotlines")
          .update({
            label: formData.label.trim(),
            number: formData.number.trim(),
            sim_type: formData.sim_type.trim(),
            barangay: formData.barangay || null,
            category: formData.category,
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("emergency_hotlines")
          .insert({
            label: formData.label.trim(),
            number: formData.number.trim(),
            sim_type: formData.sim_type.trim(),
            barangay: formData.barangay || null,
            category: formData.category,
          });

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      await fetchHotlines();
    } catch (err) {
      console.error("Error saving hotline:", err);
      setError(err instanceof Error ? err.message : "Failed to save hotline");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (hotline: EmergencyHotline) => {
    setFormData({
      label: hotline.label,
      number: hotline.number,
      sim_type: hotline.sim_type,
      barangay: hotline.barangay || "",
      category: hotline.category || "other",
    });
    setEditingId(hotline.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotline?")) return;

    setDeletingId(id);
    const supabase = createClient();

    try {
      const { error: deleteError } = await supabase
        .from("emergency_hotlines")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchHotlines();
    } catch (err) {
      console.error("Error deleting hotline:", err);
      setError("Failed to delete hotline");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <AppHeader title="Emergency" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header with Admin Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Emergency hotlines for Zamboanga City
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Hotline
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="rounded-full"
          >
            All
          </Button>
          {CATEGORY_OPTIONS.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full"
              >
                <config.icon className="w-3 h-3 mr-1.5" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="search"
            placeholder="Search hotlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 h-11 rounded-xl"
          />
        </div>

        {/* User Barangay Indicator */}
        {userBarangay && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4 text-primary" />
            <span>
              Showing priority contacts for{" "}
              <strong className="text-foreground">{userBarangay}</strong>
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Add/Edit Form */}
        {showForm && isAdmin && (
          <Card className="p-6 border-primary/20 bg-primary/5">
            <h3 className="font-semibold mb-4">
              {editingId ? "Edit Hotline" : "Add New Hotline"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Label *
                  </label>
                  <Input
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    placeholder="e.g., Police Hotline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number *
                  </label>
                  <Input
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    placeholder="e.g., 0912 345 6789"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    SIM Type *
                  </label>
                  <Input
                    value={formData.sim_type}
                    onChange={(e) =>
                      setFormData({ ...formData, sim_type: e.target.value })
                    }
                    placeholder="e.g., Smart, Globe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Barangay
                  </label>
                  <select
                    value={formData.barangay}
                    onChange={(e) =>
                      setFormData({ ...formData, barangay: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  >
                    <option value="">City-wide</option>
                    {BARANGAYS.map((brgy) => (
                      <option key={brgy.id} value={brgy.name}>
                        {brgy.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as EmergencyCategory })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    required
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingId ? "Update" : "Add"} Hotline
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading hotlines...</span>
            </div>
          </div>
        ) : groupedHotlines.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No hotlines found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No emergency hotlines available"}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedHotlines.map((group, groupIndex) => {
              const category = (group.category || "other") as EmergencyCategory;
              const CategoryIcon = CATEGORY_CONFIG[category].icon;
              return (
                <section key={`${category}-${groupIndex}`}>
                  {/* Category Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          CATEGORY_CONFIG[category].color
                        }`}
                      >
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {CATEGORY_CONFIG[category].label}
                      </h3>
                    </div>
                  </div>

                  {/* Hotlines List */}
                  <div className="space-y-2">
                    {group.hotlines.map((hotline) => (
                    <Card
                      key={hotline.id}
                      className={`overflow-hidden border-gray-100 card-hover ${
                        userBarangay && hotline.barangay === userBarangay
                          ? "ring-2 ring-primary/20 bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {hotline.label}
                            </span>
                            {hotline.barangay && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {hotline.barangay}
                              </span>
                            )}
                            {userBarangay &&
                              hotline.barangay === userBarangay && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                  Your Area
                                </span>
                              )}
                          </div>
                          <span className="text-lg font-bold text-foreground tracking-wide">
                            {hotline.number}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({hotline.sim_type})
                          </span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 rounded-xl border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors"
                            onClick={() => handleCallNumber(hotline.number)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 rounded-xl border-gray-200 hover:bg-gray-100 transition-colors"
                            onClick={() => handleCopyNumber(hotline.number)}
                          >
                            {copiedNumber === hotline.number ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Admin Actions */}
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(hotline)}
                                className="h-10 w-10 rounded-xl"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(hotline.id)}
                                disabled={deletingId === hotline.id}
                                className="h-10 w-10 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                              >
                                {deletingId === hotline.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
