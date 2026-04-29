import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqChat(systemPrompt: string, userPrompt: string, temperature: number = 0.7) {
  const res = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const { action, topic, platform, language, selectedIdea } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Please add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a social media content expert for SGAS (Student Group of Actuarial Science) at Cairo University. You create engaging content for university students interested in actuarial science, insurance, risk management, and data science. Be creative, professional but friendly, and use relevant emojis.`;

    if (action === 'ideas') {
      const langInstruction = language === 'english'
        ? 'Write all content in English.'
        : language === 'both'
          ? 'Write the title in English and description in Arabic.'
          : 'Write all content in Arabic.';

      const userPrompt = `Generate 3 creative social media post ideas about: "${topic || 'actuarial science and student life'}"

Platform: ${platform || 'instagram'}
 ${langInstruction}

Return ONLY a valid JSON array of 3 objects with this exact format:
[
  {
    "id": 1,
    "title": "short catchy title",
    "description": "brief description of what the post will be about (2-3 sentences)",
    "type": "engagement|educational|announcement|motivational|fun",
    "suggestedHashtags": ["hashtag1", "hashtag2", "hashtag3"]
  }
]

Do NOT include any text outside the JSON array.`;

      const content = await groqChat(systemPrompt, userPrompt, 0.8);

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse ideas. Try again.' }, { status: 500 });
      }

      const ideas = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ ideas });

    } else if (action === 'caption') {
      const langInstruction = language === 'english'
        ? 'Write the caption entirely in English.'
        : language === 'both'
          ? 'Write the caption in both Arabic and English (Arabic first, then English).'
          : 'Write the caption entirely in Arabic.';

      const userPrompt = `Write a complete social media post caption based on this idea: "${selectedIdea || topic || 'SGAS student activities'}"

Platform: ${platform || 'instagram'}
 ${langInstruction}

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

      const content = await groqChat(systemPrompt, userPrompt, 0.7);

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse caption. Try again.' }, { status: 500 });
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
