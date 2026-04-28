import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { topic, platform, language } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Build a detailed image prompt based on platform
    const imagePrompt = `Create a professional and visually appealing social media post image for ${platform || 'instagram'}.
    
Topic/Theme: ${topic}
Language context: ${language || 'Arabic'}

Style requirements:
- Modern, clean design with vibrant colors
- Professional university/student organization aesthetic
- Include subtle mathematical/actuarial symbols or data visualization elements
- Use a gradient background (blue to purple tones)
- Leave space for text overlay
- Square format suitable for Instagram
- High quality, eye-catching design

Do NOT include any actual text or words in the image.`;

    const response = await zai.images.generations.create({
      prompt: imagePrompt,
      size: '1024x1024',
    });

    const imageBase64 = response.data[0]?.base64;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

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
