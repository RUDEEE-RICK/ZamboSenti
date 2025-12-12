"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  User,
  Tag,
  FileText,
  CheckCircle2,
  Mail,
  House,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Complaint {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    address: string;
    name: string;
    email: string;
    contact_number: string;
  };
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: "⏳" },
  { value: "processing", label: "Processing", icon: "🔄" },
  { value: "solved", label: "Solved", icon: "✓" },
  { value: "rejected", label: "Rejected", icon: "✕" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-900 border-yellow-200 hover:bg-yellow-100",
  processing: "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100",
  solved: "bg-green-50 text-green-900 border-green-200 hover:bg-green-100",
  rejected: "bg-red-50 text-red-900 border-red-200 hover:bg-red-100",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  solved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const checkAdminAndFetchComplaint = useCallback(async () => {
    const supabase = createClient();

    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      // Check if user is admin
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
      await fetchComplaint();
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId, router]);

  useEffect(() => {
    checkAdminAndFetchComplaint();
  }, [checkAdminAndFetchComplaint]);

  const fetchComplaint = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      // Fetch complaint details
      const { data: complaintData, error: fetchError } = await supabase
        .from("complaints")
        .select(
          "id, title, content, category, location, status, created_at, updated_at, user_id"
        )
        .eq("id", complaintId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Fetch user profile separately
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, email, contact_number, address")
        .eq("id", complaintData.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // Combine the data
      const combinedData = {
        ...complaintData,
        profiles: profileData || {
          name: "",
          email: "",
          contact_number: "",
          address: "",
        },
      };

      setComplaint(combinedData);

      // Fetch associated images
      const { data: pictureLinks, error: pictureError } = await supabase
        .from("complaint_pictures")
        .select(
          `
                    picture_id,
                    pictures (
                        image_path
                    )
                    `
        )
        .eq("complaint_id", complaintId);

      if (!pictureError && pictureLinks) {
        // Simply use the image paths stored in the database as URLs
        const imageUrls = pictureLinks
          .map((link: any) => link.pictures?.image_path)
          .filter(Boolean);

        setImages(imageUrls);
      }
    } catch (err) {
      console.error("Error fetching complaint:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch complaint details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateComplaintStatus = async (newStatus: string) => {
    if (!complaint) return;

    const supabase = createClient();
    setUpdatingStatus(true);

    try {
      const { error: updateError } = await supabase
        .from("complaints")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", complaint.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setComplaint({ ...complaint, status: newStatus });
    } catch (err) {
      console.error("Error updating complaint status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Complaint Details" showNotifications={false} />
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-lg">Loading complaint details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Access Denied" showNotifications={false} />
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Access Denied
                </h3>
                <p className="text-red-700 mb-4">
                  You do not have permission to access this page. Admin
                  privileges are required.
                </p>
                <Button onClick={() => router.push("/")} variant="outline">
                  Go to Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Complaint Not Found" showNotifications={false} />
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Complaint Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The complaint you're looking for doesn't exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/admin/complaints")}>
              Back to Complaints
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <AppHeader title="Complaint Details" showNotifications={false} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/complaints")}
          className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </button>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {complaint.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {complaint.profiles?.name || "Unknown User"}
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{complaint.profiles?.email || "N/A"}</span>
                    <span> •</span>
                  </div>
                  {complaint.profiles?.contact_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{complaint.profiles.contact_number}</span>
                    </div>
                  )}
                  <br />
                  <div className="flex items-center gap-1">
                    <House className="w-4 h-4 inline-block mr-1" />
                    <span>{complaint.profiles?.address || "N/A"}</span>
                  </div>
                </div>
              </div>
              <Badge
                className={`${
                  STATUS_BADGE_COLORS[complaint.status]
                } border font-medium text-base px-4 py-2`}
              >
                {STATUS_OPTIONS.find((s) => s.value === complaint.status)?.icon}{" "}
                {complaint.status.charAt(0).toUpperCase() +
                  complaint.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  Submitted:{" "}
                  {new Date(complaint.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {complaint.updated_at &&
                complaint.updated_at !== complaint.created_at && (
                  <>
                    <span>•</span>
                    <span>
                      Updated:{" "}
                      {new Date(complaint.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </>
                )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6">
            {/* Category and Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-secondary/20">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="w-4 h-4" />
                  Category
                </div>
                <p className="text-lg font-semibold">{complaint.category}</p>
              </Card>
              <Card className="p-4 bg-secondary/20">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="text-lg font-semibold">{complaint.location}</p>
              </Card>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <FileText className="w-4 h-4" />
                  Attached Images
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((imagePath, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative w-full h-64">
                        <Image
                          src={imagePath}
                          alt={`Complaint image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <FileText className="w-4 h-4" />
                Description
              </div>
              <Card className="p-6 bg-secondary/10">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {complaint.content}
                </p>
              </Card>
            </div>

            {/* Status Update Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Update Complaint Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATUS_OPTIONS.map((statusOption) => {
                  const isActive = complaint.status === statusOption.value;

                  return (
                    <Button
                      key={statusOption.value}
                      variant={isActive ? "default" : "outline"}
                      disabled={updatingStatus || isActive}
                      onClick={() => updateComplaintStatus(statusOption.value)}
                      className={`${
                        !isActive ? STATUS_COLORS[statusOption.value] : ""
                      } transition-all h-auto py-4 flex flex-col items-center gap-2 ${
                        isActive ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                    >
                      {updatingStatus &&
                      complaint.status !== statusOption.value ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <span className="text-3xl">{statusOption.icon}</span>
                      )}
                      <span className="text-sm font-semibold">
                        {statusOption.label}
                      </span>
                      {isActive && (
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Current
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
