/**
 * i18n.js — Thai / English / Chinese switcher
 * Include this on every page: <script src="/i18n.js" defer></script>
 *
 * How it works:
 *  - Language stored in localStorage.opg_lang (persists across pages)
 *  - On load: walks text nodes + common attrs (placeholder/title/alt/aria-label)
 *    replacing Thai strings that exist in the dictionary
 *  - MutationObserver catches JS-added nodes (orders/bills/admin render lists)
 *
 * Adding translations: just extend TRANSLATIONS[<lang>] with { "ไทย": "..." }
 * Keys must match the TRIMMED text as it appears in HTML/DOM (whitespace at
 * ends is preserved in the DOM node so we replace only the trimmed portion).
 */
(function () {
  var LANG_KEY = 'opg_lang';
  var currentLang = localStorage.getItem(LANG_KEY) || 'th';

  /* ────────────── DICTIONARY ────────────── */
  var TRANSLATIONS = {
    en: {
      /* --- header / nav / sidebar --- */
      'หน้าหลัก': 'Home',
      'หน้าแรก': 'Home',
      'วิธีสั่งซื้อ': 'How to Order',
      'คำนวณค่าส่ง': 'Shipping Calculator',
      'สั่งซื้อ': 'Order',
      'ตรวจสอบสถานะออเดอร์': 'Track Order',
      'ตรวจสอบสถานะ': 'Track Order',
      'ตรวจสอบสถานะสินค้า': 'Track Shipment',
      'ติดตามสถานะสินค้า': 'Track Shipment',
      'รายการสั่งซื้อสินค้าจีน': 'China Orders',
      'รายการบิลค่าขนส่ง': 'Shipping Bills',
      'ที่อยู่ของฉัน': 'My Addresses',
      'รีวิว': 'Reviews',
      'ติดต่อ': 'Contact',
      'ติดต่อเรา': 'Contact Us',
      'การเงิน (เติมเงิน)': 'Wallet (Top up)',
      'เพิ่มเพื่อน LINE': 'Add LINE Friend',
      'เข้าสู่ระบบ': 'Log In',
      'สมัครสมาชิก': 'Sign Up',
      'ออก': 'Log Out',
      'ยังไม่เข้าสู่ระบบ': 'Not signed in',
      'ภาษา': 'Language',

      /* --- hero / homepage --- */
      'นำเข้าสินค้าจากจีน': 'Import from China',
      'ส่งถึงมือคุณ': 'Delivered to you',
      'แค่วางลิงก์สินค้าที่อยากได้ ทีมงาน Oversea PenGate จะเช็คราคารวมค่าส่งให้':
        'Just paste the product link and our team quotes total shipping-included price.',
      'ฝากสั่งสินค้า + จ่ายเงิน': 'Purchase + Pay-on-behalf',
      'วางลิงก์ + รูป + อธิบาย': 'Paste link + photo + notes',
      'ฝากจ่ายเงิน': 'Pay-on-behalf',
      'เราจ่ายหยวน · จ่ายบาทตามเรท': 'We pay CNY · You pay THB at rate',
      'บริการชิปปิ้ง': 'Shipping Service',
      'จีน → ไทย → ส่งถึงบ้าน': 'China → Thailand → Door delivery',

      /* --- steps --- */
      'ขั้นตอนง่าย ๆ': 'Easy Steps',
      'วิธีสั่งซื้อ & นำเข้าสินค้า': 'How to Order & Import',
      'เลือกบริการที่เหมาะกับคุณ — สั่งซื้อจากเว็บจีน หรือให้เราสั่งให้ก็ได้':
        'Choose the service that fits — order from China yourself or let us order for you',

      /* --- LINE banner --- */
      'แจ้งราคาทาง LINE': 'Quote via LINE',
      'ภายใน 24 ชม.': 'Within 24 hours',
      'วางลิงก์สินค้า': 'Paste product link',
      'ส่งถึงบ้าน': 'Deliver to home',
      'รวดเร็ว ปลอดภัย': 'Fast & Safe',
      'กำลังดำเนินการ': 'In progress',

      /* --- login/register modal --- */
      'กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ': 'Enter email/phone and password to log in',
      'กรอกข้อมูลเพื่อสมัครสมาชิกใหม่': 'Fill in details to create a new account',
      'อีเมล หรือ เบอร์โทร': 'Email or Phone',
      'อีเมล': 'Email',
      'รหัสผ่าน': 'Password',
      'ตั้งรหัสผ่าน (อย่างน้อย 6 ตัว)': 'Set password (at least 6 chars)',
      'ยืนยันรหัสผ่าน': 'Confirm password',
      'เบอร์โทรศัพท์ (เช่น 0812345678)': 'Phone (e.g. 0812345678)',
      'ส่ง OTP': 'Send OTP',
      'ส่งอีกครั้ง': 'Resend',
      'รหัสส่งไปที่ SMS แล้ว': 'Code sent via SMS',
      'รหัสส่งไปที่ SMS แล้ว (หมดอายุใน 5 นาที)': 'Code sent via SMS (expires in 5 min)',
      '📷 ถ่ายรูป / เลือกรูปบัตรประชาชน': '📷 Take / Choose ID card photo',
      '✅ ตรวจสอบบัตรผ่านแล้ว — กดเพื่อเปลี่ยนรูป': '✅ ID verified — tap to change photo',
      '🤝 ลงทะเบียน': '🤝 Register',
      '🔑 เข้าสู่ระบบ': '🔑 Log In',
      'ยังไม่มีบัญชี?': "Don't have an account?",
      'มีบัญชีอยู่แล้ว?': 'Already have an account?',
      'เข้าชมเว็บก่อน': 'Browse first',
      'ข้อมูลถูกเก็บอย่างปลอดภัย': 'Data stored securely',
      'นโยบายความเป็นส่วนตัว': 'Privacy Policy',

      /* --- ID verify screen --- */
      '🔍 กำลังตรวจสอบบัตรประชาชน': '🔍 Verifying ID card',
      'กรุณารอสักครู่…': 'Please wait…',
      'กำลังตรวจสอบบัตร…': 'Verifying card…',
      'ตรวจสอบเสร็จ — กดปุ่มเพื่อไปกรอกข้อมูลต่อ': 'Done — tap the button to continue',
      'ตรวจสอบสำเร็จ': 'Verified',
      'ตรวจสอบไม่ผ่าน': 'Verification failed',
      '✅ กลับไปกรอกข้อมูลสมัคร': '✅ Continue registration',
      '🔁 ถ่ายใหม่': '🔁 Retake',

      /* --- common actions --- */
      'บันทึก': 'Save',
      'ยกเลิก': 'Cancel',
      'ยืนยัน': 'Confirm',
      'ลบ': 'Delete',
      'แก้ไข': 'Edit',
      'ปิด': 'Close',
      'ค้นหา': 'Search',
      'ทั้งหมด': 'All',
    },

    zh: {
      /* --- header / nav / sidebar --- */
      'หน้าหลัก': '首页',
      'หน้าแรก': '首页',
      'วิธีสั่งซื้อ': '订购方式',
      'คำนวณค่าส่ง': '运费计算',
      'สั่งซื้อ': '下单',
      'ตรวจสอบสถานะออเดอร์': '订单状态',
      'ตรวจสอบสถานะ': '订单状态',
      'ตรวจสอบสถานะสินค้า': '货物追踪',
      'ติดตามสถานะสินค้า': '货物追踪',
      'รายการสั่งซื้อสินค้าจีน': '中国商品订单',
      'รายการบิลค่าขนส่ง': '运费账单',
      'ที่อยู่ของฉัน': '我的地址',
      'รีวิว': '评价',
      'ติดต่อ': '联系',
      'ติดต่อเรา': '联系我们',
      'การเงิน (เติมเงิน)': '钱包 (充值)',
      'เพิ่มเพื่อน LINE': '添加 LINE 好友',
      'เข้าสู่ระบบ': '登录',
      'สมัครสมาชิก': '注册',
      'ออก': '退出',
      'ยังไม่เข้าสู่ระบบ': '未登录',
      'ภาษา': '语言',

      /* --- hero / homepage --- */
      'นำเข้าสินค้าจากจีน': '从中国进口商品',
      'ส่งถึงมือคุณ': '送货上门',
      'แค่วางลิงก์สินค้าที่อยากได้ ทีมงาน Oversea PenGate จะเช็คราคารวมค่าส่งให้':
        '只需粘贴商品链接,Oversea PenGate 团队将为您报含运费总价。',
      'ฝากสั่งสินค้า + จ่ายเงิน': '代购 + 代付',
      'วางลิงก์ + รูป + อธิบาย': '粘贴链接 + 图片 + 说明',
      'ฝากจ่ายเงิน': '代付',
      'เราจ่ายหยวน · จ่ายบาทตามเรท': '我们付人民币 · 您按汇率付泰铢',
      'บริการชิปปิ้ง': '集运服务',
      'จีน → ไทย → ส่งถึงบ้าน': '中国 → 泰国 → 送货上门',

      /* --- steps --- */
      'ขั้นตอนง่าย ๆ': '简单步骤',
      'วิธีสั่งซื้อ & นำเข้าสินค้า': '订购与进口流程',
      'เลือกบริการที่เหมาะกับคุณ — สั่งซื้อจากเว็บจีน หรือให้เราสั่งให้ก็ได้':
        '选择适合的服务 — 自行下单或委托我们代购',

      /* --- LINE banner --- */
      'แจ้งราคาทาง LINE': 'LINE 报价',
      'ภายใน 24 ชม.': '24 小时内',
      'วางลิงก์สินค้า': '粘贴商品链接',
      'ส่งถึงบ้าน': '送货上门',
      'รวดเร็ว ปลอดภัย': '快速安全',
      'กำลังดำเนินการ': '进行中',

      /* --- login/register modal --- */
      'กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ': '请输入邮箱/手机号和密码登录',
      'กรอกข้อมูลเพื่อสมัครสมาชิกใหม่': '请填写信息注册新账号',
      'อีเมล หรือ เบอร์โทร': '邮箱或手机号',
      'อีเมล': '邮箱',
      'รหัสผ่าน': '密码',
      'ตั้งรหัสผ่าน (อย่างน้อย 6 ตัว)': '设置密码 (至少6位)',
      'ยืนยันรหัสผ่าน': '确认密码',
      'เบอร์โทรศัพท์ (เช่น 0812345678)': '手机号 (如 0812345678)',
      'ส่ง OTP': '发送验证码',
      'ส่งอีกครั้ง': '重新发送',
      'รหัสส่งไปที่ SMS แล้ว': '验证码已发送',
      'รหัสส่งไปที่ SMS แล้ว (หมดอายุใน 5 นาที)': '验证码已发送 (5分钟内有效)',
      '📷 ถ่ายรูป / เลือกรูปบัตรประชาชน': '📷 拍摄 / 选择身份证照片',
      '✅ ตรวจสอบบัตรผ่านแล้ว — กดเพื่อเปลี่ยนรูป': '✅ 已验证 — 点击更换照片',
      '🤝 ลงทะเบียน': '🤝 注册',
      '🔑 เข้าสู่ระบบ': '🔑 登录',
      'ยังไม่มีบัญชี?': '还没有账号?',
      'มีบัญชีอยู่แล้ว?': '已有账号?',
      'เข้าชมเว็บก่อน': '先浏览',
      'ข้อมูลถูกเก็บอย่างปลอดภัย': '数据安全存储',
      'นโยบายความเป็นส่วนตัว': '隐私政策',

      /* --- ID verify screen --- */
      '🔍 กำลังตรวจสอบบัตรประชาชน': '🔍 正在验证身份证',
      'กรุณารอสักครู่…': '请稍候…',
      'กำลังตรวจสอบบัตร…': '正在验证…',
      'ตรวจสอบเสร็จ — กดปุ่มเพื่อไปกรอกข้อมูลต่อ': '完成 — 点击按钮继续',
      'ตรวจสอบสำเร็จ': '验证成功',
      'ตรวจสอบไม่ผ่าน': '验证失败',
      '✅ กลับไปกรอกข้อมูลสมัคร': '✅ 继续注册',
      '🔁 ถ่ายใหม่': '🔁 重新拍摄',

      /* --- common actions --- */
      'บันทึก': '保存',
      'ยกเลิก': '取消',
      'ยืนยัน': '确认',
      'ลบ': '删除',
      'แก้ไข': '编辑',
      'ปิด': '关闭',
      'ค้นหา': '搜索',
      'ทั้งหมด': '全部',
    },
  };

  var ATTR_LIST = ['placeholder', 'title', 'alt', 'aria-label'];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };

  function translateSubtree(root, dict) {
    if (!root || !dict) return;
    /* text nodes */
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.parentElement) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS[n.parentElement.tagName]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var raw = n.nodeValue;
      var trimmed = raw.trim();
      if (trimmed && dict[trimmed]) {
        n.nodeValue = raw.replace(trimmed, dict[trimmed]);
      }
    }
    /* attributes */
    if (root.nodeType === 1) {
      ATTR_LIST.forEach(function (a) {
        if (root.hasAttribute && root.hasAttribute(a)) {
          var v = root.getAttribute(a);
          var t = v && v.trim();
          if (t && dict[t]) root.setAttribute(a, dict[t]);
        }
      });
    }
    if (root.querySelectorAll) {
      ATTR_LIST.forEach(function (a) {
        root.querySelectorAll('[' + a + ']').forEach(function (el) {
          var v = el.getAttribute(a);
          var t = v && v.trim();
          if (t && dict[t]) el.setAttribute(a, dict[t]);
        });
      });
    }
  }

  function translateAll() {
    if (currentLang === 'th') return;
    var dict = TRANSLATIONS[currentLang];
    if (!dict) return;
    translateSubtree(document.body, dict);
  }

  function setLang(lang) {
    if (!lang || lang === currentLang) return;
    localStorage.setItem(LANG_KEY, lang);
    location.reload();
  }

  /* Inject a compact language switcher wherever an element with
     id="opgLangSlot" exists (e.g. inside the sidebar). */
  function mountSwitcher() {
    var slot = document.getElementById('opgLangSlot');
    if (!slot || slot.dataset.mounted) return;
    slot.dataset.mounted = '1';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:6px;padding:10px 20px;border-top:1px solid rgba(255,255,255,.08);margin-top:auto';
    ['th', 'en', 'zh'].forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = code === 'th' ? '🇹🇭 ไทย' : code === 'en' ? '🇬🇧 EN' : '🇨🇳 中文';
      b.style.cssText = 'flex:1;padding:6px 4px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:' +
        (code === currentLang ? '#9C8654' : 'transparent') + ';color:#fff;font-size:12px;cursor:pointer';
      b.addEventListener('click', function () { setLang(code); });
      wrap.appendChild(b);
    });
    slot.appendChild(wrap);
  }

  window.OPGi18n = { setLang: setLang, current: function () { return currentLang; } };

  function init() {
    translateAll();
    mountSwitcher();
    /* Catch JS-rendered content (order lists, admin tables, modals) */
    if (currentLang !== 'th' && window.MutationObserver) {
      var dict = TRANSLATIONS[currentLang];
      var obs = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (nd) {
            if (nd.nodeType === 1) translateSubtree(nd, dict);
            else if (nd.nodeType === 3 && nd.parentElement && !SKIP_TAGS[nd.parentElement.tagName]) {
              var t = nd.nodeValue.trim();
              if (t && dict[t]) nd.nodeValue = nd.nodeValue.replace(t, dict[t]);
            }
          });
        });
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
