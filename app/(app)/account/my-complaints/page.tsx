'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, AlertCircle, MapPin, Calendar, ChevronRight, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AnimatedBackground } from '@/components/animated-background';

interface Complaint {
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
    updated_at: string;
    location: string;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    solved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
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
            <div className="min-h-screen bg-background relative overflow-hidden">
                <AnimatedBackground />
                <AppHeader title="My Complaints" showNotifications={false} />
                <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh] relative z-10">
                    <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50">
                        <Loader2 className="w-8 h-8 animate-spin text-vinta-purple" />
                        <p className="text-lg font-medium text-vinta-purple-dark">Loading your complaints...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <AnimatedBackground />
            <AppHeader title="My Complaints" showNotifications={false} />

            <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/account')}
                            className="group mb-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-vinta-purple transition-colors bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
                            Back to Account
                        </button>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vinta-purple-dark to-vinta-pink-dark">
                            My Complaints
                        </h1>
                        <p className="text-muted-foreground mt-1">Track the status of your submitted complaints</p>
                    </div>
                    <Button 
                        onClick={() => router.push('/report')}
                        className="bg-gradient-to-r from-vinta-purple to-vinta-pink hover:from-vinta-purple-dark hover:to-vinta-pink-dark text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Complaint
                    </Button>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50/90 backdrop-blur-sm shadow-sm animate-in slide-in-from-top-2">
                        <div className="p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-900">Error</h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {complaints.length === 0 ? (
                    <Card className="p-12 text-center bg-white/70 backdrop-blur-md border-white/50 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-vinta-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-10 h-10 text-vinta-purple" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">No complaints found</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            You haven&apos;t submitted any complaints yet. If you notice an issue in your community, please report it.
                        </p>
                        <Button 
                            onClick={() => router.push('/report')}
                            className="bg-gradient-to-r from-vinta-purple to-vinta-pink text-white shadow-lg hover:shadow-xl transition-all"
                        >
                            Submit a Report
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {complaints.map((complaint, index) => (
                            <Card 
                                key={complaint.id}
                                className="group relative overflow-hidden bg-white/70 backdrop-blur-md border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => router.push(`/account/my-complaints/${complaint.id}`)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-vinta-purple/5 to-vinta-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge className={`${STATUS_STYLES[complaint.status] || 'bg-gray-100 text-gray-800'} border px-2.5 py-0.5 rounded-full font-medium capitalize shadow-sm`}>
                                            {complaint.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(complaint.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-vinta-purple transition-colors">
                                        {complaint.title}
                                    </h3>
                                    
                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-vinta-purple/70" />
                                            <span className="line-clamp-1">{complaint.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-vinta-purple/70" />
                                            <span className="capitalize">{complaint.category}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm font-medium text-vinta-purple opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        View Details <ChevronRight className="w-4 h-4 ml-1" />
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
