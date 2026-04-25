import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminsData, getEventsData, saveEventsData } from '@/lib/auth';

// PUT: Update event (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const token = req.cookies.get('sgas-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admins = await getAdminsData();
    if (!admins[payload.email.toLowerCase()]) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await getEventsData();
    const index = events.findIndex((e: any) => e.id === id);
    if (index === -1) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const updatedData = await req.json();
    events[index] = { ...events[index], ...updatedData, id };
    await saveEventsData(events);

    return NextResponse.json({ success: true, event: events[index] });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE: Delete event (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const token = req.cookies.get('sgas-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admins = await getAdminsData();
    if (!admins[payload.email.toLowerCase()]) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await getEventsData();
    const filtered = events.filter((e: any) => e.id !== id);
    if (filtered.length === events.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await saveEventsData(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
