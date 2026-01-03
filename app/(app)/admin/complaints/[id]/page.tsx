"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Clock,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Complaint {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  barangay?: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  image_url?: string;
  is_anonymous?: boolean;
  profiles: {
    address: string;
    name: string;
    email: string;
    contact_number: string;
  };
}

interface Feedback {
  id: string;
  feedback: string;
  created_at: string;
  admin_id: string;
}

const STATUS_OPTIONS = [
  { 
    value: "pending", 
    label: "Mark as Pending", 
    icon: Clock,
    description: "Complaint is awaiting review"
  },
  { 
    value: "processing", 
    label: "Start Processing", 
    icon: Loader2,
    description: "Working on this complaint"
  },
  { 
    value: "solved", 
    label: "Mark as Resolved", 
    icon: CheckCircle2,
    description: "Issue has been resolved"
  },
  { 
    value: "rejected", 
    label: "Reject Complaint", 
    icon: XCircle,
    description: "Complaint cannot be processed"
  },
];

const getStatusStyles = (status: string, isActive: boolean) => {
  if (isActive) return "bg-primary text-white border-primary";
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "solved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusBadgeStyles = (status: string) => {
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
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const checkAdminAndFetchComplaint = useCallback(async () => {
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
    setError(null);

    try {
      const { data: complaintData, error: fetchError } = await supabase
        .from("complaints")
        .select(
          "id, title, content, category, location, barangay, status, created_at, updated_at, user_id, image_url, is_anonymous"
        )
        .eq("id", complaintId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!complaintData) {
        throw new Error("Complaint not found");
      }

      console.log("🔍 Complaint Data:", {
        id: complaintData.id,
        user_id: complaintData.user_id,
        is_anonymous: complaintData.is_anonymous,
        title: complaintData.title
      });

      // Fetch profile data separately with proper error handling
      // Using the same approach as the list page that works correctly
      let profileData = null;
      
      if (!complaintData.is_anonymous) {
        console.log("📞 Fetching profile for user_id:", complaintData.user_id);
        
        // Use .in() instead of .eq().single() to match the working list page approach
        // Note: Removed email from query - it doesn't exist in profiles table
        const { data: profilesArray, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, contact_number, address")
          .in("id", [complaintData.user_id]);

        if (profileError) {
          console.error("❌ Error fetching profile:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
          });
        } else {
          console.log("✅ Profiles fetched - Count:", profilesArray?.length);
          console.log("✅ Profiles array:", profilesArray);
          // Get the first (and should be only) profile from the array
          profileData = profilesArray && profilesArray.length > 0 ? profilesArray[0] : null;
          console.log("✅ Final profile data:", profileData);
        }
      } else {
        console.log("⚠️ Complaint is anonymous, skipping profile fetch");
      }

      const combinedData: Complaint = {
        ...complaintData,
        profiles: complaintData.is_anonymous
          ? {
              name: "Anonymous",
              email: "Anonymous",
              contact_number: "",
              address: "",
            }
          : profileData
          ? {
              name: profileData.name || "No Name Set",
              email: "N/A", // Email not in profiles table
              contact_number: profileData.contact_number || "",
              address: profileData.address || "",
            }
          : {
              name: "Unknown User",
              email: "N/A",
              contact_number: "",
              address: "",
            },
      };

      console.log("📋 Final complaint data:", {
        is_anonymous: combinedData.is_anonymous,
        user_id: combinedData.user_id,
        profile_name: combinedData.profiles?.name,
      });
      setComplaint(combinedData);

      // Collect images from both image_url field and pictures table
      const imageUrls: string[] = [];
      
      // Add direct image_url if exists
      if (complaintData.image_url) {
        imageUrls.push(complaintData.image_url);
      }

      // Remove duplicates
      setImages([...new Set(imageUrls)]);

      // Fetch feedback if status is rejected
      if (complaintData.status === "rejected") {
        const { data: feedbackData } = await supabase
          .from("complaint_feedback")
          .select("id, feedback, created_at, admin_id")
          .eq("complaint_id", complaintId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (feedbackData) {
          setFeedback(feedbackData);
          setFeedbackText(feedbackData.feedback);
        }
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
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("complaints")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", complaint.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setComplaint({ ...complaint, status: newStatus });

      // If status is being changed from rejected to something else, clear feedback
      if (complaint.status === "rejected" && newStatus !== "rejected") {
        setFeedback(null);
        setFeedbackText("");
      }

      // If changing to rejected status, allow feedback to be added
      if (newStatus === "rejected") {
        setFeedbackText("");
      }
    } catch (err) {
      console.error("Error updating complaint status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitFeedback = async () => {
    if (!complaint || !feedbackText.trim()) {
      setError("Please provide feedback text");
      return;
    }

    const supabase = createClient();
    setSubmittingFeedback(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if feedback already exists
      if (feedback) {
        // Update existing feedback
        const { error: updateError } = await supabase
          .from("complaint_feedback")
          .update({ feedback: feedbackText })
          .eq("id", feedback.id);

        if (updateError) throw updateError;

        setFeedback({ ...feedback, feedback: feedbackText });
      } else {
        // Insert new feedback
        const { data: newFeedback, error: insertError } = await supabase
          .from("complaint_feedback")
          .insert({
            complaint_id: complaint.id,
            feedback: feedbackText,
            admin_id: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setFeedback(newFeedback);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Complaint Details" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading complaint details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Access Denied" showNotifications={false} />
        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
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

  if (!complaint) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Complaint Not Found" showNotifications={false} />
        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="p-12 text-center border-gray-100">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Complaint Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The complaint doesn&apos;t exist or has been removed.
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
    <div className="min-h-screen pb-24 md:pb-8">
      <AppHeader title="Complaint Details" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/complaints")}
          className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Complaints
        </button>

        {/* Error */}
        {error && (
          <Card className="border-rose-200 bg-rose-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm text-rose-700 flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Main Layout - Two Columns on Desktop */}
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Left Column - Complaint Details */}
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground mb-3">
                      {complaint.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {complaint.is_anonymous 
                          ? "Anonymous" 
                          : (complaint.profiles?.name || "Unknown User")}
                      </span>
                      {!complaint.is_anonymous && complaint.profiles?.contact_number && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          {complaint.profiles.contact_number}
                        </span>
                      )}
                    </div>
                    {!complaint.is_anonymous && complaint.profiles?.address && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                        <House className="w-4 h-4" />
                        {complaint.profiles.address}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`${getStatusBadgeStyles(
                      complaint.status
                    )} capitalize text-sm px-3 py-1`}
                  >
                    {complaint.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Submitted:{" "}
                    {new Date(complaint.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {complaint.updated_at !== complaint.created_at && (
                    <span>
                      Updated:{" "}
                      {new Date(complaint.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Category & Location */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                      <Tag className="w-3 h-3" />
                      Category
                    </div>
                    <p className="font-semibold text-foreground">{complaint.category}</p>
                  </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </div>
                  <p className="font-semibold text-foreground">
                    {complaint.barangay && `${complaint.barangay} `}
                    {complaint.location}
                  </p>
                </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <FileText className="w-4 h-4" />
                    Description
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {complaint.content}
                    </p>
                  </div>
                </div>

                {/* Images */}
                {images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      <FileText className="w-4 h-4" />
                      Attached Images ({images.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {images.map((imagePath, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(imagePath)}
                          className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-primary transition-colors cursor-pointer group"
                        >
                          <Image
                            src={imagePath}
                            alt={`Complaint image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">Click to expand</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Status Actions & Feedback */}
          <div className="space-y-6">
            {/* Status Update Card */}
            <Card className="border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Update Status
                </h3>
                <div className="space-y-3">
                  {STATUS_OPTIONS.map((statusOption) => {
                    const isActive = complaint.status === statusOption.value;
                    const Icon = statusOption.icon;

                    return (
                      <Button
                        key={statusOption.value}
                        variant={isActive ? "default" : "outline"}
                        disabled={updatingStatus || isActive}
                        onClick={() => updateComplaintStatus(statusOption.value)}
                        className={`w-full h-auto py-4 flex items-start gap-3 ${
                          !isActive && getStatusStyles(statusOption.value, false)
                        } ${isActive ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusOption.value === "processing" && updatingStatus ? "animate-spin" : ""}`} />
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-sm">
                            {statusOption.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                            {statusOption.description}
                          </div>
                          {isActive && (
                            <div className="text-xs mt-1 font-medium">
                              ✓ Current Status
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Feedback Card - Only show if status is rejected */}
            {complaint.status === "rejected" && (
              <Card className="border-rose-200 bg-rose-50/50">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-rose-900">
                    <MessageSquare className="w-5 h-5" />
                    Rejection Feedback
                  </h3>
                  <p className="text-xs text-rose-700 mb-4">
                    Provide a reason for rejecting this complaint. This will be visible to the user.
                  </p>
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Explain why this complaint cannot be processed..."
                    className="min-h-[120px] mb-3 bg-white border-rose-200 focus:border-rose-300"
                  />
                  <Button
                    onClick={submitFeedback}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className="w-full"
                    variant="default"
                  >
                    {submittingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : feedback ? (
                      "Update Feedback"
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                  {feedback && (
                    <p className="text-xs text-rose-600 mt-2 text-center">
                      Last updated: {new Date(feedback.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors z-10"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt="Full size complaint image"
                fill
                className="object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
