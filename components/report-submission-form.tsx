'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ChevronRight, FileText } from 'lucide-react';

export function ReportSubmissionForm() {
    return (
        <Link href="/report">
            <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-primary/20 group">
                <div className="bg-gradient-to-r from-white to-primary/5">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">Report an Issue</h3>
                                <p className="text-sm text-muted-foreground">Submit a complaint to address it promptly</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}
