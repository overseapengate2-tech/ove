/* ─────────────────────────────────────────────────────────────
   Oversea PenGate · Floating LINE Follow FAB (shared)
   - Bottom-right green LINE button on every page
   - Popup shows: add-friend button + QR code + first-order discount
   - Auto-generates QR client-side (no external image request)
   Include on any page:  <script src="/line-fab.js" defer></script>
   ───────────────────────────────────────────────────────────── */
(function(){
  if (window.__opgLineFab) return;
  window.__opgLineFab = true;

  var LINE_URL = 'https://line.me/R/ti/p/@overseapengate';
  var LINE_OA  = '@overseapengate';

  // Don't show on admin panel
  if (/\/admin\.html?$/i.test(location.pathname)) return;

  var css = ''+
  '.opg-fab-wrap{position:fixed;left:16px;bottom:16px;z-index:9998;font-family:"IBM Plex Sans Thai",system-ui,sans-serif}'+
  '.opg-fab{width:60px;height:60px;border-radius:50%;background:#06C755;color:#fff;display:flex;align-items:center;justify-content:center;'+
  '  box-shadow:0 8px 22px rgba(6,199,85,.45),0 2px 6px rgba(0,0,0,.15);cursor:pointer;border:none;transition:transform .2s;position:relative}'+
  '.opg-fab:hover{transform:scale(1.08)}'+
  '.opg-fab svg{width:32px;height:32px;fill:#fff}'+
  '.opg-fab .opg-fab-badge{position:absolute;top:-4px;right:-4px;background:#ff3b30;color:#fff;font-size:10px;font-weight:700;'+
  '  padding:3px 6px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)}'+
  '.opg-fab-pop{position:fixed;left:16px;bottom:88px;z-index:9999;background:#fff;border-radius:16px;'+
  '  box-shadow:0 12px 40px rgba(0,0,0,.22);padding:16px 16px 14px;width:280px;max-width:calc(100vw - 32px);'+
  '  display:none;animation:opgPopIn .22s ease-out}'+
  '.opg-fab-pop.open{display:block}'+
  '@keyframes opgPopIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'+
  '.opg-fab-pop .opg-close{position:absolute;top:6px;right:8px;background:none;border:none;font-size:20px;color:#999;cursor:pointer;line-height:1;padding:4px}'+
  '.opg-fab-promo{background:linear-gradient(135deg,#FFF4D6,#FFE7A6);border:1px solid #FFCC66;border-radius:10px;padding:9px 12px;'+
  '  font-size:12.5px;color:#7a4d00;font-weight:700;margin-bottom:12px;text-align:center;line-height:1.4}'+
  '.opg-fab-promo b{color:#c34500;display:block;font-size:13.5px;margin-bottom:2px}'+
  '.opg-fab-title{font-size:15px;font-weight:700;color:#3C3526;text-align:center;margin-bottom:2px}'+
  '.opg-fab-sub{font-size:12px;color:#7C715B;text-align:center;margin-bottom:10px}'+
  '.opg-fab-qr{background:#F6F0E1;border:1px solid #E7DBC0;border-radius:10px;padding:10px;margin-bottom:10px;display:flex;justify-content:center}'+
  '.opg-fab-qr canvas,.opg-fab-qr img{display:block;width:170px;height:170px;background:#fff;border-radius:6px}'+
  '.opg-fab-qr-hint{font-size:11px;color:#7C715B;text-align:center;margin:-4px 0 10px}'+
  '.opg-fab-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#06C755;color:#fff;'+
  '  padding:11px 16px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 4px 12px rgba(6,199,85,.3)}'+
  '.opg-fab-btn:hover{background:#05a548}'+
  '.opg-fab-oa{text-align:center;margin-top:8px;font-size:12px;color:#7C715B}'+
  '.opg-fab-oa b{color:#06C755}'+
  '@media (max-width:480px){.opg-fab{width:54px;height:54px}.opg-fab svg{width:28px;height:28px}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.className = 'opg-fab-wrap';
  wrap.innerHTML = ''+
    '<div class="opg-fab-pop" id="opgFabPop" role="dialog" aria-label="ติดต่อทาง LINE">'+
      '<button class="opg-close" type="button" aria-label="ปิด">×</button>'+
      '<div class="opg-fab-promo"><b>🎁 แอดไลน์รับส่วนลดค่าส่งครั้งแรก!</b>สอบถามราคาฟรี · ตอบเร็วภายใน 24 ชม.</div>'+
      '<div class="opg-fab-title">คุยกับแอดมิน Oversea PenGate</div>'+
      '<div class="opg-fab-sub">สแกน QR หรือกดปุ่มด้านล่าง</div>'+
      '<div class="opg-fab-qr" id="opgFabQR"></div>'+
      '<div class="opg-fab-qr-hint">📱 สแกนด้วยกล้อง / แอป LINE</div>'+
      '<a class="opg-fab-btn" href="'+LINE_URL+'" target="_blank" rel="noopener">'+
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>'+
        'แอด LINE @overseapengate'+
      '</a>'+
      '<div class="opg-fab-oa">LINE OA · <b>'+LINE_OA+'</b></div>'+
    '</div>'+
    '<button class="opg-fab" id="opgFabBtn" type="button" aria-label="ติดต่อทาง LINE">'+
      '<svg viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>'+
      '<span class="opg-fab-badge">รับส่วนลด 🎁</span>'+
    '</button>';

  function mount(){
    if (!document.body) { document.addEventListener('DOMContentLoaded', mount); return; }
    document.body.appendChild(wrap);
    var btn = wrap.querySelector('#opgFabBtn');
    var pop = wrap.querySelector('#opgFabPop');
    var closeBtn = wrap.querySelector('.opg-close');
    var qrLoaded = false;

    function openPop(){
      pop.classList.add('open');
      var badge = wrap.querySelector('.opg-fab-badge');
      if (badge) badge.style.display = 'none';
      if (!qrLoaded) { drawQR(); qrLoaded = true; }
    }
    function closePop(){ pop.classList.remove('open'); }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      if (pop.classList.contains('open')) closePop(); else openPop();
    });
    closeBtn.addEventListener('click', function(e){ e.stopPropagation(); closePop(); });
    document.addEventListener('click', function(e){
      if (pop.classList.contains('open') && !pop.contains(e.target) && !btn.contains(e.target)) closePop();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closePop(); });
  }

  function drawQR(){
    var host = wrap.querySelector('#opgFabQR');
    var scriptSrc = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    function render(){
      try {
        host.innerHTML = '';
        new window.QRCode(host, { text: LINE_URL, width: 170, height: 170, colorDark: '#000', colorLight: '#fff', correctLevel: window.QRCode.CorrectLevel.M });
      } catch(err){ fallback(); }
    }
    function fallback(){
      // Simple text fallback if QR lib fails
      host.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:#7C715B">'+
        '<div style="font-size:32px;margin-bottom:6px">📱</div>'+
        'สแกน QR ไม่ได้?<br>กดปุ่มเขียวด้านล่าง</div>';
    }
    if (window.QRCode) { render(); return; }
    var s = document.createElement('script');
    s.src = scriptSrc;
    s.onload = render;
    s.onerror = fallback;
    document.head.appendChild(s);
  }

  mount();
})();
