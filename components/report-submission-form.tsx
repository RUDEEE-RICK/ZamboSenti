'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ChevronRight, FileText } from 'lucide-react';

export function ReportSubmissionForm() {
    return (
        <Link href="/report">
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-foreground">Report an Issue</h3>
                                <p className="text-sm text-muted-foreground">Submit a complaint to address it promptly</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}
