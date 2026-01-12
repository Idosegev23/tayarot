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

    // Create a detailed prompt based on style
    let prompt = '';
    
    if (style === 'holy_land') {
      prompt = `You are a professional graphic designer creating a social media post. Add text overlay to this travel photo.

IMPORTANT: The photo MUST include ALL THREE text elements below. Do not skip any!

===== TEXT ELEMENTS TO ADD (ALL REQUIRED) =====

1. LOCATION (at the TOP):
   Text: "${location}"
   Font: Large elegant serif, white color with shadow
   Position: Upper 20% of image
   
2. EXPERIENCE (in the MIDDLE):
   Text: "${experience}"
   Font: Medium sans-serif, white color with shadow
   Position: Center 40-60% of image
   
3. BIBLICAL VERSE (at the BOTTOM) - MUST INCLUDE:
   Text: "${biblicalVerse || 'Verse not provided'}"
   Font: Italic serif, GOLD color (#EBB877 or warm golden), with shadow
   Position: Lower 20% of image
   Style: Include quotation marks around the verse
   
===== DESIGN REQUIREMENTS =====
- Add semi-transparent dark gradient behind each text block for readability
- Use high-quality typography with proper spacing
- Text must be LARGE enough to read on mobile
- Maintain original photo quality
- Professional Instagram/Facebook aesthetic

===== EXAMPLE LAYOUT =====
[TOP 20%]     "JERUSALEM" (white, large)
[MIDDLE 40%]  "Standing at the Western Wall..." (white, medium)
[BOTTOM 20%]  "Pray for the peace of Jerusalem" (gold, italic)

CRITICAL: You MUST include the biblical verse in GOLD color at the bottom. This is not optional!

Return the enhanced image ready for social media.`;
    } else {
      prompt = `Add modern text overlay to this travel photo from ${location}.

CRITICAL INSTRUCTIONS:
- KEEP the original photo exactly as is - DO NOT change, filter, or modify the background image
- ONLY ADD text overlay on top of the existing photo
- Use minimal semi-transparent overlays for text readability only

TEXT OVERLAY (render with high-fidelity typography):
Location Title: "${location}"
  - Font: Bold modern sans-serif (like Montserrat Bold)
  - Position: Top of image
  - Color: White with strong shadow
  - Size: Large and bold

Experience Quote: "${experience}"
  - Font: Clean sans-serif (like Inter)
  - Position: Center
  - Color: White with shadow
  - Size: Medium, well-spaced

OVERLAY DESIGN:
- Minimal dark gradient overlays for text readability
- Crisp, professional typography
- Modern Instagram/Facebook aesthetic
- Keep original photo vibrant and prominent

OUTPUT: Return the SAME photo with clean text overlay - ready to share.`;
    }

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
