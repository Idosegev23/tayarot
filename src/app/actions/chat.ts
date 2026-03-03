'use server';

import { headers } from 'next/headers';
import { checkRateLimit, getClientIdentifier, logRateLimitHit } from '@/lib/rateLimiter';
import { isRateLimitingEnabled } from '@/lib/env';
import { checkBudgetBeforeCall, estimateOpenAICost } from '@/lib/costTracker';
import { createClient } from '@/lib/supabase/server';
import { findNextItineraryStop } from '@/lib/geolocation';
import type { ItineraryStop } from '@/lib/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  location?: string;
  hasPhotos?: boolean;
  locationContext?: string;
  coordinates?: { lat: number; lng: number };
}

async function getGuideItinerary(guideSlug: string): Promise<ItineraryStop[]> {
  try {
    const supabase = await createClient();
    const { data: guide } = await supabase
      .from('guides')
      .select('id')
      .eq('slug', guideSlug)
      .single();

    if (!guide) return [];

    const { data: itinerary } = await supabase
      .from('guide_itineraries')
      .select('stops')
      .eq('guide_id', guide.id)
      .single();

    return (itinerary?.stops as ItineraryStop[]) || [];
  } catch {
    return [];
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  guideSlug: string,
  context?: ChatContext
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Rate limiting check
    if (isRateLimitingEnabled()) {
      const headersList = await headers();
      const identifier = getClientIdentifier(headersList);
      const rateLimitResult = await checkRateLimit(identifier, 'openai');
      logRateLimitHit(identifier, 'openai', rateLimitResult.allowed).catch(() => {});

      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: rateLimitResult.error || 'Too many requests. Please try again later.'
        };
      }
    }

    // Budget pre-check
    const budgetCheck = await checkBudgetBeforeCall('openai', estimateOpenAICost(500, 200));
    if (!budgetCheck.allowed) {
      return { success: false, error: budgetCheck.error || 'Budget limit reached. Please try again later.' };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    // Look up itinerary for next-stop context
    let nextStopInfo = '';
    if (context?.coordinates) {
      const stops = await getGuideItinerary(guideSlug);
      if (stops.length > 0) {
        const nextStop = findNextItineraryStop(context.coordinates, stops);
        if (nextStop) {
          nextStopInfo = `Next on the itinerary: ${nextStop.location_name} (Day ${nextStop.day})${nextStop.notes ? ` - ${nextStop.notes}` : ''}`;
        }
      }
    }

    const locationBlock = context?.locationContext
      ? `TOURIST LOCATION:\n${context.locationContext}${nextStopInfo ? `\n${nextStopInfo}` : ''}`
      : context?.location
        ? `TOURIST LOCATION:\nAt or near: ${context.location}${nextStopInfo ? `\n${nextStopInfo}` : ''}`
        : 'TOURIST LOCATION: Unknown';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        instructions: `You are Mary, a warm and knowledgeable virtual tour guide for Israel and the Holy Land.

PERSONALITY:
- Friendly, spiritual yet inclusive, genuinely helpful
- Concise: 2-3 sentences max unless the tourist asks for more detail
- Gently encourage sharing photos and experiences

GUIDE: The tourist is traveling with guide "${guideSlug}".
${context?.hasPhotos ? 'The tourist has shared photos.' : ''}

${locationBlock}

WHEN YOU KNOW THE TOURIST'S LOCATION:
- Share a brief fascinating fact about where they are
- Mention what's historically or spiritually significant nearby
- Suggest something specific they should not miss
- If you know their next stop, build anticipation for it

WHEN LOCATION IS UNKNOWN:
- Ask where they are or what they're seeing
- Offer to help once you know their location`,
        input: messages.slice(-20), // limit conversation history
        store: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API Error:', error);
      return { success: false, error: 'Failed to get response from AI' };
    }

    const data = await response.json();

    const outputText = data.output_text ||
      data.output?.find((item: { type: string }) => item.type === 'message')?.content?.[0]?.text ||
      'I apologize, I couldn\'t process that. Could you try again?';

    return { success: true, message: outputText };
  } catch (error) {
    console.error('Chat error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
