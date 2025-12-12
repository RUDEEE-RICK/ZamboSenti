"use client";

import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/headless/Input";
import { Card } from "@/components/ui/card";
import {
  eServices,
  popularServices,
  featuredServices,
  serviceCategories,
} from "@/lib/data/mockData";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Services" />

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="max-w-screen-xl mx-auto">
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-5 h-5" />}
            className="bg-white"
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pb-6 space-y-8">
        {/* e-Services */}
        <section>
          <h3 className="text-lg font-semibold mb-2">e-Services</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Login to the Online Services portal to get permits, pay taxes, or
            request official personal records
          </p>
          <div className="grid grid-cols-3 gap-3">
            {eServices.map((service) => (
              <Card
                key={service.id}
                className="p-4 flex flex-col items-center text-center hover:bg-secondary/80 transition-colors cursor-pointer border-none shadow-sm"
              >
                <span className="text-3xl mb-2">{service.icon}</span>
                <h4 className="text-xs font-medium">{service.title}</h4>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Services */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Popular Services</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Avail city services in just a few taps.
          </p>
          <div className="space-y-3">
            {popularServices.map((service) => (
              <Card
                key={service.id}
                className="p-4 flex items-center gap-4 hover:bg-secondary/80 transition-colors cursor-pointer border-none shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {service.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Services */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Featured Services</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Quick guides and downloadable forms for other essential city
            services.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {featuredServices.map((service) => (
              <Card
                key={service.id}
                className="p-4 hover:bg-secondary/80 transition-colors cursor-pointer border-none shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <h4 className="text-sm font-semibold">{service.title}</h4>
              </Card>
            ))}
          </div>
        </section>

        {/* Guide to All Services */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Guide to All Services</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Requirements and procedures for availing Naga City Services.
          </p>
          <div className="space-y-2">
            {serviceCategories.map((category) => (
              <Card
                key={category.id}
                className="overflow-hidden border-none shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm">
                        {category.title}
                      </h4>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedCategory === category.id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {expandedCategory === category.id && (
                  <div className="px-4 pb-4 space-y-2 bg-secondary/30">
                    {category.subServices.map((subService) => (
                      <div
                        key={subService.id}
                        className="p-3 bg-white rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                      >
                        <h5 className="text-sm font-medium mb-1">
                          {subService.title}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {subService.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
