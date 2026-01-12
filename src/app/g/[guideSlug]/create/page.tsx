import { use } from 'react';
import { ChatCreatePost } from './ChatCreatePost';

interface PageProps {
  params: Promise<{ guideSlug: string }>;
}

export default function CreatePostPage({ params }: PageProps) {
  const { guideSlug } = use(params);
  
  return <ChatCreatePost guideSlug={guideSlug} />;
}
