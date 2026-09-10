/**
 * api/coupons.js
 * GET    /api/coupons                     → (admin) list all coupons
 * GET    /api/coupons?code=XXX            → validate coupon (public), returns {ok, amount}
 * POST   /api/coupons                     → (admin) create   body:{ code, amount, note }
 * POST   /api/coupons?action=redeem       → mark as used     body:{ code, orderNo, email }
 * DELETE /api/coupons?code=XXX            → (admin) delete
 */
import { createCoupon, getCoupon, listCoupons, redeemCoupon, deleteCoupon, getOrder, updateOrder, addBillHistory } from '../lib/redis.js';
import { isAdminReq } from '../lib/auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

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
        if (order.billStatus === 'PAID' || order.billStatus === 'SHIPPED' || order.billStatus === 'DELIVERED') {
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
  } catch(err) {
    return res.status(400).json({ ok:false, error: err.message || 'error' });
  }
}
