'use server';

import { GoogleGenAI } from '@google/genai';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIdentifier, logRateLimitHit } from '@/lib/rateLimiter';
import { isRateLimitingEnabled } from '@/lib/env';
import { trackCost, estimateGeminiCost, checkBudgetBeforeCall } from '@/lib/costTracker';
import { logger } from '@/lib/logger';

interface GenerateImageParams {
  location: string;
  experience: string;
  style: 'regular' | 'holy_land';
  biblicalVerse?: string;
  overlays?: {
    locationTag: boolean;
    verse: boolean;
    experienceText: boolean;
    dateStamp: boolean;
  };
}

export async function generateStyledImage({
  location,
  experience,
  style,
  biblicalVerse,
  sourceImageUrl,
  overlays,
}: GenerateImageParams & { sourceImageUrl: string }): Promise<{ success: boolean; imageData?: string; mimeType?: string; error?: string }> {
  try {
    // Rate limiting check
    if (isRateLimitingEnabled()) {
      const headersList = await headers();
      const identifier = getClientIdentifier(headersList);
      const rateLimitResult = await checkRateLimit(identifier, 'gemini');
      
      // Log the hit (fire and forget)
      logRateLimitHit(identifier, 'gemini', rateLimitResult.allowed).catch(() => {});
      
      if (!rateLimitResult.allowed) {
        return { 
          success: false, 
          error: rateLimitResult.error || 'Too many image generation requests. Please try again later.' 
        };
      }
    }
    
    // Budget pre-check
    const budgetCheck = await checkBudgetBeforeCall('gemini', estimateGeminiCost(1));
    if (!budgetCheck.allowed) {
      return { success: false, error: budgetCheck.error || 'Budget limit reached. Please try again later.' };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    // Parse the source image (supports both data URLs and regular URLs)
    let imageBase64: string;
    let imageMimeType: string;

    if (sourceImageUrl.startsWith('data:')) {
      // Parse base64 data URL directly (sent from client)
      const match = sourceImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return { success: false, error: 'Invalid image data URL format' };
      }
      imageMimeType = match[1];
      imageBase64 = match[2];
    } else {
      // Fetch from regular URL with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const imageResponse = await fetch(sourceImageUrl, { signal: controller.signal });
        const imageBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(imageBuffer).toString('base64');
        imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      } finally {
        clearTimeout(timeout);
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build dynamic text elements based on overlay config
    const overlayConfig = overlays ?? {
      locationTag: true,
      verse: style === 'holy_land',
      experienceText: true,
      dateStamp: false,
    };

    const textElements: Record<string, string>[] = [];

    if (overlayConfig.locationTag) {
      textElements.push({
        "content": location.toUpperCase(),
        "position": "top-left corner, 10-15% from top and left edge",
        "font": "clean sans-serif (Inter or Helvetica style)",
        "size": "medium, readable on mobile",
        "color": "pure white (#FFFFFF)",
        "effects": "semi-transparent dark pill badge behind text, map pin icon before text",
        "alignment": "left",
        "style_note": "Instagram-style location tag with pin icon"
      });
    }

    if (overlayConfig.experienceText) {
      textElements.push({
        "content": experience,
        "position": "center 40-60% of image",
        "font": "clean sans-serif (Inter or Helvetica style)",
        "size": "medium, readable on mobile",
        "color": "pure white (#FFFFFF)",
        "effects": "dark shadow, semi-transparent gradient for readability",
        "alignment": "center",
        "max_lines": "3"
      });
    }

    if (overlayConfig.verse && biblicalVerse) {
      textElements.push({
        "content": `"${biblicalVerse}"`,
        "position": "bottom 15-20% of image",
        "font": "elegant italic serif with quotation marks",
        "size": "small to medium",
        "color": "WARM GOLD (#EBB877) - CRITICAL: MUST BE GOLD COLOR",
        "effects": "subtle shadow, gentle gradient behind",
        "alignment": "center",
        "style_note": "Include opening and closing quotation marks"
      });
    }

    if (overlayConfig.dateStamp) {
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
      textElements.push({
        "content": dateStr,
        "position": "top-right corner, small camera-style stamp",
        "font": "monospace or condensed sans-serif",
        "size": "small, subtle",
        "color": "white (#FFFFFF) at 90% opacity",
        "effects": "small semi-transparent dark background pill",
        "alignment": "right"
      });
    }

    const promptConfig = {
      "editing_mode": "PHOTO EDITING ONLY - Preserve original photo completely",
      "task": textElements.length > 0
        ? "Crop to 1:1 square and add text overlay ONLY - NO image generation, NO filters, NO effects"
        : "Crop to 1:1 square ONLY - NO text, NO overlay, NO modifications",
      "original_photo": `User's actual travel photo from ${location} - DO NOT recreate or modify this photo`,
      "aspect_ratio": "Center-crop to 1:1 square (1080x1080px) if not already square",
      "text_elements": textElements,
      "lighting": "maintain original photo lighting, add dark gradients behind text for readability",
      "composition": "preserve original photo, text overlay only",
      "technical_details": "high resolution, crisp typography, mobile-optimized",
      "mood": overlayConfig.verse ? "spiritual, inspiring, professional" : "modern, vibrant, energetic",
      "critical_requirements": [
        `Exactly ${textElements.length} text element(s) must appear`,
        overlayConfig.verse ? "Biblical verse MUST be in GOLD color (#EBB877), not white" : null,
        "Keep original photo unmodified - only add text overlay",
        "Text must be large enough to read on mobile devices",
        "Use semi-transparent dark gradients behind text for readability"
      ].filter(Boolean)
    };

    const prompt = `⚠️ PHOTO EDITING MODE - NOT IMAGE GENERATION ⚠️

THIS IS THE USER'S ORIGINAL PHOTO. YOU ARE EDITING IT, NOT CREATING A NEW ONE.

TASK BREAKDOWN:
Step 1: Take this exact photo as-is
Step 2: If not square → crop to 1:1 (center crop, 1080x1080px)
${textElements.length > 0 ? 'Step 3: Add text overlay with specified typography\nStep 4: Return the result' : 'Step 3: Return the cropped result'}

CRITICAL RULES:
🚫 NEVER generate/create/synthesize a new background image
🚫 NEVER apply filters, effects, or artistic styles to the photo
🚫 NEVER change the photo's colors, lighting, or composition
🚫 NEVER redraw or recreate anything in the photo

✅ DO crop the photo to square (if needed)
${textElements.length > 0 ? '✅ DO add text overlay on top of the cropped photo\n✅ DO add subtle gradients behind text for readability only' : '✅ DO NOT add any text or overlays'}

The background photo MUST remain 100% identical to the input - only cropping${textElements.length > 0 ? ' and text overlay are' : ' is'} allowed.

TEXT OVERLAY SPECIFICATIONS:
${JSON.stringify(promptConfig, null, 2)}

FINAL OUTPUT: The user's original photo (cropped to square if needed)${textElements.length > 0 ? ' with clean text overlay' : ''}. The photo itself should be completely unmodified.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType,
          },
        },
        { text: prompt },
      ],
      config: {
        systemInstruction: 'You are a photo editor, not an image generator. Your task is to edit existing photos by cropping them and adding text overlays. You must NEVER generate new images or modify the original photo content. Only crop and add text.',
      },
    });

    // Extract image data from response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            // Track cost (fire and forget)
            const cost = estimateGeminiCost(1);
            trackCost({
              service: 'gemini',
              imagesGenerated: 1,
              estimatedCost: cost,
            }).catch(() => {});

            logger.info('Image generated successfully', {
              location,
              style,
              estimatedCost: cost,
            });

            return {
              success: true,
              imageData: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
            };
          }
        }
      }
    }

    return { success: false, error: 'No image data returned from model' };
  } catch (error: any) {
    console.error('Image generation error:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to generate image' 
    };
  }
}

// Alternative: Generate a styled overlay prompt for the user's photos
export async function generateImagePrompt({
  location,
  experience,
  style,
}: Omit<GenerateImageParams, 'biblicalVerse'>): Promise<{ success: boolean; prompt?: string; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptRequest = `Generate a beautiful text overlay design concept for a travel photo post.

Location: ${location}
Experience: ${experience}
Style: ${style === 'holy_land' ? 'Spiritual, biblical, warm tones' : 'Modern, vibrant, contemporary'}

Provide a short, elegant design concept (2-3 sentences) describing:
- Color palette
- Typography style
- Layout suggestions
- Visual elements to include

Keep it concise and actionable for a graphic designer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: promptRequest,
    });
    const designPrompt = response.text;

    return {
      success: true,
      prompt: designPrompt,
    };
  } catch (error) {
    console.error('Prompt generation error:', error);
    return { success: false, error: 'Failed to generate design prompt' };
  }
}

// Generate a biblical verse suggestion using Gemini
export async function suggestBiblicalVerse(
  location: string,
  experience: string
): Promise<{ success: boolean; verse?: string; reference?: string; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Suggest ONE SHORT biblical verse from the Hebrew Bible (Tanakh/Old Testament ONLY) that connects to this travel experience in the Holy Land.

Location: ${location}
Tourist's experience: ${experience}

CRITICAL Requirements:
- ONLY use verses from the Hebrew Bible (Tanakh) - Torah, Prophets (Nevi'im), or Writings (Ketuvim)
- DO NOT use New Testament verses
- Choose ONLY ONE SINGLE VERSE (maximum 2 sentences)
- The verse MUST be SHORT and concise - preferably 15-30 words maximum
- Choose a verse with historical or spiritual connection to ${location}
- The verse should resonate with the tourist's experience
- Provide the verse text in English
- Include the biblical reference (Book Chapter:Verse)
- Keep it authentic and respectful
- Prefer well-known, SHORT, inspiring verses like:
  * "The Lord is my shepherd; I shall not want" (Psalm 23:1)
  * "How lovely are Your dwelling places, O Lord of hosts!" (Psalm 84:2)
  * "Pray for the peace of Jerusalem" (Psalm 122:6)

DO NOT return entire paragraphs or multiple verses!
Return ONLY ONE SHORT verse!

Format your response EXACTLY as:
VERSE: [ONE SHORT verse only - 15-30 words]
REFERENCE: [Book Chapter:Verse]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: prompt,
    });
    const text = response.text || '';

    // Parse the response (without 's' flag for ES compatibility)
    const lines = text.split('\n');
    let verse: string | undefined;
    let reference: string | undefined;
    
    let inVerse = false;
    let verseLines: string[] = [];
    
    for (const line of lines) {
      if (line.includes('VERSE:')) {
        inVerse = true;
        const versePart = line.split('VERSE:')[1];
        if (versePart) verseLines.push(versePart.trim());
      } else if (line.includes('REFERENCE:')) {
        inVerse = false;
        verse = verseLines.join(' ').trim();
        const refPart = line.split('REFERENCE:')[1];
        if (refPart) reference = refPart.trim();
        break;
      } else if (inVerse && line.trim()) {
        verseLines.push(line.trim());
      }
    }
    
    if (!verse && verseLines.length > 0) {
      verse = verseLines.join(' ').trim();
    }

    return {
      success: true,
      verse,
      reference,
    };
  } catch (error) {
    console.error('Biblical verse suggestion error:', error);
    return { success: false, error: 'Failed to suggest biblical verse' };
  }
}
