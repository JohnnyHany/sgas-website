import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminsData, getEventsData, saveEventsData } from '@/lib/auth';

// GET: List all events (public)
export async function GET() {
  try {
    const events = await getEventsData();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Create new event (admin only)
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

    const eventData = await req.json();
    const events = await getEventsData();

    const newEvent = {
      id: 'evt-' + Date.now(),
      ...eventData,
    };

    events.push(newEvent);
    await saveEventsData(events);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
