'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Loader2, Calendar, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface Article {
    id: string;
    title: string;
    content: string;
    created_at: string;
    profiles: {
        name: string;
    };
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
    }, [articleId]);

    const fetchArticleDetails = async () => {
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            // Fetch article
            const { data: articleData, error: articleError } = await supabase
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
                .eq('id', articleId)
                .is('deleted_at', null)
                .single();

            if (articleError) {
                throw new Error('Article not found');
            }

            if (!articleData) {
                throw new Error('Article not found');
            }

            setArticle(articleData);

            // Fetch images
            const { data: pictureLinks, error: pictureError } = await supabase
                .from('article_pictures')
                .select(`
                    pictures (
                        image_path
                    )
                `)
                .eq('article_id', articleId);

            if (!pictureError && pictureLinks) {
                const imageUrls = pictureLinks
                    .map((link: any) => link.pictures?.image_path)
                    .filter(Boolean);
                setImages(imageUrls);
            }
        } catch (err) {
            console.error('Error fetching article:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch article');
        } finally {
            setIsLoading(false);
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

    if (error || !article) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader title="Article Not Found" showNotifications={false} />
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                        <h2 className="text-lg font-bold text-red-900 mb-2">Article Not Found</h2>
                        <p className="text-red-700 mb-4">{error || 'The article you are looking for does not exist.'}</p>
                        <Button onClick={() => router.push('/news')} variant="outline">
                            Back to News
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader title="News" showNotifications={false} />

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <button
                    onClick={() => router.push('/news')}
                    className="text-sm text-primary font-medium flex items-center gap-2 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to News
                </button>

                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b p-6">
                        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(article.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                By {article.profiles?.name || 'Unknown'}
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
                    </div>
                </Card>
            </div>
        </div>
    );
}
