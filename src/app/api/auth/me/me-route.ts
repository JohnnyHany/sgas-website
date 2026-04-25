import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAdminsData } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sgas-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const admins = await getAdminsData();
  const admin = admins[payload.email.toLowerCase()];

  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 401 });
  }

  return NextResponse.json({
    admin: { email: payload.email, name: admin.name }
  });
}
