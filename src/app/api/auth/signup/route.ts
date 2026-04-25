import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAdmin, getAdminsData, saveAdminsData, hashPassword, ADMIN_NAMES, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check whitelist
    if (!isAllowedAdmin(normalizedEmail)) {
      return NextResponse.json(
        { error: 'This email is not authorized for admin access. Only SGAS team members can register.' },
        { status: 403 }
      );
    }

    // Check if already registered
    const admins = await getAdminsData();
    if (admins[normalizedEmail]) {
      return NextResponse.json(
        { error: 'This email is already registered. Please login instead.' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create account
    const passwordHash = await hashPassword(password);
    const name = ADMIN_NAMES[normalizedEmail] || normalizedEmail;

    admins[normalizedEmail] = { passwordHash, name };
    await saveAdminsData(admins);

    // Create session token (remember by default on signup)
    const token = await createToken(normalizedEmail, true);

    const response = NextResponse.json({
      success: true,
      admin: { email: normalizedEmail, name }
    });

    response.cookies.set('sgas-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
