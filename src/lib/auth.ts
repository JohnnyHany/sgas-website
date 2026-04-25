import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
  "hossamganna399@gmail.com": "Gann Hossam",
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

// ===== Data Directory (uses /tmp on Vercel for write access) =====
function getDataDir(): string {
  const tmpDir = '/tmp/sgas-data';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

// ===== Admin Data Store (JSON file) =====
export interface AdminData {
  passwordHash: string;
  name: string;
}

export function getAdminsData(): Record<string, AdminData> {
  try {
    const dir = getDataDir();
    const filePath = path.join(dir, 'admins.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    const projectFile = path.join(process.cwd(), 'data', 'admins.json');
    if (fs.existsSync(projectFile)) {
      const data = fs.readFileSync(projectFile, 'utf-8');
      const parsed = JSON.parse(data);
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveAdminsData(data: Record<string, AdminData>): void {
  const dir = getDataDir();
  fs.writeFileSync(path.join(dir, 'admins.json'), JSON.stringify(data, null, 2));
}

// ===== Events Data Store (JSON file) =====
export function getEventsData(): any[] {
  try {
    const dir = getDataDir();
    const filePath = path.join(dir, 'events.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    const projectFile = path.join(process.cwd(), 'data', 'events.json');
    if (fs.existsSync(projectFile)) {
      const data = fs.readFileSync(projectFile, 'utf-8');
      const parsed = JSON.parse(data);
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveEventsData(events: any[]): void {
  const dir = getDataDir();
  fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(events, null, 2));
}