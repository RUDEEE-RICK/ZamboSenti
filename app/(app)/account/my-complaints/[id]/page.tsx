"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
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
  admin_feedback?: string;
}

interface StatusUpdate {
  id: string;
  status: string;
  remarks: string;
  evidence_url: string | null;
  created_at: string;
}

const STATUS_STEPS = ["pending", "processing", "solved"];

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    icon: React.ElementType;
    label: string;
    description: string;
  }
> = {
  pending: {
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    icon: Clock,
    label: "PENDING REVIEW",
    description: "Your complaint has been received and is waiting for review.",
  },
  processing: {
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Loader2,
    label: "IN PROGRESS",
    description: "We are currently working on resolving your issue.",
  },
  solved: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    label: "RESOLVED",
    description: "This issue has been successfully resolved.",
  },
  rejected: {
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
    icon: XCircle,
    label: "REJECTED",
    description:
      "This complaint could not be processed. See feedback for details.",
  },
};

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchComplaintDetail = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select(
          "id, title, content, category, location, barangay, status, created_at, updated_at, image_url"
        )
        .eq("id", complaintId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const { data: feedbackData } = await supabase
        .from("complaint_feedback")
        .select("feedback, created_at")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setComplaint({
        ...data,
        admin_feedback: feedbackData?.feedback || null,
      });

      // Fetch status updates
      const { data: updates } = await supabase
        .from("complaint_status_updates")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });

      if (updates) {
        setStatusUpdates(updates);
      }

      // Collect images from both image_url and pictures table
      const imageUrls: string[] = [];
      
      if (data.image_url) {
        imageUrls.push(data.image_url);
      }
      
      setImages([...new Set(imageUrls)]);
    } catch (err) {
      console.error("Error fetching complaint:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch complaint details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [complaintId, router]);

  useEffect(() => {
    fetchComplaintDetail();
  }, [fetchComplaintDetail]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Complaint Details" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Complaint Not Found" showNotifications={false} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Card className="p-12 text-center border-gray-100">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Complaint Not Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The complaint you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button
              onClick={() => router.push("/account/my-complaints")}
              className="bg-primary hover:bg-primary/90"
            >
              Back to My Complaints
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-gray-50/50">
      <AppHeader title="Complaint Details" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/account/my-complaints")}
          className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Complaints
        </button>

        {/* Error */}
        {error && (
          <Card className="border-rose-200 bg-rose-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm text-rose-700 flex-1">{error}</p>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-[1fr,340px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <div className=" p-6 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-2xl font-bold text-foreground flex-1">
                    {complaint.title}
                  </h1>
                  <Badge
                    className={`${statusConfig.bgColor} ${statusConfig.color} capitalize text-sm px-3 py-1 border`}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(complaint.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(complaint.created_at).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Category & Location */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <Tag className="w-3.5 h-3.5" />
                      Category
                    </div>
                    <p className="font-semibold text-foreground">{complaint.category}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      Location
                    </div>
                    <p className="font-semibold text-foreground">
                      {complaint.barangay && `${complaint.barangay}, `}
                      ({complaint.location})
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {complaint.content}
                    </p>
                  </div>
                </div>

                {/* Evidence Images */}
                {images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Evidence ({images.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {images.map((imagePath, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(imagePath)}
                          className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-primary transition-all cursor-pointer group"
                        >
                          <Image
                            src={imagePath}
                            alt={`Complaint image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
                              View Full Size
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* Sidebar Status */}
          <div className="space-y-4">
            {/* Status Card */}
            <Card className="border-gray-200 shadow-sm sticky top-6">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Status Tracker
                </h3>
                
                {/* Current Status */}
                <div className={`rounded-lg p-4 border-2 ${statusConfig.bgColor} mb-5`}>
                  <div className="flex items-start gap-3 mb-2">
                    <StatusIcon className={`w-6 h-6 ${statusConfig.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <span className={`font-bold text-base ${statusConfig.color} block`}>
                        {statusConfig.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {statusConfig.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {complaint.status !== "rejected" && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                      Progress Timeline
                    </h4>
                    <div className="relative pl-6 space-y-6">
                      {/* Vertical Line */}
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                      
                      {STATUS_STEPS.map((step, index) => {
                        const isCompleted =
                          STATUS_STEPS.indexOf(complaint.status) >= index;
                        const isCurrent = complaint.status === step;

                        return (
                          <div key={step} className="relative">
                            <div
                              className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 transition-all ${
                                isCompleted
                                  ? "bg-primary border-primary shadow-md"
                                  : "bg-white border-gray-300"
                              } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                            />
                            <div className={isCompleted ? "opacity-100" : "opacity-40"}>
                              <p className={`text-sm font-semibold capitalize ${
                                isCurrent ? "text-primary" : "text-foreground"
                              }`}>
                                {step}
                              </p>
                              {isCurrent && (
                                <p className="text-xs text-primary mt-0.5 font-medium">
                                  Current Stage →
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>

             {complaint.admin_feedback && (
              <Card className="overflow-hidden border-rose-200 bg-rose-50/50 shadow-sm">
                <div className="p-6">
                  <h3 className="font-semibold text-rose-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Official Response
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-rose-200">
                    <p className="text-sm text-rose-900 leading-relaxed whitespace-pre-wrap">
                      {complaint.admin_feedback}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-rose-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Response from ZamboSenti Administration</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Status Updates */}
            {statusUpdates.length > 0 && (
              <Card className="border-gray-200 shadow-sm">
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Admin Updates
                  </h3>
                  <div className="space-y-3">
                    {statusUpdates.map((update) => {
                      const config = STATUS_CONFIG[update.status] || STATUS_CONFIG.pending;
                      const Icon = config.icon;
                      return (
                        <div key={update.id} className={`rounded-lg p-3 border ${config.bgColor}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${config.color}`} />
                            <span className={`text-xs font-bold uppercase ${config.color}`}>
                              {update.status}
                            </span>
                          </div>
                          {update.remarks && (
                            <p className="text-sm text-foreground mb-2">{update.remarks}</p>
                          )}
                          {update.evidence_url && (
                            <button
                              onClick={() => setSelectedImage(update.evidence_url!)}
                              className="relative w-32 h-20 rounded-md overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-primary transition-colors group"
                            >
                              <Image
                                src={update.evidence_url}
                                alt="Status update evidence"
                                fill
                                unoptimized
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to expand</span>
                              </div>
                            </button>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(update.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors z-10 backdrop-blur-sm"
            aria-label="Close image"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Full size complaint image"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
