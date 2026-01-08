"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "@/lib/utils/date";
import Image from "next/image";
import Link from "next/link";

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
  status: string | null;
  user_id: string | null;
  is_anonymous: boolean | null;
  guest_name: string | null;
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

export default function HubPage() {
  const [items, setItems] = useState<HubItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  useEffect(() => {
    fetchHubContent();
  }, [sortBy, filterBy]);

  const fetchArticles = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          content,
          created_at,
          user_id,
          profiles:user_id (
            name
          )
        `
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (articlesError) {
        console.error("Error fetching articles:", articlesError);
        return;
      }

      const articlesWithImages = await Promise.all(
        (articlesData || []).map(async (article) => {
          const { data: pictureLinks } = await supabase
            .from("article_pictures")
            .select(
              `
              pictures:picture_id (
                image_path
              )
            `
            )
            .eq("article_id", article.id);

          const images =
            pictureLinks
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ?.map((link: any) => link.pictures?.image_path)
              .filter(Boolean) || [];

          const profiles = Array.isArray(article.profiles)
            ? article.profiles[0] || null
            : article.profiles;

          return {
            ...article,
            profiles,
            images,
          };
        })
      );

      setArticles(articlesWithImages);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each image must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...files],
    }));
    setError(null);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingId) {
        // Update existing article
        const { error: updateError } = await supabase
          .from("articles")
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
          })
          .eq("id", editingId);

        if (updateError) throw updateError;

        // Handle images for edit (simplified - you may want to delete old images first)
        if (formData.imageFiles.length > 0) {
          for (const imageFile of formData.imageFiles) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } =
              await supabase.storage
                .from("article-images")
                .upload(fileName, imageFile);

            if (uploadError) {
              console.error("Upload error:", uploadError);
              throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("article-images").getPublicUrl(fileName);

            const { data: pictureData, error: pictureError } = await supabase
              .from("pictures")
              .insert({ 
                image_path: publicUrl,
                parent_type: 'article',
                parent_id: editingId
              })
              .select()
              .single();

            if (pictureError) {
              console.error("Picture insert error:", pictureError);
              throw new Error(`Failed to save image record: ${pictureError.message}`);
            }

            const { error: linkError } = await supabase.from("article_pictures").insert({
              article_id: editingId,
              picture_id: pictureData.id,
            });

            if (linkError) {
              console.error("Link error:", linkError);
              throw new Error(`Failed to link image: ${linkError.message}`);
            }
          }
        }
      } else {
        // Create new article
        const { data: articleData, error: insertError } = await supabase
          .from("articles")
          .insert({
            title: formData.title.trim(),
            content: formData.content.trim(),
            user_id: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Upload images
        if (formData.imageFiles.length > 0) {
          for (const imageFile of formData.imageFiles) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } =
              await supabase.storage
                .from("article-images")
                .upload(fileName, imageFile);

            if (uploadError) {
              console.error("Upload error:", uploadError);
              throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("article-images").getPublicUrl(fileName);

            const { data: pictureData, error: pictureError } = await supabase
              .from("pictures")
              .insert({ 
                image_path: publicUrl,
                parent_type: 'article',
                parent_id: articleData.id
              })
              .select()
              .single();

            if (pictureError) {
              console.error("Picture insert error:", pictureError);
              throw new Error(`Failed to save image record: ${pictureError.message}`);
            }

            const { error: linkError } = await supabase.from("article_pictures").insert({
              article_id: articleData.id,
              picture_id: pictureData.id,
            });

            if (linkError) {
              console.error("Link error:", linkError);
              throw new Error(`Failed to link image: ${linkError.message}`);
            }
          }
        }
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      setImagePreviews([]);
      await fetchArticles();
    } catch (err) {
      console.error("Error saving article:", err);
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (article: ArticleWithImages) => {
    setFormData({
      title: article.title,
      content: article.content,
      imageFiles: [],
    });
    setImagePreviews([]);
    setEditingId(article.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    setDeletingId(id);
    const supabase = createClient();

    try {
      const { error: deleteError } = await supabase
        .from("articles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchArticles();
    } catch (err) {
      console.error("Error deleting article:", err);
      setError("Failed to delete article");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setImagePreviews([]);
    setError(null);
  };

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticle = filteredArticles[0];
  const otherArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <AppHeader title="News" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header with Admin Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Latest news and announcements for Zamboanga City
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Article
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-gray-200"
          />
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
              {editingId ? "Edit Article" : "Add New Article"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Article title"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Article content"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Images
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload Images</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                      {editingId ? "Update" : "Create"}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading articles...</span>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No articles found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No articles found matching your search."
                : "No articles available yet."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Featured Article */}
            {featuredArticle && (
              <Card className="overflow-hidden border-gray-100">
                <div className="relative">
                  {featuredArticle.images.length > 0 ? (
                    <div
                      className="relative w-full aspect-[2/1] cursor-pointer"
                      onClick={() => router.push(`/news/${featuredArticle.id}`)}
                    >
                      <Image
                        src={featuredArticle.images[0]}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-[2/1] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center cursor-pointer"
                      onClick={() => router.push(`/news/${featuredArticle.id}`)}
                    >
                      <span className="text-primary font-bold text-4xl opacity-30">
                        {featuredArticle.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge variant="secondary">Featured</Badge>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(featuredArticle)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(featuredArticle.id)}
                          disabled={deletingId === featuredArticle.id}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                        >
                          {deletingId === featuredArticle.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <h3
                    className="font-semibold text-lg text-foreground mb-2 cursor-pointer hover:text-primary"
                    onClick={() => router.push(`/news/${featuredArticle.id}`)}
                  >
                    {featuredArticle.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {featuredArticle.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(featuredArticle.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    {featuredArticle.profiles?.name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {featuredArticle.profiles.name}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Other Articles */}
            {otherArticles.length > 0 && (
              <div className="space-y-2">
                {otherArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="p-4 card-hover border-gray-100"
                  >
                    <div className="flex gap-4">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`/news/${article.id}`)}
                      >
                        <div className="flex gap-3 mb-2">
                          {article.images.length > 0 ? (
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={article.images[0]}
                                alt={article.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <span className="text-primary font-bold text-xl">
                                {article.title.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground mb-1 line-clamp-2 hover:text-primary">
                              {article.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {article.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(article.created_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                              {article.profiles?.name && (
                                <span>{article.profiles.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 flex-shrink-0 items-start">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(article)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(article.id)}
                            disabled={deletingId === article.id}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                          >
                            {deletingId === article.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
