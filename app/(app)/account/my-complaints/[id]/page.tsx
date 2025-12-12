'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin, Calendar, Tag, FileText, AlertCircle, MessageSquare, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { AnimatedBackground } from '@/components/animated-background';

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

const STATUS_STEPS = ['pending', 'processing', 'solved'];

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; description: string }> = {
    pending: {
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        icon: Clock,
        label: 'Pending Review',
        description: 'Your complaint has been received and is waiting for review.'
    },
    processing: {
        color: 'text-blue-600 bg-blue-100 border-blue-200',
        icon: Loader2,
        label: 'In Progress',
        description: 'We are currently working on resolving your issue.'
    },
    solved: {
        color: 'text-green-600 bg-green-100 border-green-200',
        icon: CheckCircle2,
        label: 'Resolved',
        description: 'This issue has been successfully resolved.'
    },
    rejected: {
        color: 'text-red-600 bg-red-100 border-red-200',
        icon: XCircle,
        label: 'Rejected',
        description: 'This complaint could not be processed. See feedback for details.'
    },
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

            // Fetch feedback separately from complaint_feedback table
            const { data: feedbackData } = await supabase
                .from('complaint_feedback')
                .select('feedback, created_at')
                .eq('complaint_id', complaintId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setComplaint({
                ...data,
                admin_feedback: feedbackData?.feedback || null
            });

            // Fetch images
            const { data: pictureLinks, error: pictureError } = await supabase
                .from('complaint_pictures')
                .select('picture_id, pictures(image_path)')
                .eq('complaint_id', complaintId);

            if (!pictureError && pictureLinks) {
                const imageUrls = pictureLinks
                    .flatMap((link: any) => {
                        const pics = link.pictures;
                        if (Array.isArray(pics)) {
                            return pics.map((p: any) => p.image_path).filter(Boolean);
                        }
                        return pics?.image_path ? [pics.image_path] : [];
                    });
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
            <div className="min-h-screen bg-background relative overflow-hidden">
                <AnimatedBackground />
                <AppHeader title="Complaint Details" showNotifications={false} />
                <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh] relative z-10">
                    <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50">
                        <Loader2 className="w-8 h-8 animate-spin text-vinta-purple" />
                        <p className="text-lg font-medium text-vinta-purple-dark">Loading details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden">
                <AnimatedBackground />
                <AppHeader title="Complaint Not Found" showNotifications={false} />
                <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
                    <Card className="p-12 text-center bg-white/80 backdrop-blur-md border-white/50 shadow-xl">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Complaint Not Found</h3>
                        <p className="text-muted-foreground mb-6">
                            The complaint you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                        </p>
                        <Button 
                            onClick={() => router.push('/account/my-complaints')}
                            className="bg-gradient-to-r from-vinta-purple to-vinta-pink text-white shadow-lg hover:shadow-xl transition-all"
                        >
                            Back to My Complaints
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <AnimatedBackground />
            <AppHeader title="Complaint Details" showNotifications={false} />

            <div className="max-w-5xl mx-auto px-4 py-8 relative z-10 space-y-6">
                <button
                    onClick={() => router.push('/account/my-complaints')}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-vinta-purple transition-colors bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
                    Back to My Complaints
                </button>

                {error && (
                    <Card className="border-red-200 bg-red-50/90 backdrop-blur-sm shadow-sm animate-in slide-in-from-top-2">
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

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden bg-white/70 backdrop-blur-md border-white/50 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{complaint.title}</h1>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-vinta-purple" />
                                                <span>
                                                    {new Date(complaint.created_at).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-vinta-purple" />
                                                <span>
                                                    {new Date(complaint.created_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-vinta-purple-dark uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Description
                                        </h3>
                                        <div className="bg-white/50 rounded-xl p-5 border border-white/60 shadow-inner">
                                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                                {complaint.content}
                                            </p>
                                        </div>
                                    </div>

                                    {images.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-vinta-purple-dark uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> Evidence
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {images.map((imagePath, index) => (
                                                    <div key={index} className="group relative aspect-video rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-white/50">
                                                        <Image
                                                            src={imagePath}
                                                            alt={`Complaint image ${index + 1}`}
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Admin Feedback Section */}
                        {complaint.admin_feedback && (
                            <Card className="overflow-hidden bg-blue-50/80 backdrop-blur-md border-blue-100 shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-500">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" />
                                        Admin Response
                                    </h3>
                                    <div className="bg-white/60 rounded-xl p-5 border border-blue-100 shadow-sm">
                                        <p className="text-blue-900 leading-relaxed whitespace-pre-wrap">
                                            {complaint.admin_feedback}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-blue-100 text-xs text-blue-700 flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Official response from ZamboSenti Administration
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Status */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-white/70 backdrop-blur-md border-white/50 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current Status</h3>
                                <div className={`rounded-xl p-4 border ${statusConfig.color} mb-6`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusIcon className="w-6 h-6" />
                                        <span className="font-bold text-lg">{statusConfig.label}</span>
                                    </div>
                                    <p className="text-sm opacity-90">
                                        {statusConfig.description}
                                    </p>
                                </div>

                                {/* Timeline */}
                                {complaint.status !== 'rejected' && (
                                    <div className="relative pl-4 border-l-2 border-muted/30 space-y-8 my-8">
                                        {STATUS_STEPS.map((step, index) => {
                                            const isCompleted = STATUS_STEPS.indexOf(complaint.status) >= index;
                                            const isCurrent = complaint.status === step;
                                            
                                            return (
                                                <div key={step} className="relative">
                                                    <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
                                                        isCompleted ? 'bg-vinta-purple border-vinta-purple' : 'bg-background border-muted'
                                                    }`} />
                                                    <div className={`transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                                        <p className="text-sm font-medium capitalize leading-none">{step}</p>
                                                        {isCurrent && (
                                                            <p className="text-xs text-vinta-purple mt-1 font-medium">Current Stage</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="space-y-4 pt-6 border-t border-muted/20">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                                            <Tag className="w-4 h-4" /> Category
                                        </div>
                                        <p className="font-medium">{complaint.category}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                                            <MapPin className="w-4 h-4" /> Location
                                        </div>
                                        <p className="font-medium">{complaint.location}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
