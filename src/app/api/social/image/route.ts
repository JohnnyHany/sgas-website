import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { topic, caption, platform, language } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Use caption if available, otherwise fall back to topic
    const contextForImage = caption || topic;

    // Build image prompt based on caption + SGAS brand colors
    const imagePrompt = `Professional social media post design for ${platform || 'instagram'}.

Content theme: ${contextForImage}

Brand guidelines:
- Use a color palette of: deep pomegranate red (#B71C1C), dark crimson (#8B0000), forest green (#2E7D32), and navy blue (#0D47A1)
- Modern, clean, professional design suitable for a university student organization (SGAS - Student Group of Actuarial Science at Cairo University)
- The design should visually represent: ${contextForImage}
- Use gradient backgrounds mixing red and navy tones
- Include subtle geometric patterns, actuarial/data science visual elements like charts, graphs, or mathematical symbols
- Leave the bottom-right corner clean for a logo watermark
- Square 1:1 format, high quality, vibrant
- NO text or words in the image itself`;

    const encodedPrompt = encodeURIComponent(imagePrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

    // Fetch the generated image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('Failed to generate image from Pollinations');
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Overlay SGAS logo using sharp
    const logoPath = path.join(process.cwd(), 'public', 'sgas-logo.png');
    
    let finalBuffer: Buffer;

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      
      // Get logo dimensions to calculate proper sizing
      const logoMeta = await sharp(logoBuffer).metadata();
      const logoSize = Math.round(1024 * 0.15); // 15% of image size
      
      finalBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'cover' })
        .composite([
          {
            input: await sharp(logoBuffer)
              .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png()
              .toBuffer(),
            top: 1024 - logoSize - 30,  // 30px from bottom
            left: 1024 - logoSize - 30,  // 30px from right
          }
        ])
        .png()
        .toBuffer();
    } else {
      finalBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'cover' })
        .png()
        .toBuffer();
    }

    const imageBase64 = finalBuffer.toString('base64');

    return NextResponse.json({
      image: imageBase64,
      success: true
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
