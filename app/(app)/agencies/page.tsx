"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Check,
  Building2,
  Heart,
  Truck,
  Scale,
  Landmark,
  Users,
  HelpCircle,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Agency, AgencyCategory } from "@/lib/types";

const CATEGORY_CONFIG: Record<
  AgencyCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  healthcare: {
    label: "Healthcare",
    icon: Heart,
    color: "bg-rose-100 text-rose-600",
  },
  transport: {
    label: "Transport",
    icon: Truck,
    color: "bg-amber-100 text-amber-600",
  },
  finance: {
    label: "Finance",
    icon: Building2,
    color: "bg-emerald-100 text-emerald-600",
  },
  legal: {
    label: "Legal",
    icon: Scale,
    color: "bg-violet-100 text-violet-600",
  },
  government: {
    label: "Government",
    icon: Landmark,
    color: "bg-primary/10 text-primary",
  },
  social_services: {
    label: "Social Services",
    icon: Users,
    color: "bg-cyan-100 text-cyan-600",
  },
  other: {
    label: "Other",
    icon: HelpCircle,
    color: "bg-gray-100 text-gray-600",
  },
};

const CATEGORY_OPTIONS: AgencyCategory[] = [
  "healthcare",
  "transport",
  "finance",
  "legal",
  "government",
  "social_services",
  "other",
];

interface AgencyFormData {
  name: string;
  description: string;
  external_link: string;
  category: AgencyCategory;
}

const initialFormData: AgencyFormData = {
  name: "",
  description: "",
  external_link: "",
  category: "government",
};

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    AgencyCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgencyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAgencies = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("agencies")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setAgencies(data || []);
    } catch (err) {
      console.error("Error fetching agencies:", err);
      setError("Failed to load agencies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAdminStatus = useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.user_roles === "admin");
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    fetchAgencies();
    checkAdminStatus();
  }, [fetchAgencies, checkAdminStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    try {
      if (editingId) {
        // Update existing agency
        const { error: updateError } = await supabase
          .from("agencies")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            external_link: formData.external_link.trim(),
            category: formData.category,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        // Create new agency
        const { error: insertError } = await supabase.from("agencies").insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          external_link: formData.external_link.trim(),
          category: formData.category,
        });

        if (insertError) throw insertError;
      }

      // Reset form and refresh
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      await fetchAgencies();
    } catch (err) {
      console.error("Error saving agency:", err);
      setError(err instanceof Error ? err.message : "Failed to save agency");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (agency: Agency) => {
    setFormData({
      name: agency.name,
      description: agency.description,
      external_link: agency.external_link,
      category: agency.category,
    });
    setEditingId(agency.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agency?")) return;

    setDeletingId(id);
    const supabase = createClient();

    try {
      const { error: deleteError } = await supabase
        .from("agencies")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchAgencies();
    } catch (err) {
      console.error("Error deleting agency:", err);
      setError("Failed to delete agency");
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

  const filteredAgencies = agencies.filter((agency) => {
    // Filter by category
    const matchesCategory =
      selectedCategory === "all" || agency.category === selectedCategory;

    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group agencies by category
  const groupedAgencies = filteredAgencies.reduce((acc, agency) => {
    if (!acc[agency.category]) {
      acc[agency.category] = [];
    }
    acc[agency.category].push(agency);
    return acc;
  }, {} as Record<AgencyCategory, Agency[]>);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <AppHeader title="Government Agencies" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Page Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Quick access to official government agency websites and services.
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Agency
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
              {editingId ? "Edit Agency" : "Add New Agency"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Agency name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the agency"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  External Link *
                </label>
                <Input
                  type="url"
                  value={formData.external_link}
                  onChange={(e) =>
                    setFormData({ ...formData, external_link: e.target.value })
                  }
                  placeholder="https://example.gov.ph"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as AgencyCategory,
                    })
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
                      {editingId ? "Update" : "Add"} Agency
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
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading agencies...
            </span>
          </div>
        ) : filteredAgencies.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No agencies found</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCategory !== "all"
                ? "No agencies in this category yet."
                : "No agencies have been added yet."}
            </p>
          </Card>
        ) : (
          /* Agencies List - Grouped by Category */
          <div className="space-y-6">
            {Object.entries(groupedAgencies).map(
              ([category, categoryAgencies]) => {
                const config = CATEGORY_CONFIG[category as AgencyCategory];
                const IconComponent = config.icon;

                return (
                  <div key={category} className="space-y-2">
                    {/* Category Header */}
                    {selectedCategory === "all" && (
                      <div className="flex items-center gap-2 px-1">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center ${config.color}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          {config.label}
                        </h2>
                      </div>
                    )}

                    {/* Agency Cards */}
                    {categoryAgencies.map((agency) => {
                      const agencyConfig = CATEGORY_CONFIG[agency.category];
                      const AgencyIcon = agencyConfig.icon;

                      return (
                        <Card
                          key={agency.id}
                          className="p-4 card-hover border-gray-100"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${agencyConfig.color}`}
                            >
                              <AgencyIcon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                                  {agency.name}
                                </h3>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${agencyConfig.color}`}
                                >
                                  {agencyConfig.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {agency.description}
                              </p>
                              <a
                                href={agency.external_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Visit Website
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Admin Actions */}
                            {isAdmin && (
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(agency)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(agency.id)}
                                  disabled={deletingId === agency.id}
                                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                                >
                                  {deletingId === agency.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
