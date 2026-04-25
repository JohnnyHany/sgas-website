import { NextResponse } from 'next/server';
import { getAdminsData } from '@/lib/auth';

export async function GET() {
  try {
    const admins = await getAdminsData();
    const keys = Object.keys(admins);
    return NextResponse.json({
      status: 'ok',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      adminsFound: keys.length,
      adminEmails: keys,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message || String(error),
    });
  }
}
