import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

// ===== Allowed Admin Emails (Whitelist) =====
export const ALLOWED_ADMINS = [
  "johnnyhany399@gmail.com",
  "alibedawy966@gmail.com",
  "hossamganna3@gmail.com",
  "shahd.abdelsalam1326@gmail.com",
  "ebrahimayman2262@gmail.com",
  "mbdalkafy19@gmail.com",
  "salmamahmoud7454@gmail.com",
  "Fahmyhamed123@gmail.com",
];

export const ADMIN_NAMES: Record<string, string> = {
  "johnnyhany399@gmail.com": "Johnny Hany",
  "alibedawy966@gmail.com": "Ali Hossam",
  "hossamganna3@gmail.com": "Gann Hossam",
  "shahd.abdelsalam1326@gmail.com": "Shahd Abdelsalam",
  "ebrahimayman2262@gmail.com": "Ebrahim Aymn",
  "mbdalkafy19@gmail.com": "Mohamed Abdelkafi",
  "salmamahmoud7454@gmail.com": "Salma Mohamed",
  "Fahmyhamed123@gmail.com": "Ahmed Fahmy",
};

// ===== JWT Helpers =====
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'sgas-auth-secret-2026-do-not-use-in-production'
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(email: string, rememberMe: boolean = false): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(rememberMe ? '90d' : '7d')
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as { email: string };
  } catch {
    return null;
  }
}

export function isAllowedAdmin(email: string): boolean {
  return ALLOWED_ADMINS.includes(email.toLowerCase().trim());
}

// ===== Admin Data Store (Supabase) =====
export interface AdminData {
  passwordHash: string;
  name: string;
}

export async function getAdminsData(): Promise<Record<string, AdminData>> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email, password_hash, name');

    if (error) {
      console.error('Failed to fetch admins from Supabase:', error);
      return {};
    }

    const admins: Record<string, AdminData> = {};
    for (const row of (data || [])) {
      admins[row.email.toLowerCase()] = {
        passwordHash: row.password_hash,
        name: row.name,
      };
    }
    return admins;
  } catch (error) {
    console.error('getAdminsData error:', error);
    return {};
  }
}

export async function saveAdminsData(data: Record<string, AdminData>): Promise<void> {
  try {
    // Upsert each admin
    for (const [email, adminData] of Object.entries(data)) {
      const { error } = await supabase
        .from('admins')
        .upsert({
          email: email.toLowerCase(),
          password_hash: adminData.passwordHash,
          name: adminData.name,
        }, { onConflict: 'email' });

      if (error) {
        console.error(`Failed to save admin ${email}:`, error);
      }
    }
  } catch (error) {
    console.error('saveAdminsData error:', error);
  }
}

// ===== Events Data Store (Supabase) =====
export async function getEventsData(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch events from Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      description: row.description,
      location: row.location,
      type: row.type,
    }));
  } catch (error) {
    console.error('getEventsData error:', error);
    return [];
  }
}

export async function saveEventsData(events: any[]): Promise<void> {
  try {
    // Delete all existing events and re-insert
    await supabase.from('events').delete().neq('id', '___never___');

    if (events.length > 0) {
      const rows = events.map((evt: any) => ({
        id: evt.id,
        title: evt.title || '',
        date: evt.date || '',
        description: evt.description || '',
        location: evt.location || '',
        type: evt.type || '',
      }));

      const { error } = await supabase.from('events').insert(rows);
      if (error) {
        console.error('Failed to save events:', error);
      }
    }
  } catch (error) {
    console.error('saveEventsData error:', error);
  }
}
