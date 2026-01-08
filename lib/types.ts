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
  view_count?: number;
}

export interface Complaint {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  barangay: string;
  status: string;
  user_id: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  is_public: boolean;
  view_count: number;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintReaction {
  id: string;
  complaint_id: string;
  user_id: string;
  reaction_type: 'heart' | 'like' | 'thumbs_up' | 'thumbs_down';
  created_at: string;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  };
}

export type EmergencyCategory =
  | "police"
  | "fire"
  | "medical"
  | "rescue"
  | "disaster"
  | "utility"
  | "other";

export interface EmergencyHotline {
  id: string;
  label: string;
  number: string;
  sim_type: string;
  barangay: string | null;
  category: EmergencyCategory | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: React.ElementType;
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

export type AgencyCategory =
  | "healthcare"
  | "transport"
  | "finance"
  | "legal"
  | "government"
  | "social_services"
  | "other";

export interface Agency {
  id: string;
  name: string;
  description: string;
  external_link: string;
  category: AgencyCategory;
  created_at: string;
  updated_at: string;
}
