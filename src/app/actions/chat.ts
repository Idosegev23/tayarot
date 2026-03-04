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
  groupId?: string;
  guideName?: string;
}

async function getGroupItineraryContext(groupId: string): Promise<string> {
  try {
    const supabase = await createClient();

    // Get group with start_date
    const { data: group } = await supabase
      .from('groups')
      .select('start_date, name')
      .eq('id', groupId)
      .single();

    if (!group) return '';

    // Calculate current day number
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let dayNumber = 1;
    if (group.start_date) {
      const start = new Date(group.start_date);
      const diffMs = now.getTime() - start.getTime();
      dayNumber = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }

    // Get today's itinerary day
    const { data: day } = await supabase
      .from('group_itinerary_days')
      .select('id, day_number, date, title')
      .eq('group_id', groupId)
      .eq('day_number', dayNumber)
      .single();

    if (!day) return `Group: ${group.name}\nDay ${dayNumber} (no itinerary set)`;

    // Get stops for today
    const { data: stops } = await supabase
      .from('group_itinerary_stops')
      .select('*')
      .eq('day_id', day.id)
      .order('order_index');

    if (!stops || stops.length === 0) {
      return `Group: ${group.name}\nDay ${dayNumber}: ${day.title || 'No title'} (no stops)`;
    }

    // Build itinerary context
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    let currentStop = '';
    let nextStop = '';

    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      if (s.time && s.time <= currentTime) {
        currentStop = s.location_name;
        if (i + 1 < stops.length) {
          nextStop = `${stops[i + 1].location_name}${stops[i + 1].time ? ` at ${stops[i + 1].time}` : ''}`;
        }
      }
    }

    // If no stop matched by time, use first stop
    if (!currentStop && stops.length > 0) {
      currentStop = stops[0].location_name;
      if (stops.length > 1) {
        nextStop = `${stops[1].location_name}${stops[1].time ? ` at ${stops[1].time}` : ''}`;
      }
    }

    const stopsText = stops
      .map(s => `  ${s.time || '??:??'} (${s.duration_minutes || '?'} min) — ${s.location_name}${s.description ? ': ' + s.description : ''}`)
      .join('\n');

    return `Group: ${group.name}
TODAY'S ITINERARY (Day ${dayNumber} - ${day.title || 'Untitled'}):
${stopsText}

CURRENT TIME: ${currentTime}
${currentStop ? `The group should currently be at: ${currentStop}` : ''}
${nextStop ? `Next stop: ${nextStop}` : ''}`;
  } catch {
    return '';
  }
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

    // Build itinerary context for group-based chat
    let itineraryBlock = '';
    if (context?.groupId) {
      itineraryBlock = await getGroupItineraryContext(context.groupId);
    }

    // Legacy: Look up itinerary for next-stop context
    let nextStopInfo = '';
    if (!context?.groupId && context?.coordinates) {
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

    // Determine persona name
    const firstName = context?.guideName?.split(' ')[0] || '';
    const personaName = firstName ? `${firstName} Co-Guide` : 'Mary';

    const systemInstruction = context?.groupId
      ? `You are ${personaName}, a virtual companion for tourists traveling with guide ${context.guideName || guideSlug} in Israel.

PERSONALITY:
- Warm, helpful, and knowledgeable about Israel
- Concise: 2-3 sentences max unless the tourist asks for more detail
- You know the group's itinerary and can help tourists navigate their day
- Gently encourage sharing photos and experiences

${itineraryBlock}

${locationBlock}

WHEN YOU KNOW THE TOURIST'S LOCATION:
- Share a brief fascinating fact about where they are
- Reference the itinerary if relevant (are they at a scheduled stop?)
- Suggest something specific they should not miss
- Build anticipation for the next stop if you know it

WHEN LOCATION IS UNKNOWN:
- Reference the current itinerary to suggest where they might be
- Ask what they're seeing or doing

${context?.hasPhotos ? 'The tourist has shared photos. Encourage them to create a post!' : ''}`
      : `You are Mary, a warm and knowledgeable virtual tour guide for Israel and the Holy Land.

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
      model: 'gemini-3-flash-preview',
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
