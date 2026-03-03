export type PostStyle = 'regular' | 'holy_land';
export type PostStatus = 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
export type AccessRole = 'guide' | 'tourism' | 'admin';

export interface Guide {
  id: string;
  slug: string;
  display_name: string;
  created_at: string;
}

export interface Post {
  id: string;
  guide_id: string;
  tourist_name?: string;
  location_label: string;
  location_lat?: number | null;
  location_lng?: number | null;
  experience_text: string;
  style: PostStyle;
  images: string[];
  status: PostStatus;
  biblical_verse?: string | null;
  verse_reference?: string | null;
  created_at: string;
  guide?: Guide;
}

export interface AccessKey {
  id: string;
  key: string;
  role: AccessRole;
  guide_id?: string;
  active: boolean;
  label: string;
  created_at: string;
  guide?: Guide;
}

// Geolocation types
export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface NearestLocation {
  location: { id: string; name: string; slug: string; lat: number; lng: number };
  distanceKm: number;
  poi?: { id: string; name: string; parentId: string; lat: number; lng: number };
}

export type GeolocationStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';

export interface ItineraryStop {
  location_id: string;
  location_name: string;
  day: number;
  order_in_day: number;
  notes?: string;
}

// Image editor overlay configuration
export interface OverlayConfig {
  locationTag: boolean;
  verse: boolean;
  experienceText: boolean;
  dateStamp: boolean;
}

export interface AppSettings {
  id: string;
  hashtags: string[];
  verse_mode_enabled: boolean;
  max_images_per_post: number;
  demo_banner_text: string;
}
