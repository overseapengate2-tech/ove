/**
 * lib/iapp.js — iApp Technology OCR wrapper (Thai National ID card front only)
 * Requires: process.env.IAPP_API_KEY
 * Docs: https://iapp.co.th/docs/ekyc
 */

const IAPP_BASE = 'https://api.iapp.co.th/v3/store/ekyc';
const KEY = () => (process.env.IAPP_API_KEY || '').trim();

function dataUrlToBlob(dataUrl, fallbackType = 'image/jpeg') {
  const s = String(dataUrl || '');
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  const type = m ? m[1] : fallbackType;
  const b64 = m ? m[2] : s.replace(/^data:.*;base64,/, '');
  const bytes = Buffer.from(b64, 'base64');
  return new Blob([bytes], { type });
}

async function callIapp(path, formData, timeoutMs = 30000) {
  const key = KEY();
  if (!key) throw new Error('IAPP_API_KEY ยังไม่ได้ตั้งค่าในระบบ');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${IAPP_BASE}${path}`, {
      method: 'POST',
      headers: { apikey: key },
      body: formData,
      signal: ctrl.signal,
    });
  } finally { clearTimeout(timer); }
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `iApp HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    try { console.error('[iapp]', path, res.status, text.slice(0, 300)); } catch {}
    throw err;
  }
  return data || {};
}

/* ตรวจ checksum เลขบัตร ปชช ไทย 13 หลัก (mod 11) */
export function validThaiId(id) {
  const s = String(id || '').replace(/\D/g, '');
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(s[12]);
}

/**
 * OCR หน้าบัตรประชาชนไทย
 * @param {string} imageDataUrl - data URL หรือ base64 ล้วน
 * @returns {Promise<{idNumber, thName, enName, dob, valid}>}
 */
export async function ocrThaiIdFront(imageDataUrl) {
  const fd = new FormData();
  fd.append('file', dataUrlToBlob(imageDataUrl), 'idcard.jpg');
  const r = await callIapp('/thai-national-id-card/front', fd);
  const idNumber = String(r.id_number || '').replace(/\D/g, '');
  return {
    idNumber,
    thName: r.th_name || '',
    enName: r.en_name || '',
    dob: r.th_dob || r.en_dob || '',
    valid: validThaiId(idNumber),
    raw: r,
  };
}
