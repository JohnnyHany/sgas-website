import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-admin';
import { isRegistrationOpen, MIN_TEAM_SIZE, MAX_TEAM_SIZE } from '@/lib/competition';

const s = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: NextRequest) {
  if (!isRegistrationOpen()) {
    return NextResponse.json({ error: 'closed' }, { status: 403 });
  }
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }

  // Honeypot
  if (s(body?.website)) return NextResponse.json({ ok: true });

  const teamName = s(body?.teamName, 100);
  const teamUniversity = s(body?.teamUniversity, 150);
  const rawMembers = Array.isArray(body?.members) ? body.members : [];
  if (!teamName || !teamUniversity || rawMembers.length < MIN_TEAM_SIZE || rawMembers.length > MAX_TEAM_SIZE) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const members: any[] = [];
  for (const m of rawMembers) {
    const age = Number(m?.age);
    const member = {
      name: s(m?.name, 120),
      age,
      phone: s(m?.phone, 30),
      university: s(m?.university, 150),
      year: s(m?.year, 50),
      courses: s(m?.courses, 500),
    };
    if (!member.name || !member.phone || !member.university || !member.year || !member.courses ||
        !Number.isFinite(age) || age < 14 || age > 60 || !/^[0-9+\-\s()]{7,30}$/.test(member.phone)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    members.push(member);
  }

  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: 'server-config' }, { status: 500 });
  const { error } = await db.from('competition_registrations').insert({
    team_name: teamName,
    team_university: teamUniversity,
    member_count: members.length,
    members,
  });
  if (error) {
    console.error('competition insert failed', error.message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
