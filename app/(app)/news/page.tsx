"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Select, type SelectOption } from "@/components/headless/Select";
import {
  MessageSquare,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MapPin,
  Calendar,
  Search,
  TrendingUp,
  Clock,
  Newspaper,
  AlertCircle,
  ExternalLink,
  Flame,
  Plus,
  Loader2,
  X,
  Check,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "@/lib/utils/date";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HubItem {
  content_type: "article" | "complaint";
  id: string;
  title: string;
  content: string;
  created_at: string;
  view_count: number;
  category: string | null;
  barangay: string | null;
  location: string | null;
  status?: string | null;
  author_name: string | null;
  image_url?: string | null;
  reactions?: {
    hearts: number;
    thumbs_up: number;
    thumbs_down: number;
  };
  comment_count?: number;
}

type SortOption = "latest" | "trending" | "most-viewed";
type FilterOption = "all" | "articles" | "complaints";

interface ArticleFormData {
  title: string;
  content: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const initialArticleFormData: ArticleFormData = {
  title: "",
  content: "",
  imageFile: null,
  imagePreview: null,
};

export default function HubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<HubItem[]>([]);
  const [trendingComplaint, setTrendingComplaint] = useState<HubItem | null>(
    null,
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Article form state
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleFormData, setArticleFormData] = useState<ArticleFormData>(
    initialArticleFormData,
  );
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sortOptions: SelectOption[] = [
    { id: "latest", name: "Latest" },
    { id: "trending", name: "Trending" },
    { id: "most-viewed", name: "Most Viewed" },
  ];

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    fetchHubContent();
    setCurrentPage(1);
  }, [sortBy, filterBy, searchQuery]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.rpc("is_admin");
    setIsAdmin(data === true);
  };

  const fetchHubContent = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      let articles: HubItem[] = [];
      let complaints: HubItem[] = [];

      // Fetch articles if not filtering for complaints only
      if (filterBy !== "complaints") {
        const { data: articlesData, error: articlesError } = await supabase
          .from("articles")
          .select(
            `
            id,
            title,
            content,
            created_at,
            view_count,
            image_url,
            profiles:user_id(name)
          `,
          )
          .is("deleted_at", null);

        if (!articlesError && articlesData) {
          articles = await Promise.all(
            articlesData.map(async (article: any) => {
              // Use image_url directly from article
              const image_url = article.image_url || null;

              // Fetch reactions
              const { data: reactionsData } = await supabase
                .from("article_reactions")
                .select("reaction_type")
                .eq("article_id", article.id);

              // Fetch comments count
              const { count: commentsCount } = await supabase
                .from("article_comments")
                .select("*", { count: "exact", head: true })
                .eq("article_id", article.id);

              const reactions = {
                hearts:
                  reactionsData?.filter((r: any) => r.reaction_type === "heart")
                    .length || 0,
                thumbs_up:
                  reactionsData?.filter(
                    (r: any) => r.reaction_type === "thumbs_up",
                  ).length || 0,
                thumbs_down:
                  reactionsData?.filter(
                    (r: any) => r.reaction_type === "thumbs_down",
                  ).length || 0,
              };

              const profiles = Array.isArray(article.profiles)
                ? article.profiles[0]
                : article.profiles;

              return {
                content_type: "article" as const,
                id: article.id,
                title: article.title,
                content: article.content,
                created_at: article.created_at,
                view_count: article.view_count || 0,
                category: null,
                barangay: null,
                location: null,
                author_name: profiles?.name || "Admin",
                image_url,
                reactions,
                comment_count: commentsCount || 0,
              };
            }),
          );
        }
      }

      // Fetch complaints if not filtering for articles only
      if (filterBy !== "articles") {
        const { data: complaintsData, error: complaintsError } = await supabase
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
            profiles:user_id(name)
          `,
          )
          .eq("is_public", true);

        if (!complaintsError && complaintsData) {
          complaints = await Promise.all(
            complaintsData.map(async (complaint: any) => {
              // Fetch reactions
              const { data: reactionsData } = await supabase
                .from("complaint_reactions")
                .select("reaction_type")
                .eq("complaint_id", complaint.id);

              // Fetch comments count
              const { count: commentsCount } = await supabase
                .from("complaint_comments")
                .select("*", { count: "exact", head: true })
                .eq("complaint_id", complaint.id);

              const reactions = {
                hearts:
                  reactionsData?.filter((r: any) => r.reaction_type === "heart")
                    .length || 0,
                thumbs_up:
                  reactionsData?.filter(
                    (r: any) => r.reaction_type === "thumbs_up",
                  ).length || 0,
                thumbs_down:
                  reactionsData?.filter(
                    (r: any) => r.reaction_type === "thumbs_down",
                  ).length || 0,
              };

              const profiles = Array.isArray(complaint.profiles)
                ? complaint.profiles[0]
                : complaint.profiles;
              const author_name = complaint.is_anonymous
                ? "Anonymous"
                : complaint.guest_name || profiles?.name || "Unknown";

              return {
                content_type: "complaint" as const,
                id: complaint.id,
                title: complaint.title,
                content: complaint.content,
                created_at: complaint.created_at,
                view_count: complaint.view_count || 0,
                category: complaint.category,
                barangay: complaint.barangay,
                location: complaint.location,
                status: complaint.status,
                author_name,
                image_url: complaint.image_url,
                reactions,
                comment_count: commentsCount || 0,
              };
            }),
          );
        }
      }

      // Combine and sort
      let combined = [...articles, ...complaints];

      if (sortBy === "latest") {
        combined.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } else if (sortBy === "most-viewed") {
        combined.sort((a, b) => b.view_count - a.view_count);
      } else if (sortBy === "trending") {
        combined.sort((a, b) => {
          const aScore =
            (a.reactions?.hearts || 0) * 2 +
            (a.reactions?.thumbs_up || 0) +
            (a.comment_count || 0) * 3;
          const bScore =
            (b.reactions?.hearts || 0) * 2 +
            (b.reactions?.thumbs_up || 0) +
            (b.comment_count || 0) * 3;
          return bScore - aScore;
        });
      }

      setItems(combined);

      // Find trending complaint (highest engagement score among complaints)
      const onlyComplaints = complaints;
      if (onlyComplaints.length > 0) {
        const trending = onlyComplaints.reduce((prev, current) => {
          const prevScore =
            (prev.reactions?.hearts || 0) * 2 +
            (prev.reactions?.thumbs_up || 0) +
            (prev.comment_count || 0) * 3;
          const currentScore =
            (current.reactions?.hearts || 0) * 2 +
            (current.reactions?.thumbs_up || 0) +
            (current.comment_count || 0) * 3;
          return currentScore > prevScore ? current : prev;
        });
        setTrendingComplaint(trending);
      }
    } catch (error) {
      console.error("Error fetching hub content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (item: HubItem, reactionType: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login to react");
      return;
    }

    const table =
      item.content_type === "article"
        ? "article_reactions"
        : "complaint_reactions";
    const idColumn =
      item.content_type === "article" ? "article_id" : "complaint_id";

    const { data: existing } = await supabase
      .from(table)
      .select("*")
      .eq(idColumn, item.id)
      .eq("user_id", user.id)
      .single();

    let action: "add" | "remove" | "change" = "add";
    let oldReactionType: string | null = null;

    if (existing) {
      if (existing.reaction_type === reactionType) {
        action = "remove";
        await supabase.from(table).delete().eq("id", existing.id);
      } else {
        action = "change";
        oldReactionType = existing.reaction_type;
        await supabase
          .from(table)
          .update({ reaction_type: reactionType })
          .eq("id", existing.id);
      }
    } else {
      await supabase.from(table).insert({
        [idColumn]: item.id,
        user_id: user.id,
        reaction_type: reactionType,
      });
    }

    // Update local state without refetching
    const updateReactions = (currentItem: HubItem) => {
      if (
        currentItem.id !== item.id ||
        currentItem.content_type !== item.content_type
      ) {
        return currentItem;
      }

      const newReactions = {
        hearts: currentItem.reactions?.hearts || 0,
        thumbs_up: currentItem.reactions?.thumbs_up || 0,
        thumbs_down: currentItem.reactions?.thumbs_down || 0,
      };

      if (action === "add") {
        if (reactionType === "heart") newReactions.hearts++;
        else if (reactionType === "thumbs_up") newReactions.thumbs_up++;
        else if (reactionType === "thumbs_down") newReactions.thumbs_down++;
      } else if (action === "remove") {
        if (reactionType === "heart")
          newReactions.hearts = Math.max(0, newReactions.hearts - 1);
        else if (reactionType === "thumbs_up")
          newReactions.thumbs_up = Math.max(0, newReactions.thumbs_up - 1);
        else if (reactionType === "thumbs_down")
          newReactions.thumbs_down = Math.max(0, newReactions.thumbs_down - 1);
      } else if (action === "change" && oldReactionType) {
        // Decrement old reaction
        if (oldReactionType === "heart")
          newReactions.hearts = Math.max(0, newReactions.hearts - 1);
        else if (oldReactionType === "thumbs_up")
          newReactions.thumbs_up = Math.max(0, newReactions.thumbs_up - 1);
        else if (oldReactionType === "thumbs_down")
          newReactions.thumbs_down = Math.max(0, newReactions.thumbs_down - 1);
        // Increment new reaction
        if (reactionType === "heart") newReactions.hearts++;
        else if (reactionType === "thumbs_up") newReactions.thumbs_up++;
        else if (reactionType === "thumbs_down") newReactions.thumbs_down++;
      }

      return {
        ...currentItem,
        reactions: newReactions,
      };
    };

    setItems((prevItems) => prevItems.map(updateReactions));
    setTrendingComplaint((prev) => (prev ? updateReactions(prev) : prev));
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setFormError("You must be logged in to create an article");
      return;
    }

    setIsSubmittingArticle(true);
    setFormError(null);

    const supabase = createClient();

    try {
      let imageUrl: string | null = null;

      // Upload image first if provided
      if (articleFormData.imageFile) {
        console.log("📸 Starting image upload...", {
          fileName: articleFormData.imageFile.name,
          fileSize: articleFormData.imageFile.size,
          fileType: articleFormData.imageFile.type,
        });

        const fileExt = articleFormData.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}${Math.random().toString(36).substring(7)}.${fileExt}`;

        console.log("📤 Uploading file:", fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("article-images")
          .upload(fileName, articleFormData.imageFile);

        if (uploadError) {
          console.error("❌ Image upload error:", uploadError);
          // Continue without image if upload fails
        } else {
          console.log("✅ Upload successful:", uploadData);

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("article-images").getPublicUrl(fileName);

          console.log("🔗 Public URL:", publicUrl);
          imageUrl = publicUrl;
        }
      }

      // Insert article with image_url
      console.log("📝 Inserting article with image_url:", imageUrl);

      const { data: articleData, error: insertError } = await supabase
        .from("articles")
        .insert({
          title: articleFormData.title.trim(),
          content: articleFormData.content.trim(),
          user_id: user.id,
          view_count: 0,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("✅ Article created:", articleData);

      // Reset form and refresh
      setShowArticleForm(false);
      setArticleFormData(initialArticleFormData);
      await fetchHubContent();
    } catch (err) {
      console.error("Error saving article:", err);
      setFormError(
        err instanceof Error ? err.message : "Failed to save article",
      );
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleArticleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 File input changed:", e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log("📄 File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (file.size > 10 * 1024 * 1024) {
        setFormError("Image must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setFormError("File must be an image");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("✅ File read complete, setting preview");
        setArticleFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setFormError(null);
    } else {
      console.log("❌ No file selected");
    }
  };

  const handleArticleCancel = () => {
    setShowArticleForm(false);
    setArticleFormData(initialArticleFormData);
    setFormError(null);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-950/20">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Community Hub
              </h1>
              <p className="text-muted-foreground">
                Latest news, updates, and community complaints
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setShowArticleForm(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Article
              </Button>
            )}
          </div>
        </div>

        {/* Add Article Modal */}
        <Dialog
          isOpen={showArticleForm && isAdmin}
          onClose={handleArticleCancel}
          title="Add New Article"
          size="xl"
        >
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{formError}</p>
            </div>
          )}
          <form onSubmit={handleArticleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={articleFormData.title}
                onChange={(e) =>
                  setArticleFormData({
                    ...articleFormData,
                    title: e.target.value,
                  })
                }
                placeholder="Article title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Content *
              </label>
              <Textarea
                value={articleFormData.content}
                onChange={(e) =>
                  setArticleFormData({
                    ...articleFormData,
                    content: e.target.value,
                  })
                }
                placeholder="Write your article content here... (Markdown supported)"
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: You can use Markdown formatting for rich content
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Cover Image (Optional)
              </label>
              <div className="mt-2">
                {articleFormData.imagePreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 group">
                    <Image
                      src={articleFormData.imagePreview}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setArticleFormData((prev) => ({
                            ...prev,
                            imageFile: null,
                            imagePreview: null,
                          }))
                        }
                        className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-gray-50 transition-all cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Click to upload image
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Max 10MB
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleArticleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmittingArticle}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmittingArticle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish Article
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleArticleCancel}
                disabled={isSubmittingArticle}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Desktop: Buttons, Mobile: Dropdown */}
            <div className="hidden sm:flex gap-2">
              <Button
                variant={sortBy === "latest" ? "default" : "outline"}
                onClick={() => setSortBy("latest")}
                size="sm"
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Latest
              </Button>
              <Button
                variant={sortBy === "trending" ? "default" : "outline"}
                onClick={() => setSortBy("trending")}
                size="sm"
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Trending
              </Button>
              <Button
                variant={sortBy === "most-viewed" ? "default" : "outline"}
                onClick={() => setSortBy("most-viewed")}
                size="sm"
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Views
              </Button>
            </div>
            <div className="sm:hidden">
              <Select
                value={sortOptions.find((opt) => opt.id === sortBy) || null}
                onChange={(option) => setSortBy(option.id as SortOption)}
                options={sortOptions}
                placeholder="Sort by"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterBy === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBy("all")}
            >
              All
            </Button>
            <Button
              variant={filterBy === "articles" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBy("articles")}
              className="gap-2"
            >
              <Newspaper className="w-4 h-4" />
              News
            </Button>
            <Button
              variant={filterBy === "complaints" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBy("complaints")}
              className="gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Complaints
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No content found</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Trending Complaint Highlight */}
            {trendingComplaint && filterBy !== "articles" && (
              <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="p-4 bg-primary/10 border-b border-primary/20">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-primary">
                      Trending Complaint
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 p-6">
                  {trendingComplaint.image_url && (
                    <div className="relative w-full md:w-64 h-48 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={trendingComplaint.image_url}
                        alt={trendingComplaint.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Complaint
                      </Badge>
                      {trendingComplaint.category && (
                        <Badge variant="outline">
                          {trendingComplaint.category}
                        </Badge>
                      )}
                      {trendingComplaint.status && (
                        <Badge
                          className={
                            trendingComplaint.status === "solved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : trendingComplaint.status === "processing"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : trendingComplaint.status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {trendingComplaint.status
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold">
                      {trendingComplaint.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2">
                      {trendingComplaint.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {trendingComplaint.barangay && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {trendingComplaint.barangay}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(
                          new Date(trendingComplaint.created_at),
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {trendingComplaint.view_count} views
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 text-rose-500">
                        <Heart className="w-5 h-5" />
                        <span className="font-semibold">
                          {trendingComplaint.reactions?.hearts || 0}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-emerald-500">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="font-semibold">
                          {trendingComplaint.reactions?.thumbs_up || 0}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-semibold">
                          {trendingComplaint.comment_count || 0}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          router.push(`/news/${trendingComplaint.id}`)
                        }
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </Button>
                      {isAdmin && (
                        <Button
                          onClick={() =>
                            router.push(
                              `/admin/complaints/${trendingComplaint.id}`,
                            )
                          }
                          variant="outline"
                          className="gap-2"
                        >
                          Admin Panel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* List View */}
            <div className="space-y-3">
              {paginatedItems.map((item) => (
                <Card
                  key={`${item.content_type}-${item.id}`}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-3 p-4">
                    {/* Image Thumbnail */}
                    {item.image_url && (
                      <div className="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2 flex flex-col">
                      {/* Header with Tags */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            variant={
                              item.content_type === "article"
                                ? "default"
                                : "secondary"
                            }
                            className="gap-1"
                          >
                            {item.content_type === "article" ? (
                              <>
                                <Newspaper className="w-3 h-3" />
                                News
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Complaint
                              </>
                            )}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                          {item.status && item.content_type === "complaint" && (
                            <Badge
                              className={
                                item.status === "solved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.status === "processing"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : item.status === "rejected"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {item.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Title & Content */}
                      <Link
                        href={
                          item.content_type === "article"
                            ? `/news/${item.id}`
                            : `/news/${item.id}`
                        }
                      >
                        <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors mt-1">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>

                      {/* Meta Info & Reactions */}
                      <div className="flex items-center justify-between gap-4 flex-wrap pt-1 mt-auto">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {item.barangay && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.barangay}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.created_at))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.view_count}
                          </span>
                          {item.content_type === "complaint" &&
                            item.author_name && (
                              <span>By {item.author_name}</span>
                            )}
                        </div>

                        {/* Reactions Bar */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleReaction(item, "heart");
                            }}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Heart className="w-4 h-4" />
                            <span>{item.reactions?.hearts || 0}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleReaction(item, "thumbs_up");
                            }}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-500 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{item.reactions?.thumbs_up || 0}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleReaction(item, "thumbs_down");
                            }}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-500 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{item.reactions?.thumbs_down || 0}</span>
                          </button>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            <span>{item.comment_count || 0}</span>
                          </span>
                          {isAdmin && item.content_type === "complaint" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/admin/complaints/${item.id}`)
                              }
                              className="gap-1 ml-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Results count */}
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredItems.length)} of{" "}
              {filteredItems.length} items
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
