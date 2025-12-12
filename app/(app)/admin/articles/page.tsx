"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
  } | null;
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filterAndSortArticles = useCallback(() => {
    let filtered = [...articles];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredArticles(filtered);
  }, [articles, searchQuery, sortOrder]);

  const checkAdminAndFetchArticles = useCallback(async () => {
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
      await fetchArticles();
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Failed to verify admin status");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    checkAdminAndFetchArticles();
  }, [checkAdminAndFetchArticles]);

  useEffect(() => {
    filterAndSortArticles();
  }, [filterAndSortArticles]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const fetchArticles = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("articles")
        .select(
          `
                    id,
                    title,
                    content,
                    created_at,
                    user_id,
                    profiles (
                        name
                    )
                `
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch articles: ${fetchError.message}`);
      }

      // Transform profiles from array to object
      const transformedData = (data || []).map((article) => ({
        ...article,
        profiles: Array.isArray(article.profiles)
          ? article.profiles[0] || null
          : article.profiles,
      }));

      setArticles(transformedData);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this article? This action cannot be undone."
      )
    ) {
      return;
    }

    const supabase = createClient();
    setDeletingId(articleId);

    try {
      const { error: deleteError } = await supabase
        .from("articles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", articleId);

      if (deleteError) {
        throw new Error(`Failed to delete article: ${deleteError.message}`);
      }

      // Refresh articles list
      await fetchArticles();
    } catch (err) {
      console.error("Error deleting article:", err);
      setError(err instanceof Error ? err.message : "Failed to delete article");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Access Denied" showNotifications={false} />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="border-red-200 bg-red-50">
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-900 mb-2">
                Access Denied
              </h2>
              <p className="text-red-700 mb-4">
                You do not have permission to access this page. Admin privileges
                are required.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Go to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <AppHeader title="Article Management" showNotifications={false} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search articles by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={toggleSortOrder}
            className="w-full sm:w-auto"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        {/* Create Article Button */}
        <Link href="/admin/articles/create">
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create New Article
          </Button>
        </Link>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Articles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No articles found matching your search."
                : "No articles found. Create your first article!"}
            </p>
            {!searchQuery && (
              <Link href="/admin/articles/create">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <Link href={`/admin/articles/${article.id}`}>
                      <h3 className="text-xl font-bold mb-2 hover:text-primary cursor-pointer">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                      <span>By {article.profiles?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Link href={`/admin/articles/${article.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteArticle(article.id)}
                      disabled={deletingId === article.id}
                    >
                      {deletingId === article.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
