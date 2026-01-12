// Design tokens
export const COLORS = {
  primary: '#006BB9',    // כחול רגוע
  secondary: '#03A63C',  // ירוק טבעי
  accent: '#EBB877',     // זהב חם
  light: '#E8F4F8',      // תכלת בהיר
  warm: '#FF8C42',       // כתום חם
} as const;

// Predefined locations
export const LOCATIONS = [
  { id: 'jerusalem', name: 'Jerusalem', slug: 'jerusalem' },
  { id: 'tel-aviv', name: 'Tel Aviv', slug: 'tel-aviv' },
  { id: 'haifa', name: 'Haifa', slug: 'haifa' },
  { id: 'nazareth', name: 'Nazareth', slug: 'nazareth' },
  { id: 'dead-sea', name: 'Dead Sea', slug: 'dead-sea' },
  { id: 'galilee', name: 'Galilee', slug: 'galilee' },
  { id: 'eilat', name: 'Eilat', slug: 'eilat' },
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
  galilee: "He went down to Capernaum, a city of Galilee - Luke 4:31",
  nazareth: "He shall be called a Nazarene - Matthew 2:23",
  'dead-sea': "You will cast all our sins into the depths of the sea - Micah 7:19",
  haifa: "The glory of Lebanon shall come to you - Isaiah 60:13",
  eilat: "And they journeyed from Mount Hor by the way of the Red Sea - Numbers 21:4",
  default: "How beautiful upon the mountains are the feet of him who brings good news - Isaiah 52:7",
} as const;
