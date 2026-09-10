/**
 * lib/seventrack.js
 * เชื่อมต่อ AfterShip API v4 — ลงทะเบียน + ดึงสถานะพัสดุ
 * ใช้ env: AFTERSHIP_API_KEY (asat_xxxxx จาก aftership.com)
 * (คงชื่อไฟล์เดิมเพื่อไม่ต้องแก้ import ทั้งโปรเจกต์)
 */

const KEY  = () => (process.env.AFTERSHIP_API_KEY || process.env.SEVENTEENTRACK_KEY || '').trim();
const BASE = 'https://api.aftership.com/v4';

async function call(method, path, body) {
  const opts = {
    method,
    headers: {
      'aftership-api-key': KEY(),
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}${path}`, opts);
  return r.json();
}

/* ลงทะเบียนเลขพัสดุกับ AfterShip (ทำครั้งเดียวต่อเลข — ซ้ำก็ไม่เป็นไร) */
export async function registerTracking(number) {
  if (!KEY() || !number) return null;
  try {
    return await call('POST', '/trackings', { tracking: { tracking_number: String(number) } });
  } catch (e) { return null; }
}

/* ดึงข้อมูลสถานะพัสดุ — คงรูปทรงเดิมที่ refresh.js ใช้ */
export async function getTrackInfo(number) {
  if (!KEY() || !number) return null;
  try {
    const r = await call('GET', `/trackings?tracking_numbers=${encodeURIComponent(number)}`);
    const t = r?.data?.trackings?.[0];
    if (!t) return { data: { accepted: [] } };
    return {
      data: {
        accepted: [{
          number,
          track_info: {
            latest_status: { status: t.tag || '' },
            _checkpoints: t.checkpoints || [],
          },
        }],
      },
    };
  } catch (e) { return null; }
}

/* แปลง checkpoints เป็น events มาตรฐาน (ใหม่สุดขึ้นก่อน) */
export function normalizeEvents(trackInfo) {
  const cps = trackInfo?._checkpoints || [];
  return cps.map(cp => ({
    time:     cp.checkpoint_time || cp.created_at || '',
    location: [cp.city, cp.state, cp.country_name].filter(Boolean).join(', ') || cp.location || '',
    detail:   cp.message || '',
    stage:    cp.tag || '',
  })).reverse();
}

/* หาเวลาที่พัสดุถูกส่งถึง (Delivered) */
export function deliveredTime(trackInfo) {
  const cps = trackInfo?._checkpoints || [];
  const d = cps.find(c => c.tag === 'Delivered');
  return d?.checkpoint_time || null;
}
