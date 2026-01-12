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
      model: 'gemini-3-pro-image-preview',
      systemInstruction: 'You are a photo editor, not an image generator. Your task is to edit existing photos by cropping them and adding text overlays. You must NEVER generate new images or modify the original photo content. Only crop and add text.'
    });

    // Create a detailed JSON prompt based on style - optimized for Nano Banana Pro
    let promptConfig: any;
    
    if (style === 'holy_land') {
      promptConfig = {
        "editing_mode": "PHOTO EDITING ONLY - Preserve original photo completely",
        "task": "Crop to 1:1 square and add text overlay ONLY - NO image generation, NO filters, NO effects",
        "original_photo": `User's actual travel photo from ${location} - DO NOT recreate or modify this photo`,
        "aspect_ratio": "Center-crop to 1:1 square (1080x1080px) if not already square",
        "art_style": "Clean text overlay on the UNMODIFIED original photo, professional typography only",
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
        "editing_mode": "PHOTO EDITING ONLY - Preserve original photo completely",
        "task": "Crop to 1:1 square and add text overlay ONLY - NO image generation, NO filters, NO effects",
        "original_photo": `User's actual travel photo from ${location} - DO NOT recreate or modify this photo`,
        "aspect_ratio": "Center-crop to 1:1 square (1080x1080px) if not already square",
        "art_style": "Clean text overlay on the UNMODIFIED original photo, modern typography only",
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
    
    const prompt = `⚠️ PHOTO EDITING MODE - NOT IMAGE GENERATION ⚠️

THIS IS THE USER'S ORIGINAL PHOTO. YOU ARE EDITING IT, NOT CREATING A NEW ONE.

TASK BREAKDOWN:
Step 1: Take this exact photo as-is
Step 2: If not square → crop to 1:1 (center crop, 1080x1080px)
Step 3: Add text overlay with specified typography
Step 4: Return the result

CRITICAL RULES:
🚫 NEVER generate/create/synthesize a new background image
🚫 NEVER apply filters, effects, or artistic styles to the photo
🚫 NEVER change the photo's colors, lighting, or composition
🚫 NEVER redraw or recreate anything in the photo

✅ DO crop the photo to square (if needed)
✅ DO add text overlay on top of the cropped photo
✅ DO add subtle gradients behind text for readability only

The background photo MUST remain 100% identical to the input - only cropping and text overlay are allowed.

TEXT OVERLAY SPECIFICATIONS:
${JSON.stringify(promptConfig, null, 2)}

FINAL OUTPUT: The user's original photo (cropped to square if needed) with clean text overlay. The photo itself should be completely unmodified.`;

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
