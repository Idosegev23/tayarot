'use server';

import { GoogleGenAI } from '@google/genai';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIdentifier, logRateLimitHit } from '@/lib/rateLimiter';
import { isRateLimitingEnabled } from '@/lib/env';
import { checkBudgetBeforeCall, estimateGeminiChatCost, trackCost } from '@/lib/costTracker';
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
      const rateLimitResult = await checkRateLimit(identifier, 'gemini');
      logRateLimitHit(identifier, 'gemini', rateLimitResult.allowed).catch(() => {});

      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: rateLimitResult.error || 'Too many requests. Please try again later.'
        };
      }
    }

    // Budget pre-check
    const budgetCheck = await checkBudgetBeforeCall('gemini', estimateGeminiChatCost(500, 200));
    if (!budgetCheck.allowed) {
      return { success: false, error: budgetCheck.error || 'Budget limit reached. Please try again later.' };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
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

    const systemInstruction = `You are Mary, a warm and knowledgeable virtual tour guide for Israel and the Holy Land.

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
- Offer to help once you know their location`;

    const ai = new GoogleGenAI({ apiKey });

    // Convert messages to Gemini format (last 20 messages)
    // Gemini requires history to start with a 'user' role
    const recentMessages = messages.slice(-20);
    const allGemini = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }],
    }));

    // Strip leading 'model' messages — Gemini requires first message to be 'user'
    while (allGemini.length > 0 && allGemini[0].role === 'model') {
      allGemini.shift();
    }

    // Need at least a user message
    if (allGemini.length === 0) {
      return { success: false, error: 'No user message provided' };
    }

    // History = all but last, last message sent via sendMessage
    const history = allGemini.slice(0, -1);
    const lastMessage = allGemini[allGemini.length - 1];

    const chat = ai.chats.create({
      model: 'gemini-3.0-flash',
      config: { systemInstruction },
      history,
    });

    const response = await chat.sendMessage({ message: lastMessage.parts[0].text });
    const outputText = response.text || 'I apologize, I couldn\'t process that. Could you try again?';

    // Track cost (fire and forget)
    const cost = estimateGeminiChatCost(500, 200);
    trackCost({
      service: 'gemini',
      tokensUsed: 700,
      estimatedCost: cost,
    }).catch(() => {});

    return { success: true, message: outputText };
  } catch (error) {
    console.error('Chat error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
