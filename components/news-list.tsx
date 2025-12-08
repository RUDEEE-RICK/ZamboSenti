'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

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

export function NewsList({ maxArticles = 5, showViewAll = true }: NewsListProps) {
    const router = useRouter();
    const [articles, setArticles] = useState<ArticleWithImages[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            setIsLoading(true);
            const supabase = createClient();

            try {
                const { data: articlesData, error: articlesError } = await supabase
                    .from('articles')
                    .select(`
                            id,
                            title,
                            content,
                            created_at,
                            profiles (
                                name
                            )
                            `)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .limit(maxArticles);

                if (articlesError) {
                    console.error('Error fetching articles:', articlesError);
                    return;
                }

                const articlesWithImages = await Promise.all(
                    (articlesData || []).map(async (article) => {
                        const { data: pictureLinks } = await supabase
                            .from('article_pictures')
                            .select(`
                            pictures (
                                image_path
                            )
                            `)
                            .eq('article_id', article.id);

                        const images = pictureLinks?.map((link: { pictures: { image_path: string }[] }) => link.pictures[0]?.image_path).filter(Boolean) || [];

                        return {
                            ...article,
                            profiles: Array.isArray(article.profiles) ? article.profiles[0] : article.profiles,
                            images,
                        };
                    })
                );

                setArticles(articlesWithImages);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchArticles();
    }, [maxArticles]);

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading articles...</p>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">No articles available yet.</p>
            </Card>
        );
    }

    const featuredArticle = articles[0];
    const otherArticles = articles.slice(1);

    return (
        <div className="space-y-4">
            {/* Featured Article */}
            {featuredArticle && (
                <Card
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/news/${featuredArticle.id}`)}
                >
                    {featuredArticle.images.length > 0 ? (
                        <div className="relative w-full h-48">
                            <Image
                                src={featuredArticle.images[0]}
                                alt={featuredArticle.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary via-teal-600 to-cyan-700 relative">
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
                        <h4 className="font-semibold text-lg mt-2 mb-1 text-foreground">
                            {featuredArticle.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {featuredArticle.content.substring(0, 120)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(featuredArticle.created_at)} • By {featuredArticle.profiles?.name || 'Unknown'}
                        </p>
                    </div>
                </Card>
            )}

            {/* Other Articles */}
            {otherArticles.map((article) => (
                <Card
                    key={article.id}
                    className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/news/${article.id}`)}
                >
                    <div className="flex gap-4">
                        {article.images.length > 0 && (
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                <Image
                                    src={article.images[0]}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="font-semibold mt-0 mb-1 text-foreground">{article.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                {article.content.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(article.created_at)}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}

            {/* View All Link */}
            {showViewAll && articles.length > 0 && (
                <div className="text-center pt-2">
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
