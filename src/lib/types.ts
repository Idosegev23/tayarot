export type PostStyle = 'regular' | 'holy_land';
export type PostStatus = 'draft' | 'approved' | 'published';
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

export interface AppSettings {
  id: string;
  hashtags: string[];
  verse_mode_enabled: boolean;
  max_images_per_post: number;
  demo_banner_text: string;
}
