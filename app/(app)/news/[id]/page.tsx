"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Loader2, Calendar, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (articleId) {
      fetchArticleDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const fetchArticleDetails = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          content,
          created_at,
          profiles:user_id (
            name
          )
        `
        )
        .eq("id", articleId)
        .is("deleted_at", null)
        .single();

      if (articleError) {
        throw new Error("Article not found");
      }

      if (!articleData) {
        throw new Error("Article not found");
      }

      const profiles = Array.isArray(articleData.profiles)
        ? articleData.profiles[0] || null
        : articleData.profiles;

      setArticle({
        ...articleData,
        profiles,
      });

      const { data: pictureLinks, error: pictureError } = await supabase
        .from("article_pictures")
        .select(
          `
          pictures:picture_id (
            image_path
          )
        `
        )
        .eq("article_id", articleId);

      if (!pictureError && pictureLinks) {
        const imageUrls = pictureLinks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((link: any) => link.pictures?.image_path)
          .filter(Boolean);
        setImages(imageUrls);
      }
    } catch (err) {
      console.error("Error fetching article:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch article");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="News" showNotifications={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading article...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen pb-24 md:pb-8">
        <AppHeader title="Article Not Found" showNotifications={false} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Card className="border-rose-200 bg-rose-50 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-rose-900 mb-2">
              Article Not Found
            </h2>
            <p className="text-sm text-rose-700 mb-4">
              {error || "The article you are looking for does not exist."}
            </p>
            <Button onClick={() => router.push("/news")} variant="outline">
              Back to News
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <AppHeader title="News" showNotifications={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/news")}
          className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </button>

        {/* Article Card */}
        <Card className="overflow-hidden border-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {article.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(article.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {article.profiles?.name && (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  By {article.profiles.name}
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
                      alt={`Article image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={article.content} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
