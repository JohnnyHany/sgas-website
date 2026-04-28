import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

async function createZAI() {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('AI configuration is missing. Please set AI_BASE_URL and AI_API_KEY environment variables.');
  }
  return new ZAI({ baseUrl, apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const { action, topic, platform, language, selectedIdea } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const zai = await createZAI();

    const systemPrompt = `You are a social media content expert for SGAS (Student Group of Actuarial Science) at Cairo University. You create engaging content for university students interested in actuarial science, insurance, risk management, and data science. Always write in ${language || 'arabic'}. Be creative, professional but friendly, and use relevant emojis.`;

    if (action === 'ideas') {
      const userPrompt = `Generate 3 creative social media post ideas about: "${topic || 'actuarial science and student life'}"
      
Platform: ${platform || 'instagram'}
Language: ${language || 'Arabic'}

Return ONLY a valid JSON array of 3 objects with this exact format:
[
  {
    "id": 1,
    "title": "short catchy title in the specified language",
    "description": "brief description of what the post will be about (2-3 sentences in the specified language)",
    "type": "engagement|educational|announcement|motivational|fun",
    "suggestedHashtags": ["hashtag1", "hashtag2", "hashtag3"]
  }
]

Do NOT include any text outside the JSON array.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse ideas' }, { status: 500 });
      }

      const ideas = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ ideas });

    } else if (action === 'caption') {
      const userPrompt = `Write a complete social media post caption based on this idea: "${selectedIdea || topic || 'SGAS student activities'}"

Platform: ${platform || 'instagram'}
Language: ${language || 'Arabic'}

Requirements:
- Write an engaging, well-structured caption
- Include a hook in the first line
- Add relevant hashtags at the end
- Keep it appropriate length for ${platform || 'instagram'}
- Include a call to action (follow us, share, comment, etc.)

Return ONLY a valid JSON object with this exact format:
{
  "caption": "the full caption text here with line breaks",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "suggestedTime": "best time to post"
}

Do NOT include any text outside the JSON object.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse caption' }, { status: 500 });
      }

      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Social API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
