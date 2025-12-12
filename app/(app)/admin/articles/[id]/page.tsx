"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (articleId) {
      fetchArticleDetails();
    }
  }, [articleId]);

  const fetchArticleDetails = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Verify admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_roles")
        .eq("id", user.id)
        .single();

      if (!profile || profile.user_roles !== "admin") {
        setError("Access denied. Admin privileges required.");
        setIsLoading(false);
        return;
      }

      // Fetch article
      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select(
          `
                    id,
                    title,
                    content,
                    created_at,
                    user_id,
                    profiles (
                        name,
                        email
                    )
                `
        )
        .eq("id", articleId)
        .is("deleted_at", null)
        .single();

      if (articleError) {
        throw new Error(`Failed to fetch article: ${articleError.message}`);
      }

      if (!articleData) {
        throw new Error("Article not found");
      }

      // Extract profiles (Supabase returns it as array for foreign key joins)
      const profiles = Array.isArray(articleData.profiles)
        ? articleData.profiles[0] || null
        : articleData.profiles;

      setArticle({
        ...articleData,
        profiles,
      });

      // Fetch images
      const { data: pictureLinks, error: pictureError } = await supabase
        .from("article_pictures")
        .select(
          `
                    picture_id,
                    pictures (
                        image_path
                    )
                `
        )
        .eq("article_id", articleId);

      if (!pictureError && pictureLinks) {
        const imageUrls = pictureLinks
          .map((link: any) => link.pictures?.image_path)
          .filter(Boolean);
        setImages(imageUrls);
      }
    } catch (err) {
      console.error("Error fetching article:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch article details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this article? This action cannot be undone."
      )
    ) {
      return;
    }

    const supabase = createClient();
    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from("articles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", articleId);

      if (deleteError) {
        throw new Error(`Failed to delete article: ${deleteError.message}`);
      }

      router.push("/admin/articles");
    } catch (err) {
      console.error("Error deleting article:", err);
      setError(err instanceof Error ? err.message : "Failed to delete article");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Error" showNotifications={false} />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card className="border-red-200 bg-red-50 p-6">
            <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
            <h2 className="text-lg font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mt-4"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Article Details" showNotifications={false} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={() => router.push("/admin/articles")}
          className="text-sm text-primary font-medium flex items-center gap-2 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </button>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10 p-6">
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(article.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                By {article.profiles?.name || "Unknown"}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative w-full h-64">
                    <Image
                      src={imageUrl}
                      alt={`Article image ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div>
              <MarkdownRenderer content={article.content} />
            </div>

            {/* Admin Actions */}
            <div className="pt-6 border-t">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Article
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
