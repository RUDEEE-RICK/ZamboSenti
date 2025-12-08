'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, Loader2, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Complaint {
    id: string;
    title: string;
    content: string;
    category: string;
    location: string;
    status: string;
    created_at: string;
    user_id: string;
    profiles: {
        name: string;
        email: string;
    };
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'processing', label: 'Processing', icon: '🔄' },
    { value: 'solved', label: 'Solved', icon: '✓' },
    { value: 'rejected', label: 'Rejected', icon: '✕' }
];


const STATUS_BADGE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    solved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function AdminComplaintsPage() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    const checkAdminAndFetchComplaints = useCallback(async () => {
        const supabase = createClient();

        try {
            // Check if user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                router.push('/auth/login');
                return;
            }

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_roles')
                .eq('id', user.id)
                .single();

            if (profileError || !profile || profile.user_roles !== 'admin') {
                setIsAdmin(false);
                setError('Access denied. You do not have admin privileges.');
                setIsLoading(false);
                return;
            }

            setIsAdmin(true);
            await fetchComplaints();
        } catch (err) {
            console.error('Error checking admin status:', err);
            setError('Failed to verify admin status');
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        checkAdminAndFetchComplaints();
    }, [checkAdminAndFetchComplaints]);

    const fetchComplaints = async () => {
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            const { data: complaintsData, error: fetchError } = await supabase
                .from('complaints')
                .select('id, title, content, category, location, status, created_at, user_id')
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            if (!complaintsData || complaintsData.length === 0) {
                setComplaints([]);
                return;
            }

            // Fetch all user profiles
            const userIds = [...new Set(complaintsData.map(c => c.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // Map profiles to complaints
            const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
            const complaintsWithProfiles = complaintsData.map(complaint => ({
                ...complaint,
                profiles: profilesMap.get(complaint.user_id) || { name: '', email: '' }
            }));

            setComplaints(complaintsWithProfiles);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch complaints');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader title="Admin - Manage Complaints" showNotifications={false} />
                <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-lg">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader title="Access Denied" showNotifications={false} />
                <div className="max-w-screen-xl mx-auto px-4 py-6">
                    <Card className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-red-900 mb-2">Access Denied</h3>
                                <p className="text-red-700 mb-4">
                                    You do not have permission to access this page. Admin privileges are required.
                                </p>
                                <Button onClick={() => router.push('/')} variant="outline">
                                    Go to Home
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            <AppHeader title="Admin Dashboard" showNotifications={false} />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/account')}
                            className="mb-2 text-sm text-muted-foreground hover:text-primary font-medium flex items-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Account
                        </button>
                        <h1 className="text-3xl font-bold text-foreground">Complaints Management</h1>
                        <p className="text-muted-foreground mt-1">Monitor and manage all citizen complaints in Zamboanga City</p>
                    </div>

                    {/* Stats Summary */}
                    <div className="flex gap-2">
                        <Card className="px-4 py-2 bg-white">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">{complaints.length}</p>
                        </Card>
                        <Card className="px-4 py-2 bg-yellow-50">
                            <p className="text-xs text-yellow-700">Pending</p>
                            <p className="text-2xl font-bold text-yellow-800">
                                {complaints.filter(c => c.status === 'pending').length}
                            </p>
                        </Card>
                    </div>
                </div>

                {/* Error Message */}
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

                {/* Complaints Table */}
                {complaints.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No complaints yet</h3>
                            <p className="text-muted-foreground text-sm">When citizens submit complaints, they will appear here.</p>
                        </div>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-border">
                                    {complaints.map((complaint) => (
                                        <tr
                                            key={complaint.id}
                                            className="hover:bg-secondary/30 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/admin/complaints/${complaint.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-foreground max-w-xs truncate">
                                                    {complaint.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    by {complaint.profiles?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                {complaint.category}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                                                {complaint.location}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${STATUS_BADGE_COLORS[complaint.status]} border font-medium`}>
                                                    {STATUS_OPTIONS.find(s => s.value === complaint.status)?.icon} {complaint.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {new Date(complaint.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/admin/complaints/${complaint.id}`);
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
