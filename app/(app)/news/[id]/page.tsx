"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Eye,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  MapPin,
  Newspaper,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { formatDistanceToNow } from "@/lib/utils/date";
import { useAuth } from "@/lib/hooks/useAuth";

type ContentType = "article" | "complaint";

interface ContentItem {
  content_type: ContentType;
  id: string;
  title: string;
  content: string;
  created_at: string;
  view_count: number;
  category?: string | null;
  barangay?: string | null;
  location?: string | null;
  status?: string | null;
  is_anonymous?: boolean;
  guest_name?: string | null;
  profiles: {
    name: string;
  } | null;
}

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface StatusUpdate {
  id: string;
  status: string;
  remarks: string;
  evidence_url: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string }> = {
  pending: { color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  processing: { color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  solved: { color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
  rejected: { color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200" },
};

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;
  const { user } = useAuth();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contentId) {
      fetchContentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  const fetchContentDetails = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch as article first
      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          content,
          created_at,
          view_count,
          profiles:user_id (
            name
          )
        `
        )
        .eq("id", contentId)
        .is("deleted_at", null)
        .maybeSingle();

      if (articleData) {
        // It's an article
        const profiles = Array.isArray(articleData.profiles)
          ? articleData.profiles[0] || null
          : articleData.profiles;

        setContent({
          content_type: "article",
          ...articleData,
          profiles,
        });

        // Increment view count
        await supabase.rpc("increment_article_views", {
          article_id: contentId,
        });

        // Fetch article images
        const { data: pictureLinks, error: pictureError } = await supabase
          .from("article_pictures")
          .select(
            `
            pictures:picture_id (
              image_path
            )
          `
          )
          .eq("article_id", contentId);

        if (!pictureError && pictureLinks) {
          const imageUrls = pictureLinks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((link: any) => link.pictures?.image_path)
            .filter(Boolean);
          setImages(imageUrls);
        }

        // Fetch article reactions
        const { data: reactionsData } = await supabase
          .from("article_reactions")
          .select("id, user_id, reaction_type")
          .eq("article_id", contentId);

        if (reactionsData) {
          setReactions(reactionsData);
        }

        // Fetch article comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("article_comments")
          .select(
            `
            id,
            content,
            created_at,
            profiles:user_id (
              name
            )
          `
          )
          .eq("article_id", contentId)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error("Error fetching article comments:", commentsError);
        }

        if (commentsData) {
          setComments(
            commentsData.map((comment: any) => ({
              ...comment,
              profiles: Array.isArray(comment.profiles)
                ? comment.profiles[0]
                : comment.profiles,
            }))
          );
        }
      } else {
        // Try to fetch as complaint
        const { data: complaintData, error: complaintError } = await supabase
          .from("complaints")
          .select(
            `
            id,
            title,
            content,
            category,
            barangay,
            location,
            image_url,
            status,
            created_at,
            view_count,
            is_anonymous,
            guest_name,
            profiles:user_id (
              name
            )
          `
          )
          .eq("id", contentId)
          .eq("is_public", true)
          .maybeSingle();

        if (complaintData) {
          const profiles = Array.isArray(complaintData.profiles)
            ? complaintData.profiles[0] || null
            : complaintData.profiles;

          setContent({
            content_type: "complaint",
            ...complaintData,
            profiles: complaintData.is_anonymous ? null : profiles,
          });

          // Set complaint image
          if (complaintData.image_url) {
            setImages([complaintData.image_url]);
          }

          // Fetch status updates for complaints
          const { data: updates } = await supabase
            .from("complaint_status_updates")
            .select("*")
            .eq("complaint_id", contentId)
            .order("created_at", { ascending: false });

          if (updates) {
            setStatusUpdates(updates);
          }

          // Increment view count
          await supabase.rpc("increment_complaint_views", {
            complaint_id: contentId,
          });

          // Fetch complaint reactions
          const { data: reactionsData } = await supabase
            .from("complaint_reactions")
            .select("id, user_id, reaction_type")
            .eq("complaint_id", contentId);

          if (reactionsData) {
            setReactions(reactionsData);
          }

          // Fetch complaint comments
          const { data: commentsData, error: commentsError } = await supabase
            .from("complaint_comments")
            .select(
              `
              id,
              content,
              created_at,
              profiles:user_id (
                name
              )
            `
            )
            .eq("complaint_id", contentId)
            .order("created_at", { ascending: false });

          if (commentsError) {
            console.error("Error fetching complaint comments:", commentsError);
          }

          if (commentsData) {
            console.log("Fetched complaint comments:", commentsData);
            setComments(
              commentsData.map((comment: any) => ({
                ...comment,
                profiles: Array.isArray(comment.profiles)
                  ? comment.profiles[0]
                  : comment.profiles,
              }))
            );
          }
        } else {
          throw new Error("Content not found");
        }
      }
    } catch (err) {
      console.error("Error fetching content:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      alert("Please login to react");
      return;
    }

    if (!content) return;

    const supabase = createClient();

    const table = content.content_type === "article" ? "article_reactions" : "complaint_reactions";
    const idColumn = content.content_type === "article" ? "article_id" : "complaint_id";

    const existingReaction = reactions.find((r) => r.user_id === user.id);

    try {
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction - optimistic update
          setReactions(reactions.filter((r) => r.id !== existingReaction.id));
          
          const { error } = await supabase
            .from(table)
            .delete()
            .eq("id", existingReaction.id);
          
          if (error) throw error;
        } else {
          // Update reaction type - optimistic update
          setReactions(reactions.map((r) => 
            r.id === existingReaction.id 
              ? { ...r, reaction_type: reactionType }
              : r
          ));
          
          const { error } = await supabase
            .from(table)
            .update({ reaction_type: reactionType })
            .eq("id", existingReaction.id);
          
          if (error) throw error;
        }
      } else {
        // Add new reaction - optimistic update with temporary ID
        const tempReaction: Reaction = {
          id: `temp-${Date.now()}`,
          user_id: user.id,
          reaction_type: reactionType,
        };
        setReactions([...reactions, tempReaction]);
        
        const { data, error } = await supabase.from(table).insert({
          [idColumn]: contentId,
          user_id: user.id,
          reaction_type: reactionType,
        }).select();
        
        if (error) throw error;
        
        // Replace temp reaction with real one
        if (data && data[0]) {
          setReactions(prev => 
            prev.map(r => r.id === tempReaction.id ? data[0] : r)
          );
        }
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
      // Revert on error by refetching
      fetchContentDetails();
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to comment");
      return;
    }

    if (!commentContent.trim() || !content) {
      return;
    }

    setIsSubmittingComment(true);
    const supabase = createClient();

    const table = content.content_type === "article" ? "article_comments" : "complaint_comments";
    const idColumn = content.content_type === "article" ? "article_id" : "complaint_id";

    try {
      const { data: newCommentData, error } = await supabase
        .from(table)
        .insert({
          [idColumn]: contentId,
          user_id: user.id,
          content: commentContent.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      if (newCommentData) {
        // Fetch the profile data separately to match the structure
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();

        // Add the new comment with the same structure as fetched comments
        const newComment: Comment = {
          id: newCommentData.id,
          content: newCommentData.content,
          created_at: newCommentData.created_at,
          profiles: profileData || { name: "User" },
        };
        
        setComments([newComment, ...comments]);
      }

      setCommentContent("");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const reactionCounts = {
    hearts: reactions.filter((r) => r.reaction_type === "heart").length,
    thumbs_up: reactions.filter((r) => r.reaction_type === "thumbs_up").length,
    thumbs_down: reactions.filter((r) => r.reaction_type === "thumbs_down").length,
  };

  const userReaction = user
    ? reactions.find((r) => r.user_id === user.id)?.reaction_type
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Hub" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Not Found" showNotifications={false} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Card className="border-rose-200 bg-rose-50 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-rose-900 mb-2">
              Content Not Found
            </h2>
            <p className="text-sm text-rose-700 mb-4">
              {error || "The content you are looking for does not exist."}
            </p>
            <Button onClick={() => router.push("/news")} variant="outline">
              Back to Hub
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const authorName = content.is_anonymous 
    ? "Anonymous" 
    : content.guest_name || content.profiles?.name || "Unknown";

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      <AppHeader title="Hub" showNotifications={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/news")}
          className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>

        {/* Content Card */}
        <Card className="overflow-hidden">
          <div className="p-6 space-y-4 border-b">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={content.content_type === "article" ? "default" : "secondary"}
                className="gap-1"
              >
                {content.content_type === "article" ? (
                  <>
                    <Newspaper className="w-3 h-3" />
                    News Article
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Complaint
                  </>
                )}
              </Badge>
              {content.category && (
                <Badge variant="outline">{content.category}</Badge>
              )}
              {content.status && (
                <Badge
                  className={
                    content.status === "solved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : content.status === "processing"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : content.status === "rejected"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  {content.status.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold">{content.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(content.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {content.view_count || 0} views
              </span>
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                By {authorName}
              </span>
              {content.barangay && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {content.barangay}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={imageUrl}
                      alt={`${content.content_type === "article" ? "Article" : "Complaint"} image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Additional Info for Complaints */}
            {content.content_type === "complaint" && content.location && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{content.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Updates for Complaints */}
            {content.content_type === "complaint" && statusUpdates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Admin Updates
                </h3>
                <div className="space-y-2">
                  {statusUpdates.map((update) => {
                    const config = STATUS_CONFIG[update.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={update.id} className={`p-3 rounded-lg border ${config.bgColor}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="outline" className={`uppercase text-xs ${config.color} border-current`}>
                            {update.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(update.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {update.remarks && (
                          <p className="text-sm text-foreground mb-2">{update.remarks}</p>
                        )}
                        {update.evidence_url && (
                          <button
                            onClick={() => window.open(update.evidence_url!, '_blank')}
                            className="relative w-32 h-20 rounded-md overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-primary transition-colors group"
                          >
                            <Image
                              src={update.evidence_url}
                              alt="Evidence"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">View</span>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={content.content} />
            </div>
          </div>

          {/* Reactions Bar */}
          <div className="p-6 border-t bg-gray-50/50">
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleReaction("heart")}
                className={`flex items-center gap-2 transition-all ${
                  userReaction === "heart"
                    ? "text-rose-500 scale-110"
                    : "text-muted-foreground hover:text-rose-500"
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${userReaction === "heart" ? "fill-current" : ""}`}
                />
                <span className="font-semibold">{reactionCounts.hearts}</span>
              </button>
              <button
                onClick={() => handleReaction("thumbs_up")}
                className={`flex items-center gap-2 transition-all ${
                  userReaction === "thumbs_up"
                    ? "text-emerald-500 scale-110"
                    : "text-muted-foreground hover:text-emerald-500"
                }`}
              >
                <ThumbsUp
                  className={`w-6 h-6 ${userReaction === "thumbs_up" ? "fill-current" : ""}`}
                />
                <span className="font-semibold">{reactionCounts.thumbs_up}</span>
              </button>
              <button
                onClick={() => handleReaction("thumbs_down")}
                className={`flex items-center gap-2 transition-all ${
                  userReaction === "thumbs_down"
                    ? "text-amber-500 scale-110"
                    : "text-muted-foreground hover:text-amber-500"
                }`}
              >
                <ThumbsDown
                  className={`w-6 h-6 ${userReaction === "thumbs_down" ? "fill-current" : ""}`}
                />
                <span className="font-semibold">{reactionCounts.thumbs_down}</span>
              </button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-6 h-6" />
                <span className="font-semibold">{comments.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Comments Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <Textarea
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <Button
                type="submit"
                disabled={!commentContent.trim() || isSubmittingComment}
                className="gap-2"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post Comment
              </Button>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Please login to comment
              </p>
              <Button onClick={() => router.push("/auth/login")} variant="outline">
                Login
              </Button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                console.log("Rendering comment:", comment);
                const fullName = comment.profiles?.name || "Unknown User";
                const firstName = fullName.split(' ')[0];
                const initials = fullName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().slice(0, 2) || "U";
                
                return (
                  <div key={comment.id} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <span className="text-sm font-semibold">
                          {initials || "U"}
                        </span>
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {firstName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at))}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
