'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Complaint {
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
    updated_at: string;
    location: string;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    solved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function MyComplaintsPage() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserComplaints = useCallback(async () => {
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
                .select('id, title, category, status, created_at, updated_at, location')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            setComplaints(data || []);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch complaints');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUserComplaints();
    }, [fetchUserComplaints]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader title="My Complaints" showNotifications={false} />
                <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-lg">Loading your complaints...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            <AppHeader title="My Complaints" showNotifications={false} />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/account')}
                            className="mb-2 text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Account
                        </button>
                        <h1 className="text-3xl font-bold text-foreground">My Complaints</h1>
                        <p className="text-muted-foreground mt-1">Track the status of your submitted complaints</p>
                    </div>
                </div>

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

                {complaints.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No complaints yet</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                You haven&apos;t submitted any complaints yet. Start by reporting an issue.
                            </p>
                            <Button onClick={() => router.push('/report')}>
                                Submit a Complaint
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {complaints.map((complaint) => (
                            <Card
                                key={complaint.id}
                                className="p-4 hover:bg-secondary/50 transition-all cursor-pointer border"
                                onClick={() => router.push(`/account/my-complaints/${complaint.id}`)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base text-foreground mb-1 truncate">
                                            {complaint.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{new Date(complaint.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}</span>
                                            <span>•</span>
                                            <span>{new Date(complaint.created_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${STATUS_BADGE_COLORS[complaint.status]} border font-medium text-xs px-2 py-1`}>
                                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs px-2 h-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/account/my-complaints/${complaint.id}`);
                                            }}
                                        >
                                            Edit
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
