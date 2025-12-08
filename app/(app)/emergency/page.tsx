'use client';

import { useState } from 'react';
import { Search, Phone, Copy, ChevronRight, ChevronLeft } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { emergencyContacts } from '@/lib/data/mockData';
import Image from 'next/image';

const safetyProcedures = [
  { id: 1, title: 'Cybersecurity', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/cybersecurity.jpg' },
  { id: 2, title: 'Earthquake', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/earthquake.jpg' },
  { id: 3, title: 'Electrical', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/electrical.jpg' },
  { id: 4, title: 'Fire', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/fire.jpg' },
  { id: 5, title: 'Flood', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/flood.jpg' },
  { id: 6, title: 'Heatwave', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/heatwave.jpg' },
  { id: 7, title: 'Medical', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/medical.jpg' },
  { id: 8, title: 'Storm', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/storm.jpg' },
  { id: 9, title: 'Tsunami', url: 'https://cuzoldkpmrflclcfzgqx.supabase.co/storage/v1/object/public/safety-procedure/image/tsunami.jpg' },
];

export default function EmergencyPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    // Could add a toast notification here
  };

  const handleCallNumber = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, '')}`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % safetyProcedures.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + safetyProcedures.length) % safetyProcedures.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Emergency" />

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative max-w-screen-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pb-6 space-y-6">

        {/* Safety Procedures Gallery */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100 uppercase tracking-wide">Safety Procedures</h3>
            <div className="flex gap-2">
              <button
                onClick={prevImage}
                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded shadow-sm hover:shadow-md transition-shadow"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={nextImage}
                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded shadow-sm hover:shadow-md transition-shadow"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900">
              <Image
                src={safetyProcedures[currentImageIndex].url}
                alt={safetyProcedures[currentImageIndex].title}
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1920px"
                loading='lazy'
              />

            </div>
          </div>

          <div className="flex justify-center gap-1.5 mt-3">
            {safetyProcedures.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-1.5 rounded-full transition-all ${index === currentImageIndex
                  ? 'bg-blue-600 dark:bg-blue-400 w-6'
                  : 'bg-blue-300 dark:bg-blue-700 w-1.5'
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* COMCEN Hotlines */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">COMCEN Hotlines</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The Central Communications Center is also available for emergency assistance and other urgent concerns.
          </p>

          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{contact.label}: </span>
                  <span className="text-base font-semibold">{contact.number}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-10 w-10 hover:bg-primary/10"
                    onClick={() => handleCallNumber(contact.number)}
                    aria-label={`Call ${contact.number}`}
                  >
                    <Phone className="w-5 h-5 text-primary" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-10 w-10"
                    onClick={() => handleCopyNumber(contact.number)}
                    aria-label={`Copy ${contact.number}`}
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
