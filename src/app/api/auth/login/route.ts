import { NextRequest, NextResponse } from 'next/server';
import { getAdminsData, comparePassword, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const admins = await getAdminsData();
    const admin = admins[normalizedEmail];

    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createToken(normalizedEmail, rememberMe);

    const response = NextResponse.json({
      success: true,
      admin: { email: normalizedEmail, name: admin.name }
    });

    response.cookies.set('sgas-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
