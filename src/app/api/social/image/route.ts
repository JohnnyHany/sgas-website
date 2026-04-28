import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, platform, language } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const imagePrompt = `Professional social media post for ${platform || 'instagram'} about: ${topic}. Modern clean design, vibrant blue-purple gradient, university student organization aesthetic, actuarial science symbols, data visualization elements, square format, high quality, no text or words in the image`;

    const encodedPrompt = encodeURIComponent(imagePrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    // Fetch the image and convert to base64
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString('base64');

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
