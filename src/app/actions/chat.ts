'use server';

import { headers } from 'next/headers';
import { checkRateLimit, getClientIdentifier, logRateLimitHit } from '@/lib/rateLimiter';
import { isRateLimitingEnabled } from '@/lib/env';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  guideSlug: string,
  context?: { location?: string; hasPhotos?: boolean }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Rate limiting check
    if (isRateLimitingEnabled()) {
      const headersList = await headers();
      const identifier = getClientIdentifier(headersList);
      const rateLimitResult = await checkRateLimit(identifier, 'openai');
      
      // Log the hit (fire and forget)
      logRateLimitHit(identifier, 'openai', rateLimitResult.allowed).catch(() => {});
      
      if (!rateLimitResult.allowed) {
        return { 
          success: false, 
          error: rateLimitResult.error || 'Too many requests. Please try again later.' 
        };
      }
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        instructions: `You are Mary, a friendly and helpful virtual tour guide for Israel. 
You help tourists during their Holy Land journey with information about locations, routes, and experiences.
Be warm, concise, and spiritual. Keep responses short (2-3 sentences max).
The tourist is traveling with guide: ${guideSlug}.
${context?.hasPhotos ? 'The tourist has shared photos.' : ''}
${context?.location ? `They are at: ${context.location}.` : ''}
When appropriate, gently encourage them to share photos of their experiences or ask questions about their journey.`,
        input: messages,
        store: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API Error:', error);
      return { success: false, error: 'Failed to get response from AI' };
    }

    const data = await response.json();
    
    // Extract text from the Responses API format
    const outputText = data.output_text || 
      data.output?.find((item: any) => item.type === 'message')?.content?.[0]?.text ||
      'I apologize, I couldn\'t process that. Could you try again?';

    return { success: true, message: outputText };
  } catch (error) {
    console.error('Chat error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
