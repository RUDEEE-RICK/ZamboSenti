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
            return (
              <a
                key={index}
                href={agency.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/40 cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                          {agency.name}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors duration-300" />
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
