import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminsData } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

const SGAS_CONTEXT = `You are the social media manager for SGAS (Strive and Grow in Actuarial Science).
SGAS is a student activity founded at Cairo University's Faculty of Commerce, Department of Actuarial Science.
It also operates at Ain Shams University.

Key info:
- Name: SGAS - Strive and Grow in Actuarial Science
- Founded: 2024
- Universities: Cairo University (Faculty of Commerce) + Ain Shams University (Faculty of Science, Girls' Campus)
- Target: Actuarial science students
- Activities: Workshops, seminars, networking events, competitions, study materials sharing, career development
- Instagram: @sgas.cu
- LinkedIn: SGAS
- Website: sgas-website.vercel.app
- Colors: Navy Blue (#001440), Red (#B22222), Green (#006400)
- Tone: Professional yet friendly, student-oriented, bilingual (English & Arabic)
- Values: Academic excellence, community building, career growth, knowledge sharing

Post types you can suggest:
1. Event announcements (upcoming events)
2. Event recaps/highlights (past events)
3. Actuarial science tips & study advice
4. Member spotlights
5. Industry news & career opportunities
6. Exam preparation tips (SOA, IFoA)
7. Community milestones
8. Motivational/inspirational posts
9. Q&A or myth-busting about actuarial science
10. Collaboration announcements`;

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('sgas-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admins = await getAdminsData();
    if (!admins[payload.email.toLowerCase()]) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const zai = await ZAI.create();

    switch (action) {
      case 'ideas': {
        const topic = body.topic || '';
        const extraContext = topic ? `\n\nThe admin wants posts related to: ${topic}` : '';

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `${SGAS_CONTEXT}${extraContext}

Generate exactly 3 creative post ideas for SGAS social media. For each idea provide:
- A catchy title
- Brief description of the content
- Suggested platform (instagram, linkedin, or both)
- Post type (from the list above)
- Suggested posting time
- Language (en, ar, or both)

Return ONLY a valid JSON array with this exact structure, no markdown, no code blocks:
[{"title": "...", "description": "...", "platform": "...", "type": "...", "bestTime": "...", "language": "..."}]

Make ideas diverse - mix between educational, engaging, event-related, and community-focused.
Keep descriptions concise (1-2 sentences each).
Prefer English for general posts, Arabic for Egypt-specific content.`,
            },
          ],
        });

        const raw = completion.choices[0]?.message?.content || '[]';
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const ideas = JSON.parse(cleaned);
        return NextResponse.json({ ideas });
      }

      case 'caption': {
        const { idea, platform, language } = body;

        if (!idea || !platform) {
          return NextResponse.json({ error: 'Missing idea or platform' }, { status: 400 });
        }

        const langInstruction = language === 'ar'
          ? 'Write the FULL caption in Arabic (Egyptian dialect mixed with MSA is OK).'
          : language === 'both'
          ? 'Write the caption in BOTH English and Arabic. Start with English, then add "---" and the Arabic version.'
          : 'Write the FULL caption in English.';

        const platformInstructions: Record<string, string> = {
          instagram: `Instagram format:
- Start with an attention-grabbing hook (1-2 lines)
- Keep paragraphs short (2-3 lines max each)
- Use relevant emojis (not too many, 5-8 total)
- End with 15-20 relevant hashtags including: #SGAS #ActuarialScience #CairoUniversity #AinShams #علوم_اكتوارية
- Include a clear CTA (Call To Action) at the end
- Maximum 2200 characters`,
          linkedin: `LinkedIn format:
- Professional yet approachable tone
- Start with a compelling opening line
- Use bullet points or short paragraphs for readability
- Include relevant industry hashtags (5-8 max)
- End with a question to encourage engagement
- No emojis overload, keep it professional`,
          both: `Create TWO versions:
VERSION 1 (Instagram): Same as Instagram format above
VERSION 2 (LinkedIn): Same as LinkedIn format above
Separate them clearly with "=== INSTAGRAM ===" and "=== LINKEDIN ==="`,
        };

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `${SGAS_CONTEXT}

 ${langInstruction}

Platform requirements:
 ${platformInstructions[platform] || platformInstructions.instagram}

The post idea to expand into a full post:
"${idea}"

Return ONLY the caption text, no explanations, no markdown code blocks, no quotation marks around the entire thing.
Just the ready-to-post caption text.`,
            },
          ],
        });

        const caption = completion.choices[0]?.message?.content || '';
        const cleaned = caption.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
        return NextResponse.json({ caption: cleaned });
      }

      case 'image-prompt': {
        const { idea } = body;

        if (!idea) {
          return NextResponse.json({ error: 'Missing idea' }, { status: 400 });
        }

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a professional social media graphic designer for SGAS (Strive and Grow in Actuarial Science).

Given the post idea below, generate a detailed image generation prompt for creating a social media post graphic.

Requirements for the image prompt:
- For Instagram: 1080x1080 square format, modern, clean design
- Include SGAS branding colors: Navy Blue (#001440), Red (#B22222), Green (#006400)
- Include the SGAS logo mention or "SGAS" text
- Professional but appealing to university students
- The design should be eye-catching on a phone screen
- Include relevant visual elements (charts, graduation caps, calculators, books, etc.)

The post idea: "${idea}"

Return ONLY the image prompt text in English, nothing else. Max 200 words.
Do NOT include any hashtags, captions, or explanations. Just the visual description.`,
            },
          ],
        });

        const prompt = completion.choices[0]?.message?.content || '';
        return NextResponse.json({ prompt: prompt.trim() });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Social API error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
