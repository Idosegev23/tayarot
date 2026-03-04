'use server';

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedGuide } from './guideAuth';
import type { ParsedItinerary, ItineraryDayDraft } from '@/lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Parse an itinerary file (PDF or text) using Gemini.
 */
export async function parseItineraryFile(
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<{ success: boolean; itinerary?: ParsedItinerary; error?: string }> {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError! };

    const isPdf = mimeType === 'application/pdf';
    const isText = mimeType.startsWith('text/');

    if (!isPdf && !isText) {
      return { success: false, error: 'Only PDF and text files are supported' };
    }

    const prompt = `Parse this tour itinerary document and extract a structured day-by-day schedule.

Output ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "days": [
    {
      "day_number": 1,
      "date": "2026-03-15",
      "title": "Jerusalem Old City",
      "stops": [
        {
          "location_name": "Western Wall",
          "time": "09:00",
          "duration_minutes": 60,
          "description": "Morning visit to the Western Wall",
          "fun_facts": "The Western Wall is the last remaining wall of the Second Temple",
          "lat": 31.7767,
          "lng": 35.2345
        }
      ]
    }
  ]
}

Rules:
- Extract ALL days and stops mentioned
- Use 24-hour time format (HH:MM)
- Include GPS coordinates if you can identify the location in Israel
- Keep descriptions concise
- If dates are mentioned use YYYY-MM-DD format
- If no dates, omit the "date" field
- fun_facts is optional, include only if relevant`;

    let result;

    if (isPdf) {
      result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'application/pdf', data: fileBase64 } },
              { text: prompt },
            ],
          },
        ],
      });
    } else {
      // Text file — decode and include in prompt
      const textContent = Buffer.from(fileBase64, 'base64').toString('utf-8');
      result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${prompt}\n\n--- ITINERARY DOCUMENT ---\n${textContent}` }],
          },
        ],
      });
    }

    const text = result.text?.trim() || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed: ParsedItinerary = JSON.parse(jsonStr);

    if (!parsed.days || !Array.isArray(parsed.days)) {
      return { success: false, error: 'Failed to parse itinerary structure' };
    }

    logger.info('Itinerary parsed', { fileName, daysCount: parsed.days.length });
    return { success: true, itinerary: parsed };
  } catch (error) {
    logger.error('parseItineraryFile error', error as Error);
    return { success: false, error: 'Failed to parse file. Please try again or enter manually.' };
  }
}

/**
 * Save itinerary days and stops for a group.
 * Deletes existing itinerary first (full replace).
 */
export async function saveItinerary(
  groupId: string,
  days: ItineraryDayDraft[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError! };

    const supabase = await createClient();

    // Verify group ownership
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .eq('guide_id', guide.id)
      .single();

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // Delete existing itinerary days (cascades to stops)
    await supabase
      .from('group_itinerary_days')
      .delete()
      .eq('group_id', groupId);

    // Insert new days
    for (const day of days) {
      const { data: insertedDay, error: dayError } = await supabase
        .from('group_itinerary_days')
        .insert({
          group_id: groupId,
          day_number: day.day_number,
          date: day.date || null,
          title: day.title || null,
        })
        .select('id')
        .single();

      if (dayError || !insertedDay) {
        logger.error('saveItinerary day insert error', undefined, { error: dayError?.message });
        return { success: false, error: `Failed to save day ${day.day_number}` };
      }

      // Insert stops for this day
      if (day.stops.length > 0) {
        const stopsToInsert = day.stops.map((stop, idx) => ({
          day_id: insertedDay.id,
          order_index: idx,
          location_name: stop.location_name,
          time: stop.time || null,
          duration_minutes: stop.duration_minutes || null,
          description: stop.description || null,
          fun_facts: stop.fun_facts || null,
          lat: stop.lat || null,
          lng: stop.lng || null,
        }));

        const { error: stopsError } = await supabase
          .from('group_itinerary_stops')
          .insert(stopsToInsert);

        if (stopsError) {
          logger.error('saveItinerary stops insert error', undefined, { error: stopsError.message });
          return { success: false, error: `Failed to save stops for day ${day.day_number}` };
        }
      }
    }

    logger.info('Itinerary saved', { groupId, daysCount: days.length });
    return { success: true };
  } catch (error) {
    logger.error('saveItinerary error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

async function requireGuide() {
  const guide = await getAuthenticatedGuide();
  if (!guide || !guide.id) {
    return { guide: null, error: 'Not authenticated' };
  }
  return { guide, error: null };
}
