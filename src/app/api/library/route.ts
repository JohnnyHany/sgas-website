import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminsData } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET = 'library';

const ALLOWED_EXT: Record<string, 'pdf' | 'pptx'> = {
  pdf: 'pdf',
  ppt: 'pptx',
  pptx: 'pptx',
};

async function getAdminEmail(
  req: NextRequest
): Promise<{ email: string | null; reason: string }> {
  const token = req.cookies.get('sgas-token')?.value;
  if (!token) return { email: null, reason: 'no-cookie' };
  const payload = await verifyToken(token);
  if (!payload) return { email: null, reason: 'invalid-token' };
  const admins = await getAdminsData();
  if (!admins[payload.email.toLowerCase()]) return { email: null, reason: 'not-in-admins-table' };
  return { email: payload.email.toLowerCase(), reason: 'ok' };
}

function mapRow(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description || '',
    url: row.url || '',
    filePath: row.file_path || '',
    fileName: row.file_name || '',
    fileSize: row.file_size || 0,
    content: row.content || '',
    createdBy: row.created_by || '',
    createdAt: row.created_at,
  };
}

// GET: list all library items (public)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('library_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Library fetch error:', error);
      return NextResponse.json([]);
    }
    return NextResponse.json((data || []).map(mapRow));
  } catch (error) {
    console.error('Library GET error:', error);
    return NextResponse.json([]);
  }
}

// POST: create item (admin only)
export async function POST(req: NextRequest) {
  try {
        const auth = await getAdminEmail(req);
    if (!auth.email) {
      return NextResponse.json({ error: 'Unauthorized: ' + auth.reason }, { status: 401 });
    }
    const adminEmail = auth.email;

    const form = await req.formData();
    const type = String(form.get('type') || '');
    const title = String(form.get('title') || '').trim();
    const description = String(form.get('description') || '').trim();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!['pdf', 'pptx', 'link', 'article'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const id = 'lib-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const row: any = {
      id,
      type,
      title,
      description,
      created_by: adminEmail,
    };

    if (type === 'link') {
      const url = String(form.get('url') || '').trim();
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: 'Invalid URL (must start with http/https)' }, { status: 400 });
      }
      row.url = url;
    } else if (type === 'article') {
      const content = String(form.get('content') || '').trim();
      const url = String(form.get('url') || '').trim();
      if (!content && !url) {
        return NextResponse.json({ error: 'Article text or link is required' }, { status: 400 });
      }
      if (url && !/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: 'Invalid URL (must start with http/https)' }, { status: 400 });
      }
      row.content = content;
      row.url = url;
    } else {
      const file = form.get('file');
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File is larger than 10MB' }, { status: 413 });
      }
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const detected = ALLOWED_EXT[ext];
      if (!detected) {
        return NextResponse.json({ error: 'Only PDF / PPT / PPTX files are allowed' }, { status: 400 });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${id}/${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
      if (upErr) {
        console.error('Upload error:', upErr);
        return NextResponse.json({ error: 'Upload failed: ' + upErr.message }, { status: 500 });
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      row.type = detected;
      row.url = pub.publicUrl;
      row.file_path = path;
      row.file_name = file.name;
      row.file_size = file.size;
    }

    const { data, error } = await supabase.from('library_items').insert(row).select().single();
    if (error) {
      console.error('Library insert error:', error);
      if (row.file_path) await supabase.storage.from(BUCKET).remove([row.file_path]);
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: mapRow(data) });
  } catch (error) {
    console.error('Library POST error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
