"use client";

import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { agencies } from "@/lib/data/agencies";
import { ExternalLink } from "lucide-react";

export default function AgenciesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 pb-20">
      <AppHeader title="Government Agencies" />
      
      <div className="p-4 space-y-4">
        {/* Page Description */}
        <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <p className="text-sm text-foreground/80">
            Quick access to official government agency websites and services. Click any agency to visit their portal.
          </p>
        </Card>

        {/* Agencies Grid */}
        <div className="grid gap-4">
          {agencies.map((agency, index) => {
            const IconComponent = agency.icon;
            // Assign a vinta color to each agency based on index
            const colors = [
              'text-vinta-purple bg-vinta-purple/10 group-hover:bg-vinta-purple/20',
              'text-vinta-pink bg-vinta-pink/10 group-hover:bg-vinta-pink/20',
              'text-vinta-orange bg-vinta-orange/10 group-hover:bg-vinta-orange/20',
              'text-vinta-cyan bg-vinta-cyan/10 group-hover:bg-vinta-cyan/20',
              'text-vinta-green bg-vinta-green/10 group-hover:bg-vinta-green/20',
              'text-vinta-yellow bg-vinta-yellow/10 group-hover:bg-vinta-yellow/20'
            ];
            const colorClass = colors[index % colors.length];
            const textColorClass = colorClass.split(' ')[0];

            return (
              <a
                key={index}
                href={agency.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/40 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${colorClass}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-bold text-foreground group-hover:${textColorClass} transition-colors duration-300 line-clamp-2`}>
                          {agency.name}
                        </h3>
                        <ExternalLink className={`w-4 h-4 text-muted-foreground group-hover:${textColorClass} flex-shrink-0 mt-1 transition-colors duration-300`} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {agency.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
