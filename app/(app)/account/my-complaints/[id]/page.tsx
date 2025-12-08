'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin, Calendar, Tag, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface Complaint {
    id: string;
    title: string;
    content: string;
    category: string;
    location: string;
    status: string;
    created_at: string;
    updated_at: string;
    admin_feedback?: string;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    solved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_ICONS: Record<string, string> = {
    pending: '⏳',
    processing: '🔄',
    solved: '✓',
    rejected: '✕',
};

export default function ComplaintDetailPage() {
    const router = useRouter();
    const params = useParams();
    const complaintId = params.id as string;

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComplaintDetail = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                router.push('/auth/login');
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('complaints')
                .select('id, title, content, category, location, status, created_at, updated_at')
                .eq('id', complaintId)
                .single();

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            setComplaint(data);

            // Fetch images
            const { data: pictureLinks, error: pictureError } = await supabase
                .from('complaint_pictures')
                .select('picture_id, pictures(image_path)')
                .eq('complaint_id', complaintId);

            if (!pictureError && pictureLinks) {
                const imageUrls = pictureLinks
                    .map((link: { pictures: { image_path: string } | null }) => link.pictures?.image_path)
                    .filter((url): url is string => Boolean(url));
                setImages(imageUrls);
            }
        } catch (err) {
            console.error('Error fetching complaint:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch complaint details');
        } finally {
            setIsLoading(false);
        }
    }, [complaintId, router]);

    useEffect(() => {
        fetchComplaintDetail();
    }, [fetchComplaintDetail]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader title="Complaint Details" showNotifications={false} />
                <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-lg">Loading complaint details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader title="Complaint Not Found" showNotifications={false} />
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <Card className="p-12 text-center">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Complaint Not Found</h3>
                        <p className="text-muted-foreground mb-4">
                            The complaint you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                        </p>
                        <Button onClick={() => router.push('/account/my-complaints')}>
                            Back to My Complaints
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            <AppHeader title="Complaint Details" showNotifications={false} />

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <button
                    onClick={() => router.push('/account/my-complaints')}
                    className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to My Complaints
                </button>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <div className="p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-900">Error</h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                            >
                                Dismiss
                            </Button>
                        </div>
                    </Card>
                )}

                <Card className="overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">{complaint.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Submitted: {new Date(complaint.created_at).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                Updated: {new Date(complaint.updated_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Badge className={`${STATUS_BADGE_COLORS[complaint.status]} border font-medium text-base px-4 py-2`}>
                                {STATUS_ICONS[complaint.status]} {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                            </Badge>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-6">
                        {/* Category and Location */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card className="p-4 bg-secondary/20">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                    <Tag className="w-4 h-4" />
                                    Category
                                </div>
                                <p className="text-lg font-semibold">{complaint.category}</p>
                            </Card>
                            <Card className="p-4 bg-secondary/20">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </div>
                                <p className="text-lg font-semibold">{complaint.location}</p>
                            </Card>
                        </div>

                        {/* Images */}
                        {images.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                                    <FileText className="w-4 h-4" />
                                    Attached Images
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {images.map((imagePath, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <div className="relative w-full h-64">
                                                <Image
                                                    src={imagePath}
                                                    alt={`Complaint image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                                <FileText className="w-4 h-4" />
                                Description
                            </div>
                            <Card className="p-6 bg-secondary/10">
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                    {complaint.content}
                                </p>
                            </Card>
                        </div>

                        {/* Admin Feedback */}
                        {complaint.admin_feedback && (
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                                    <MessageSquare className="w-4 h-4" />
                                    Admin Feedback
                                </div>
                                <Card className="p-6 bg-blue-50 border-blue-200">
                                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                        {complaint.admin_feedback}
                                    </p>
                                </Card>
                            </div>
                        )}

                        {/* Status Info */}
                        <Card className={`p-4 border ${complaint.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                                complaint.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                                    complaint.status === 'solved' ? 'bg-green-50 border-green-200' :
                                        'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-start gap-2">
                                <span className="text-2xl">{STATUS_ICONS[complaint.status]}</span>
                                <div>
                                    <p className={`font-semibold text-sm mb-1 ${complaint.status === 'pending' ? 'text-yellow-900' :
                                            complaint.status === 'processing' ? 'text-blue-900' :
                                                complaint.status === 'solved' ? 'text-green-900' :
                                                    'text-red-900'
                                        }`}>
                                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                    </p>
                                    <p className={`text-sm ${complaint.status === 'pending' ? 'text-yellow-700' :
                                            complaint.status === 'processing' ? 'text-blue-700' :
                                                complaint.status === 'solved' ? 'text-green-700' :
                                                    'text-red-700'
                                        }`}>
                                        {complaint.status === 'pending' && 'Your complaint is pending review by our team.'}
                                        {complaint.status === 'processing' && 'Your complaint is currently being processed by our team.'}
                                        {complaint.status === 'solved' && 'Your complaint has been resolved. Thank you for your report!'}
                                        {complaint.status === 'rejected' && 'Your complaint has been reviewed. Please check the admin feedback for more information.'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Card>
            </div>
        </div>
    );
}
