export type PostStyle = 'regular' | 'holy_land';
export type PostStatus = 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
export type AccessRole = 'guide' | 'tourism' | 'admin';

export interface Guide {
  id: string;
  slug: string;
  display_name: string;
  created_at: string;
}

export interface GuideWithAuth extends Guide {
  auth_user_id?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  updated_at?: string;
}

// Group participants (tourist whitelist)
export interface GroupParticipant {
  id: string;
  group_id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

// Groups
export type GroupStatus = 'active' | 'completed' | 'archived';

export interface Group {
  id: string;
  guide_id: string;
  name: string;
  slug: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  guide?: Guide;
}

export interface GroupItineraryDay {
  id: string;
  group_id: string;
  day_number: number;
  date?: string;
  title?: string;
  description?: string;
  created_at: string;
  stops?: GroupItineraryStop[];
}

export interface GroupItineraryStop {
  id: string;
  day_id: string;
  order_index: number;
  time?: string;
  location_name: string;
  lat?: number;
  lng?: number;
  description?: string;
  fun_facts?: string;
  duration_minutes?: number;
}

// Itinerary builder draft types (client-side before save)
export interface ItineraryDayDraft {
  tempId: string;
  day_number: number;
  date?: string;
  title?: string;
  stops: ItineraryStopDraft[];
}

export interface ItineraryStopDraft {
  tempId: string;
  order_index: number;
  location_name: string;
  time?: string;
  duration_minutes?: number;
  description?: string;
  fun_facts?: string;
  lat?: number;
  lng?: number;
}

// Gemini-parsed itinerary structure
export interface ParsedItinerary {
  days: {
    day_number: number;
    date?: string;
    title?: string;
    stops: {
      location_name: string;
      time?: string;
      duration_minutes?: number;
      description?: string;
      fun_facts?: string;
      lat?: number;
      lng?: number;
    }[];
  }[];
}

// Canvas image editor overlay
export interface CanvasOverlay {
  id: string;
  type: 'location' | 'experience' | 'verse' | 'date';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  visible: boolean;
}

export interface Post {
  id: string;
  guide_id: string;
  group_id?: string;
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
