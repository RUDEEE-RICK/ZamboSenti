"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface ArticleWithImages extends Article {
  images: string[];
}

interface NewsListProps {
  maxArticles?: number;
  showViewAll?: boolean;
}

export function NewsList({
  maxArticles = 5,
  showViewAll = true,
}: NewsListProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data: articlesData, error: articlesError } = await supabase
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
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(maxArticles);

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

            const images: string[] =
              pictureLinks
                ?.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (link: any) => link.pictures?.image_path as string | undefined
                )
                .filter((img): img is string => Boolean(img)) || [];

            return {
              ...article,
              profiles: Array.isArray(article.profiles)
                ? article.profiles[0]
                : article.profiles,
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

    fetchArticles();
  }, [maxArticles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No articles available yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {articles.map((article, index) => (
        <article
          key={article.id}
          className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
            index === 0 ? "" : ""
          }`}
          onClick={() => router.push(`/news/${article.id}`)}
        >
          <div className="flex gap-3">
            {article.images.length > 0 ? (
              <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={article.images[0]}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">
                  {article.title.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary">
                {article.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {article.content.substring(0, 100)}...
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(article.created_at)}
                </span>
                {article.profiles?.name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {article.profiles.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}

      {showViewAll && articles.length > 0 && (
        <div className="p-3 text-center">
          <Link
            href="/news"
            className="text-sm text-primary hover:underline font-medium"
          >
            View all articles →
          </Link>
        </div>
      )}
    </div>
  );
}
