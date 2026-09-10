/**
 * api/reviews.js — reviews + coupons (consolidated to stay under Hobby 12-fn limit)
 * GET    /api/reviews                       → list reviews
 * POST   /api/reviews                       → add review
 * DELETE /api/reviews?id=...                → delete review (admin)
 * GET    /api/reviews?resource=coupon              → (admin) list coupons
 * GET    /api/reviews?resource=coupon&code=XXX     → validate coupon (public)
 * POST   /api/reviews?resource=coupon              → (admin) create coupon
 * POST   /api/reviews?resource=coupon&action=redeem → mark used + apply discount
 * DELETE /api/reviews?resource=coupon&code=XXX     → (admin) delete coupon
 */

import { addReview, listReviews, deleteReview,
  createCoupon, getCoupon, listCoupons, redeemCoupon, deleteCoupon,
  getOrder, updateOrder, addBillHistory } from '../lib/redis.js';
import { isAdminReq } from '../lib/auth.js';

const MAX_IMG = 700 * 1024;

async function handleCoupon(req, res) {
  if (req.method === 'GET') {
    const code = String(req.query.code||'').trim();
    if (code) {
      const c = await getCoupon(code);
      if (!c) return res.status(404).json({ ok:false, error:'ไม่พบรหัสส่วนลดนี้' });
      if (c.used) return res.status(400).json({ ok:false, error:'รหัสส่วนลดนี้ถูกใช้ไปแล้ว' });
      return res.status(200).json({ ok:true, code:c.code, amount:c.amount, note:c.note });
    }
    if (!isAdminReq(req)) return res.status(401).json({ ok:false, error:'Unauthorized' });
    const items = await listCoupons(500);
    return res.status(200).json({ ok:true, coupons: items });
  }
  if (req.method === 'POST') {
    const action = String(req.query.action||'').trim();
    const b = req.body || {};
    if (action === 'redeem') {
      const code = String(b.code||'').trim().toUpperCase();
      const orderNo = String(b.orderNo||'').trim().toUpperCase();
      const email = String(b.email||'').trim().toLowerCase();
      if (!code || !orderNo) return res.status(400).json({ ok:false, error:'ต้องระบุรหัสและเลขบิล' });
      const order = await getOrder(orderNo);
      if (!order) return res.status(404).json({ ok:false, error:'ไม่พบบิลนี้' });
      if (email && String(order.customer?.email||'').toLowerCase() !== email) {
        return res.status(403).json({ ok:false, error:'บิลนี้ไม่ใช่ของคุณ' });
      }
      if (order.couponCode) return res.status(400).json({ ok:false, error:'บิลนี้ใช้ส่วนลดไปแล้ว' });
      if (['PAID','SHIPPED','DELIVERED'].includes(order.billStatus)) {
        return res.status(400).json({ ok:false, error:'บิลนี้ชำระเงินแล้ว ไม่สามารถใช้ส่วนลดได้' });
      }
      const coupon = await redeemCoupon(code, email || orderNo);
      const prevDisc = Number(order.discount)||0;
      await updateOrder(orderNo, {
        discount: prevDisc + coupon.amount,
        couponCode: coupon.code,
        couponAmount: coupon.amount,
      });
      await addBillHistory(orderNo, { action:'apply_coupon', note:`ใช้รหัส ${coupon.code} ลด ${coupon.amount} บาท` });
      return res.status(200).json({ ok:true, amount: coupon.amount });
    }
    if (!isAdminReq(req)) return res.status(401).json({ ok:false, error:'Unauthorized' });
    const coupon = await createCoupon({ code:b.code, amount:b.amount, note:b.note });
    return res.status(200).json({ ok:true, coupon });
  }
  if (req.method === 'DELETE') {
    if (!isAdminReq(req)) return res.status(401).json({ ok:false, error:'Unauthorized' });
    const code = String(req.query.code||'').trim();
    if (!code) return res.status(400).json({ ok:false, error:'ระบุ code' });
    await deleteCoupon(code);
    return res.status(200).json({ ok:true });
  }
  return res.status(405).json({ ok:false, error:'Method not allowed' });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (String(req.query.resource||'') === 'coupon') return handleCoupon(req, res);

    if (req.method === 'GET') {
      const page = Number(req.query.page) || 0;
      const size = Math.min(Number(req.query.size) || 60, 100);
      const reviews = await listReviews(page, size);
      return res.status(200).json({ ok: true, reviews });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const name = String(b.name || '').slice(0, 60).trim() || 'ลูกค้า';
      const email = String(b.email || '').slice(0, 120).trim();
      let picture = String(b.picture || '').slice(0, 400).trim();
      if (picture && !/^https:\/\//.test(picture)) picture = '';
      const text = String(b.text || '').slice(0, 600).trim();
      const rating = Math.max(1, Math.min(5, Number(b.rating) || 5));
      const image = typeof b.image === 'string' ? b.image : '';

      if (!text && !image) return res.status(400).json({ ok: false, error: 'กรุณาใส่ข้อความหรือรูปอย่างน้อย 1 อย่าง' });
      if (image) {
        if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(image)) return res.status(400).json({ ok: false, error: 'ไฟล์รูปไม่ถูกต้อง' });
        if (image.length > MAX_IMG) return res.status(400).json({ ok: false, error: 'รูปใหญ่เกินไป กรุณาลองใหม่' });
      }

      const review = {
        id: 'rv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name, email, picture, text, rating, image,
        createdAt: new Date().toISOString(),
      };
      await addReview(review);
      return res.status(200).json({ ok: true, review });
    }

    if (req.method === 'DELETE') {
      if (!isAdminReq(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
      const id = String(req.query.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, error: 'ระบุ id' });
      const ok = await deleteReview(id);
      return res.status(200).json({ ok });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch(err) {
    return res.status(400).json({ ok:false, error: err.message || 'error' });
  }
}
