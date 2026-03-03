// Design tokens
export const COLORS = {
  primary: '#006BB9',    // כחול רגוע
  secondary: '#03A63C',  // ירוק טבעי
  accent: '#EBB877',     // זהב חם
  light: '#E8F4F8',      // תכלת בהיר
  warm: '#FF8C42',       // כתום חם
} as const;

// Main locations with GPS coordinates
export const LOCATIONS = [
  { id: 'jerusalem', name: 'Jerusalem', slug: 'jerusalem', lat: 31.7683, lng: 35.2137 },
  { id: 'tel-aviv', name: 'Tel Aviv', slug: 'tel-aviv', lat: 32.0853, lng: 34.7818 },
  { id: 'haifa', name: 'Haifa', slug: 'haifa', lat: 32.7940, lng: 34.9896 },
  { id: 'nazareth', name: 'Nazareth', slug: 'nazareth', lat: 32.6996, lng: 35.3035 },
  { id: 'dead-sea', name: 'Dead Sea', slug: 'dead-sea', lat: 31.5000, lng: 35.5000 },
  { id: 'galilee', name: 'Galilee', slug: 'galilee', lat: 32.8631, lng: 35.5174 },
  { id: 'eilat', name: 'Eilat', slug: 'eilat', lat: 29.5577, lng: 34.9519 },
] as const;

// Points of interest (sub-locations) within main areas
export const POINTS_OF_INTEREST = [
  // Jerusalem
  { id: 'western-wall', name: 'Western Wall', parentId: 'jerusalem', lat: 31.7767, lng: 35.2345 },
  { id: 'old-city', name: 'Old City', parentId: 'jerusalem', lat: 31.7781, lng: 35.2296 },
  { id: 'mount-of-olives', name: 'Mount of Olives', parentId: 'jerusalem', lat: 31.7789, lng: 35.2442 },
  { id: 'church-holy-sepulchre', name: 'Church of the Holy Sepulchre', parentId: 'jerusalem', lat: 31.7785, lng: 35.2296 },
  { id: 'tower-of-david', name: 'Tower of David', parentId: 'jerusalem', lat: 31.7764, lng: 35.2283 },
  { id: 'garden-tomb', name: 'Garden Tomb', parentId: 'jerusalem', lat: 31.7838, lng: 35.2298 },
  { id: 'yad-vashem', name: 'Yad Vashem', parentId: 'jerusalem', lat: 31.7741, lng: 35.1753 },
  { id: 'machane-yehuda', name: 'Machane Yehuda Market', parentId: 'jerusalem', lat: 31.7850, lng: 35.2126 },
  // Tel Aviv
  { id: 'jaffa-old-city', name: 'Old Jaffa', parentId: 'tel-aviv', lat: 32.0531, lng: 34.7515 },
  { id: 'carmel-market', name: 'Carmel Market', parentId: 'tel-aviv', lat: 32.0668, lng: 34.7699 },
  { id: 'tel-aviv-beach', name: 'Tel Aviv Beach', parentId: 'tel-aviv', lat: 32.0853, lng: 34.7640 },
  { id: 'neve-tzedek', name: 'Neve Tzedek', parentId: 'tel-aviv', lat: 32.0601, lng: 34.7665 },
  // Dead Sea
  { id: 'masada', name: 'Masada', parentId: 'dead-sea', lat: 31.3156, lng: 35.3536 },
  { id: 'ein-gedi', name: 'Ein Gedi', parentId: 'dead-sea', lat: 31.4720, lng: 35.3870 },
  { id: 'qumran', name: 'Qumran', parentId: 'dead-sea', lat: 31.7413, lng: 35.4593 },
  // Galilee
  { id: 'sea-of-galilee', name: 'Sea of Galilee', parentId: 'galilee', lat: 32.8231, lng: 35.5831 },
  { id: 'capernaum', name: 'Capernaum', parentId: 'galilee', lat: 32.8803, lng: 35.5753 },
  { id: 'tabgha', name: 'Tabgha', parentId: 'galilee', lat: 32.8725, lng: 35.5482 },
  { id: 'mount-tabor', name: 'Mount Tabor', parentId: 'galilee', lat: 32.6875, lng: 35.3912 },
  // Haifa
  { id: 'bahai-gardens', name: "Baha'i Gardens", parentId: 'haifa', lat: 32.8141, lng: 34.9854 },
  { id: 'carmel-center', name: 'Carmel Center', parentId: 'haifa', lat: 32.7876, lng: 34.9783 },
  // Nazareth
  { id: 'basilica-annunciation', name: 'Basilica of the Annunciation', parentId: 'nazareth', lat: 32.7019, lng: 35.2978 },
  // Eilat
  { id: 'coral-beach', name: 'Coral Beach', parentId: 'eilat', lat: 29.5044, lng: 34.9176 },
  { id: 'dolphin-reef', name: 'Dolphin Reef', parentId: 'eilat', lat: 29.5179, lng: 34.9235 },
] as const;

// App configuration
export const APP_CONFIG = {
  maxImagesPerPost: 5,
  defaultHashtags: ['#VisitIsrael', '#HolyLand'],
  demoMode: true,
} as const;

// Sample biblical verses for Holy Land Edition
export const BIBLICAL_VERSES = {
  jerusalem: "Next year in Jerusalem! - Traditional Passover saying",
  'tel-aviv': "I have set My rainbow in the cloud - Genesis 9:13",
  galilee: "The land of Zebulun and the land of Naphtali, by the way of the sea - Isaiah 9:1",
  nazareth: "How lovely are Your dwelling places, O Lord of hosts! - Psalm 84:2",
  'dead-sea': "You will cast all our sins into the depths of the sea - Micah 7:19",
  haifa: "The glory of Lebanon shall come to you - Isaiah 60:13",
  eilat: "And they journeyed from Mount Hor by the way of the Red Sea - Numbers 21:4",
  default: "How beautiful upon the mountains are the feet of him who brings good news - Isaiah 52:7",
} as const;
