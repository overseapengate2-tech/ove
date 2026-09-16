/**
 * api/products.js — Featured products CRUD (Taobao/Tmall/1688 shortcuts)
 * GET  /api/products                         → public list (JSON array)
 * POST /api/products    body: {product}      → admin: add new
 * POST /api/products    body: {update,id}    → admin: update existing
 * POST /api/products    body: {delete,id}    → admin: remove
 * POST /api/products    body: {reorder,ids}  → admin: reorder (ids in new order)
 *
 * Storage: single Redis key `products:list` = JSON array
 */
import { isAdminReq } from '../lib/auth.js';

const BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'products:list';

async function redis(...args) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

async function loadAll() {
  const raw = await redis('GET', KEY);
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return []; }
}

async function saveAll(list) {
  await redis('SET', KEY, JSON.stringify(list));
}

function sanitizeProduct(p) {
  const src = String(p.source || 'taobao').toLowerCase();
  const allowedSrc = ['taobao', 'tmall', '1688'];
  return {
    id: String(p.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
    title: String(p.title || '').slice(0, 200),
    image: String(p.image || '').slice(0, 2000),
    price: String(p.price || '').slice(0, 40),
    url: String(p.url || '').slice(0, 2000),
    source: allowedSrc.includes(src) ? src : 'taobao',
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const list = await loadAll();
      return res.status(200).json({ ok: true, products: list });
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      // Public read via POST too (rarely useful) — allow if no action fields
      if (!body.product && !body.update && !body.delete && !body.reorder) {
        const list = await loadAll();
        return res.status(200).json({ ok: true, products: list });
      }

      // All write ops need admin
      if (!isAdminReq(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const list = await loadAll();

      if (body.product) {
        const p = sanitizeProduct(body.product);
        list.unshift(p);
        await saveAll(list);
        return res.status(200).json({ ok: true, product: p });
      }

      if (body.update && body.id) {
        const id = String(body.id);
        const idx = list.findIndex(x => x.id === id);
        if (idx < 0) return res.status(404).json({ ok: false, error: 'ไม่พบสินค้า' });
        const merged = sanitizeProduct({ ...list[idx], ...body.update, id });
        list[idx] = merged;
        await saveAll(list);
        return res.status(200).json({ ok: true, product: merged });
      }

      if (body.delete && body.id) {
        const id = String(body.id);
        const next = list.filter(x => x.id !== id);
        await saveAll(next);
        return res.status(200).json({ ok: true, removed: id });
      }

      if (body.reorder && Array.isArray(body.ids)) {
        const map = new Map(list.map(p => [p.id, p]));
        const next = body.ids.map(id => map.get(String(id))).filter(Boolean);
        // append any leftover items that weren't in the reorder list, preserving their order
        for (const p of list) if (!body.ids.includes(p.id)) next.push(p);
        await saveAll(next);
        return res.status(200).json({ ok: true, count: next.length });
      }

      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/products]', err);
    return res.status(500).json({ ok: false, error: err.message || 'server error' });
  }
}
