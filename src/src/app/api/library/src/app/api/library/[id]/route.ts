import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminsData } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const BUCKET = 'library';

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('sgas-token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  if (!payload) return false;
  const admins = await getAdminsData();
  return !!admins[payload.email.toLowerCase()];
}

// PUT: edit title / description / link / article content (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    const { data: existing, error: findErr } = await supabase
      .from('library_items')
      .select('*')
      .eq('id', id)
      .single();
    if (findErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: any = {};
    if (typeof body.title === 'string') {
      if (!body.title.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      update.title = body.title.trim();
    }
    if (typeof body.description === 'string') update.description = body.description.trim();

    if (existing.type === 'link' && typeof body.url === 'string') {
      if (!/^https?:\/\//i.test(body.url.trim())) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
      update.url = body.url.trim();
    }
    if (existing.type === 'article') {
      if (typeof body.content === 'string') update.content = body.content.trim();
      if (typeof body.url === 'string') {
        const u = body.url.trim();
        if (u && !/^https?:\/\//i.test(u)) {
          return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }
        update.url = u;
      }
    }

    const { error } = await supabase.from('library_items').update(update).eq('id', id);
    if (error) {
      console.error('Library update error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Library PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: remove item and its file (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: existing } = await supabase
      .from('library_items')
      .select('file_path')
      .eq('id', id)
      .single();

    if (existing?.file_path) {
      await supabase.storage.from(BUCKET).remove([existing.file_path]);
    }

    const { error } = await supabase.from('library_items').delete().eq('id', id);
    if (error) {
      console.error('Library delete error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Library DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
