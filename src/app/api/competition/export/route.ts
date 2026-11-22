import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { verifyToken, getAdminsData } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isAdmin(req: NextRequest) {
  const token = req.cookies.get('sgas-token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  if (!payload) return false;
  const admins = await getAdminsData();
  return !!admins[payload.email.toLowerCase()];
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 });
  const { data, error } = await db
    .from('competition_registrations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data || [];

  const wb = new ExcelJS.Workbook();

  // Sheet 1: one row per team
  const teams = wb.addWorksheet('Teams');
  const cols: Partial<ExcelJS.Column>[] = [
    { header: '#', key: 'n', width: 5 },
    { header: 'Registered at (Cairo)', key: 'at', width: 22 },
    { header: 'Team name', key: 'team', width: 24 },
    { header: 'Team university', key: 'tu', width: 24 },
    { header: 'Members', key: 'count', width: 9 },
  ];
  for (let i = 1; i <= 4; i++) {
    const role = i === 1 ? 'Lead' : `Member ${i}`;
    for (const [k, h, w] of [['name', 'name', 22], ['age', 'age', 6], ['phone', 'phone', 16], ['uni', 'university', 22], ['year', 'year', 14], ['courses', 'actuarial courses/exams', 34]] as const) {
      cols.push({ header: `${role} ${h}`, key: `m${i}_${k}`, width: w });
    }
  }
  teams.columns = cols;

  // Sheet 2: one row per person
  const people = wb.addWorksheet('Members');
  people.columns = [
    { header: 'Team name', key: 'team', width: 24 },
    { header: 'Role', key: 'role', width: 10 },
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Age', key: 'age', width: 6 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'University', key: 'uni', width: 24 },
    { header: 'Academic year', key: 'year', width: 14 },
    { header: 'Actuarial courses/exams passed or taken', key: 'courses', width: 40 },
  ];

  rows.forEach((r: any, idx: number) => {
    const at = new Date(r.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });
    const row: Record<string, any> = { n: idx + 1, at, team: r.team_name, tu: r.team_university, count: r.member_count };
    (r.members || []).forEach((m: any, i: number) => {
      const p = `m${i + 1}_`;
      row[p + 'name'] = m.name; row[p + 'age'] = m.age; row[p + 'phone'] = m.phone;
      row[p + 'uni'] = m.university; row[p + 'year'] = m.year; row[p + 'courses'] = m.courses;
      people.addRow({ team: r.team_name, role: i === 0 ? 'Lead' : 'Member', name: m.name, age: m.age, phone: m.phone, uni: m.university, year: m.year, courses: m.courses });
    });
    teams.addRow(row);
  });
  for (const ws of [teams, people]) {
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  // Phones as text so leading zeros are kept
  people.getColumn('phone').numFmt = '@';

  const buf = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="sgas-competition-registrations-${date}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
