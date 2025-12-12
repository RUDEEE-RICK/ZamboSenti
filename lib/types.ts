export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "e-service" | "popular" | "featured";
  externalUrl?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  subServices: SubService[];
}

export interface SubService {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  imageUrl?: string;
  publishedAt: string;
  featured?: boolean;
}

export interface EmergencyContact {
  id: string;
  type: "smart" | "tnt" | "landline";
  number: string;
  label: string;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  route: string;
}

export interface TransparencyDocument {
  id: string;
  title: string;
  icon: string;
  category: string;
  url?: string;
}

export interface ExploreCategory {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
}
