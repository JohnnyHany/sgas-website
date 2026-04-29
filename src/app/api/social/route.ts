import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

function safeJSONParse(str: string) {
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return JSON.parse(cleaned);
}

async function groqChat(systemPrompt: string, userPrompt: string, temperature: number = 0.7) {
  const models = ['llama-3.1-8b-instant', 'gemma2-9b-it', 'llama-3.3-70b-versatile'];

  for (const model of models) {
    try {
      const res = await fetch(GROQ_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) continue;
        const err = await res.text();
        throw new Error(`Groq API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content || '';
      if (!content) continue;
      return content;
    } catch (e: any) {
      if (e.message?.includes('Groq API error')) throw e;
      continue;
    }
  }

  throw new Error('All Groq models failed. Please try again later.');
}

export async function POST(request: NextRequest) {
  try {
    const { action, topic, platform, language, selectedIdea } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a social media content expert for SGAS (Strive and Grow in Actuarial Science) at Cairo University.`;

    if (action === 'ideas') {
      const langInstruction = language === 'english'
        ? 'Write all content in English.'
        : language === 'both'
          ? 'Write the title in English and description in Arabic.'
          : 'Write all content in Arabic.';

      const userPrompt = `Generate 3 creative social media post ideas about: "${topic || 'actuarial science'}"

Platform: ${platform || 'instagram'}
 ${langInstruction}

Return ONLY a valid JSON array of 3 objects:
[
  {
    "id": 1,
    "title": "short catchy title",
    "description": "2-3 sentences",
    "type": "engagement|educational|announcement|motivational|fun",
    "suggestedHashtags": ["tag1", "tag2", "tag3"]
  }
]`;

      const content = await groqChat(systemPrompt, userPrompt, 0.8);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse ideas. Try again.' }, { status: 500 });
      }
      const ideas = safeJSONParse(jsonMatch[0]);
      return NextResponse.json({ ideas });

    } else if (action === 'caption') {
      const langInstruction = language === 'english'
        ? 'Write the caption in English.'
        : language === 'both'
          ? 'Write in Arabic first then English.'
          : 'Write the caption in Arabic.';

      const userPrompt = `Write a social media caption for: "${selectedIdea || topic || 'SGAS'}"

Platform: ${platform || 'instagram'}
 ${langInstruction}

Requirements:
- Engaging with a hook
- Hashtags at the end
- Call to action
- Appropriate length for ${platform || 'instagram'}

Return ONLY valid JSON:
{
  "caption": "full caption text",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedTime": "best time to post"
}`;

      const content = await groqChat(systemPrompt, userPrompt, 0.7);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse caption. Try again.' }, { status: 500 });
      }
      const result = safeJSONParse(jsonMatch[0]);
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
