'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerateImageParams {
  location: string;
  experience: string;
  style: 'regular' | 'holy_land';
  biblicalVerse?: string;
}

export async function generateStyledImage({
  location,
  experience,
  style,
  biblicalVerse,
  sourceImageUrl,
}: GenerateImageParams & { sourceImageUrl: string }): Promise<{ success: boolean; imageData?: string; mimeType?: string; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    // Fetch the source image
    const imageResponse = await fetch(sourceImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Nano Banana Pro model for professional image editing
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-pro-image-preview'
    });

    // Create a detailed JSON prompt based on style - optimized for Nano Banana Pro
    let promptConfig: any;
    
    if (style === 'holy_land') {
      promptConfig = {
        "task": "Add professional text overlay to travel photo - DO NOT generate new background",
        "main_subject": `Keep original travel photo from ${location} as background, add text overlay only`,
        "art_style": "Professional social media post design, photorealistic text overlay, Instagram/Facebook aesthetic",
        "text_elements": [
          {
            "content": location.toUpperCase(),
            "position": "top 20% of image",
            "font": "elegant serif (Playfair Display style)",
            "size": "extra large, prominent",
            "color": "pure white (#FFFFFF)",
            "effects": "strong dark shadow for contrast, semi-transparent dark gradient behind text",
            "alignment": "center"
          },
          {
            "content": experience,
            "position": "center 40-60% of image",
            "font": "clean sans-serif (Inter or Helvetica style)",
            "size": "medium, readable on mobile",
            "color": "pure white (#FFFFFF)",
            "effects": "dark shadow, semi-transparent gradient for readability",
            "alignment": "center",
            "max_lines": 2
          },
          {
            "content": `"${biblicalVerse || 'Verse text here'}"`,
            "position": "bottom 20% of image",
            "font": "elegant italic serif with quotation marks",
            "size": "small to medium",
            "color": "WARM GOLD (#EBB877) - CRITICAL: MUST BE GOLD COLOR",
            "effects": "subtle shadow, gentle gradient behind",
            "alignment": "center",
            "style_note": "Include opening and closing quotation marks"
          }
        ],
        "lighting": "maintain original photo lighting, add subtle dark gradients behind text areas only for readability",
        "composition": "preserve original photo composition, text overlay must not obscure main photo subjects",
        "technical_details": "high resolution, crisp typography, perfect text rendering, mobile-optimized",
        "mood": "spiritual, inspiring, professional",
        "critical_requirements": [
          "ALL THREE text elements MUST appear on the image",
          "Biblical verse MUST be in GOLD color (#EBB877), not white",
          "Keep original photo unmodified - only add text overlay",
          "Text must be large enough to read on mobile devices",
          "Use semi-transparent dark gradients behind text for readability"
        ]
      };
    } else {
      promptConfig = {
        "task": "Add modern text overlay to travel photo - DO NOT generate new background",
        "main_subject": `Keep original travel photo from ${location} as background, add text overlay only`,
        "art_style": "Modern social media post design, clean typography, Instagram aesthetic",
        "text_elements": [
          {
            "content": location.toUpperCase(),
            "position": "top of image",
            "font": "bold modern sans-serif (Montserrat Bold style)",
            "size": "large and bold",
            "color": "pure white (#FFFFFF)",
            "effects": "strong shadow",
            "alignment": "center"
          },
          {
            "content": experience,
            "position": "center of image",
            "font": "clean sans-serif (Inter style)",
            "size": "medium",
            "color": "pure white (#FFFFFF)",
            "effects": "shadow for readability",
            "alignment": "center"
          }
        ],
        "lighting": "maintain original photo lighting, minimal dark overlays for text",
        "composition": "preserve original photo, text overlay only",
        "technical_details": "high resolution, professional typography, mobile-optimized",
        "mood": "modern, vibrant, energetic"
      };
    }
    
    const prompt = `INSTRUCTION: Add text overlay to this image following the exact specifications below.

CRITICAL: This is the original photo - DO NOT regenerate or modify the background image. ONLY add text overlay.

${JSON.stringify(promptConfig, null, 2)}

Execute this design precisely. Return the enhanced image with text overlay.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      },
      prompt,
    ]);
    
    const response = result.response;
    
    // Extract image data from response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          return {
            success: true,
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

    const result = await model.generateContent(promptRequest);
    const response = result.response;
    const designPrompt = response.text();

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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

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
