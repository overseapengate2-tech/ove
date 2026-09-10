/**
 * lib/auth.js — Admin authentication helper
 * รองรับหลาย env name + ไม่ throw เมื่อ env ยังไม่ตั้ง (แค่ปฏิเสธการ auth)
 */
import crypto from 'crypto';

function adminKey() {
  const k = (process.env.ADMIN_SECRET_KEY || process.env.ADMIN_KEY || process.env.OPG_ADMIN_KEY || '').trim();
  return k;
}

/* เปรียบเทียบแบบ timing-safe (กัน timing attack) */
export function isAdminReq(req) {
  const sent = String(req.headers['x-admin-key'] || '').trim();
  if (!sent) return false;
  const expected = adminKey();
  if (!expected) {
    console.error('[auth] ADMIN_SECRET_KEY / ADMIN_KEY env var is not set on server');
    return false;
  }
  const a = Buffer.from(sent);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}
