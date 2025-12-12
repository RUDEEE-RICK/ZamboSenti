"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

interface ArticleWithImages extends Article {
  images: string[];
}

export default function NewsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          content,
          created_at,
          profiles (
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

      // Fetch images for each article
      const articlesWithImages = await Promise.all(
        (articlesData || []).map(async (article) => {
          const { data: pictureLinks } = await supabase
            .from("article_pictures")
            .select(
              `
              pictures (
                image_path
              )
            `
            )
            .eq("article_id", article.id);

          const images =
            pictureLinks
              ?.map((link: any) => link.pictures?.image_path)
              .filter(Boolean) || [];

          // Extract profiles (Supabase returns it as array for foreign key joins)
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

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticle = filteredArticles[0];
  const otherArticles = filteredArticles.slice(1);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="News" />

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative max-w-screen-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vinta-purple w-5 h-5" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-vinta-purple/10 border-vinta-purple/20 text-foreground placeholder:text-vinta-purple/50 focus:bg-white focus:border-vinta-purple transition-all rounded-xl h-12"
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Latest News</h2>
          <p className="text-sm text-muted-foreground">
            Latest news and announcements for Zamboanga City
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No articles found matching your search."
                : "No articles available yet."}
            </p>
          </Card>
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <Card
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/news/${featuredArticle.id}`)}
              >
                {featuredArticle.images.length > 0 ? (
                  <div className="relative w-full h-56">
                    <Image
                      src={featuredArticle.images[0]}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-primary via-secondary to-accent relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center p-6">
                        <div className="text-lg font-bold uppercase">
                          {featuredArticle.title.substring(0, 50)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <span className="text-xs text-primary uppercase font-semibold tracking-wide">
                    Featured
                  </span>
                  <h3 className="font-semibold text-lg mt-2 mb-1 text-foreground">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {featuredArticle.content.substring(0, 150)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(featuredArticle.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}{" "}
                    • By {featuredArticle.profiles?.name || "Unknown"}
                  </p>
                </div>
              </Card>
            )}

            {/* Other Articles */}
            {otherArticles.length > 0 && (
              <div className="space-y-4">
                {otherArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/news/${article.id}`)}
                  >
                    <div className="flex gap-4">
                      {article.images.length > 0 && (
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={article.images[0]}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mt-0 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {article.content.substring(0, 120)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(article.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
