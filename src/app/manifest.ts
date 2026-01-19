import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agent Mary - Holy Land Journey',
    short_name: 'Agent Mary',
    description: 'Share your Holy Land journey with AI-powered post creation and biblical verses',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#006BB9',
    icons: [
      {
        src: '/Logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
