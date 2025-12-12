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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSafetyProcedures = safetyProcedures.filter(proc => 
    proc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = emergencyContacts.filter(contact => 
    contact.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.number.includes(searchQuery)
  );

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    // Could add a toast notification here
  };

  const handleCallNumber = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, '')}`;
  };

  const nextImage = () => {
    if (filteredSafetyProcedures.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % filteredSafetyProcedures.length);
  };

  const prevImage = () => {
    if (filteredSafetyProcedures.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + filteredSafetyProcedures.length) % filteredSafetyProcedures.length);
  };

  // Reset index when search changes
  if (currentImageIndex >= filteredSafetyProcedures.length && filteredSafetyProcedures.length > 0) {
    setCurrentImageIndex(0);
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Emergency" />

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative max-w-screen-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vinta-purple w-5 h-5" />
          <Input
            type="search"
            placeholder="Search safety procedures or hotlines..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentImageIndex(0);
            }}
            className="pl-10 bg-vinta-purple/10 border-vinta-purple/20 text-foreground placeholder:text-vinta-purple/50 focus:bg-white focus:border-vinta-purple transition-all rounded-xl h-12"
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 space-y-6">
        {/* Safety Procedures Carousel */}
        {filteredSafetyProcedures.length > 0 && (
          <Card className="p-4 bg-blue-50/50 border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-vinta-purple uppercase tracking-wide text-sm">Safety Procedures</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg bg-white" 
                  onClick={prevImage}
                  disabled={filteredSafetyProcedures.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg bg-white" 
                  onClick={nextImage}
                  disabled={filteredSafetyProcedures.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white shadow-inner border border-gray-100">
              <Image
                src={filteredSafetyProcedures[currentImageIndex].url}
                alt={filteredSafetyProcedures[currentImageIndex].title}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
              {filteredSafetyProcedures.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? 'w-6 bg-vinta-purple' : 'w-1.5 bg-vinta-purple/20'
                  }`} 
                />
              ))}
            </div>
            <div className="text-center mt-2 font-medium text-vinta-purple">
              {filteredSafetyProcedures[currentImageIndex].title}
            </div>
          </Card>
        )}

        {/* Hotlines */}
        {filteredContacts.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">COMCEN Hotlines</h3>
              <p className="text-sm text-muted-foreground">
                The Central Communications Center is also available for emergency assistance and other urgent concerns.
              </p>
            </div>

            <div className="space-y-3">
              {filteredContacts.map((contact, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="bg-gradient-to-r from-vinta-purple to-vinta-pink p-4 flex items-center justify-between text-white">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium opacity-90">{contact.label}</span>
                      <span className="text-xl font-bold tracking-wide">{contact.number}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        onClick={() => handleCallNumber(contact.number)}
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        onClick={() => handleCopyNumber(contact.number)}
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredSafetyProcedures.length === 0 && filteredContacts.length === 0 && (
           <div className="text-center py-10 text-muted-foreground">
             No results found for "{searchQuery}"
           </div>
        )}
      </div>
    </div>
  );
}
