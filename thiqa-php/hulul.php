<?php
/**
 * hulul.php — وكيل حلول الذكي
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';
requireLogin();

$geminiKey = GEMINI_API_KEY ?: (dbFirst("SELECT key_value FROM settings WHERE key_name='gemini_api_key'")['key_value'] ?? '');
$hasKey    = !empty($geminiKey);

ob_start(); ?>
<style>
.hulul-wrap { display:grid; grid-template-columns:1fr 300px; gap:16px; height:calc(100vh - 160px); min-height:550px; }
@media(max-width:900px){ .hulul-wrap{ grid-template-columns:1fr; } .hulul-side{ display:none; } }
</style>

<?php if (!$hasKey): ?>
<div style="background:var(--gold-bg);border:1px solid var(--gold-bd);border-radius:var(--r);padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
  <span style="font-size:26px">🔑</span>
  <div style="flex:1">
    <div style="font-weight:800">فعّل الوكيل الذكي حلول</div>
    <div style="font-size:12px;color:var(--muted)">أضف مفتاح Gemini API في <a href="settings.php" style="color:var(--gold)">الإعدادات</a> أو احصل عليه مجاناً من <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--gold)">Google AI Studio</a></div>
  </div>
  <form method="POST" action="settings.php" style="display:flex;gap:8px;align-items:center">
    <input type="hidden" name="_csrf" value="<?= esc(csrfToken()) ?>">
    <input type="hidden" name="action" value="save_gemini_key">
    <input type="password" name="gemini_key" placeholder="AIzaSy..." class="form-control" style="width:240px">
    <button type="submit" class="btn btn-gold">✅ حفظ</button>
  </form>
</div>
<?php endif; ?>

<div class="hulul-wrap">
  <!-- Chat -->
  <div style="background:var(--navy);border-radius:var(--r-lg);overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow-lg)">

    <!-- Header -->
    <div style="padding:14px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0">
      <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:20px">🤖</div>
      <div>
        <div style="font-weight:900;font-size:16px;color:#fff">حلول</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5)"><?= $hasKey ? '✅ الوكيل مفعّل' : '🔑 يتطلب مفتاح API' ?></div>
      </div>
      <div style="margin-right:auto;display:flex;gap:6px">
        <select id="hulul-model" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:5px 10px;color:rgba(255,255,255,.8);font-family:inherit;font-size:11px">
          <option value="gemini-2.0-flash">Gemini 2.0 Flash ⚡</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
        </select>
        <button onclick="clearHululChat()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:5px 10px;color:rgba(255,255,255,.6);cursor:pointer">🗑️</button>
      </div>
    </div>

    <!-- Messages -->
    <div id="hulul-messages" class="hulul-messages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth">
      <div id="hulul-welcome" style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;padding:40px 20px">
        <div style="font-size:56px;margin-bottom:14px">🤖</div>
        <div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:6px">مرحباً، أنا حلول</div>
        <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:24px;line-height:1.7">موظفك الرقمي الذكي — جاهز لتنفيذ مهامك</div>
        <div id="hulul-quick-btns" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:440px"></div>
      </div>
    </div>

    <!-- Typing -->
    <div id="hulul-typing" style="display:none;padding:8px 20px;border-top:1px solid rgba(255,255,255,.06)">
      <div style="display:flex;gap:4px;align-items:center">
        <span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);animation:hd 1.3s infinite"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);animation:hd 1.3s .2s infinite"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);animation:hd 1.3s .4s infinite"></span>
        <span style="font-size:11px;color:rgba(255,255,255,.4);margin-right:6px">حلول يفكر...</span>
      </div>
    </div>
    <style>@keyframes hd{0%,60%,100%{transform:scale(1);opacity:.4}30%{transform:scale(1.4);opacity:1}}</style>

    <!-- Input -->
    <div style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:10px;align-items:flex-end;flex-shrink:0">
      <label for="hulul-file" style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px" title="رفع ملف">📎</label>
      <input type="file" id="hulul-file" accept=".xlsx,.xls,.docx,.pdf,.jpg,.png" style="display:none" onchange="hululUploadFile(this.files[0]);this.value=''">
      <textarea id="hulul-input" rows="1" placeholder="اكتب طلبك... مثال: ابغى أضيف عامل"
        style="flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:9px 14px;color:#fff;font-family:inherit;font-size:13px;resize:none;line-height:1.5;outline:none;transition:border .2s;max-height:120px"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();hululSend()}"
        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"
        onfocus="this.style.borderColor='rgba(245,158,11,.6)'"
        onblur="this.style.borderColor='rgba(255,255,255,.15)'"></textarea>
      <button onclick="hululSend()" style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;color:#fff;font-size:18px;cursor:pointer">↑</button>
    </div>
  </div>

  <!-- Sidebar -->
  <div class="hulul-side" style="display:flex;flex-direction:column;gap:12px;overflow-y:auto">
    <div class="card" style="margin:0">
      <div class="card-title">⚡ خدمات سريعة</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="hulul-svc-btns"></div>
    </div>
    <div class="card" style="margin:0;flex:1">
      <div class="card-title">📋 آخر الطلبات</div>
      <div id="hulul-requests-list"></div>
    </div>
    <div class="card" style="margin:0">
      <div class="card-title">📊 الإحصائيات</div>
      <div id="hulul-stats-grid"></div>
    </div>
  </div>
</div>

<script>
const API_BASE = '<?= APP_URL ?>/api/?module=';
let hululHistory = [];
let hululBusy    = false;
let pendingData  = null;

// ── Services catalogue ────────────────────────────────────────
const SERVICES = {
  visa:{'label':'تأشيرة عمل','icon':'🛂'},iqama:{'label':'تجديد الإقامة','icon':'📋'},
  transfer:{'label':'نقل الكفالة','icon':'🔄'},contract:{'label':'عقد إيجار','icon':'🏠'},
  exit_reentry:{'label':'خروج وعودة','icon':'✈️'},final_exit:{'label':'خروج نهائي','icon':'🚪'},
  muqeem:{'label':'مقيم','icon':'🖥️'},absher:{'label':'أبشر','icon':'📱'},
  musaned:{'label':'مساند','icon':'🤝'},other:{'label':'أخرى','icon':'📁'},
};

// ── System prompt ─────────────────────────────────────────────
async function buildSystemPrompt() {
  let stats = {};
  try { stats = await apiGet(API_BASE + 'stats'); } catch(e) {}
  return `أنت "حلول" — الموظف الرقمي الذكي لمنصة خدمات حكومية.
بيانات النظام: عمال=${stats.workers||0}, عملاء=${stats.clients||0}, طلبات معلقة=${stats.requests_pending||0}, ديون=${stats.total_debt||0} ر.س.
الخدمات المتاحة: تأشيرة عمل، تجديد إقامة، نقل كفالة، عقد إيجار، خروج وعودة، خروج نهائي، مقيم، أبشر، مساند.
قواعد: تحدث عربية فقط، نفّذ بدل ما تشرح، اسأل سؤالاً واحداً عند نقص البيانات.
عندما تحتاج تنفيذ عملية، أدرج في ردك: <ACTION>{"action":"...","params":{...}}</ACTION>
الأوامر: create_client({name,phone,type}), create_request({service_type,client_name,client_phone,priority}), search_client({query}), track_request({query}), generate_report({type}).`;
}

// ── Render message ────────────────────────────────────────────
function hululMsg(role, text, extra) {
  const c = document.getElementById('hulul-messages');
  document.getElementById('hulul-welcome')?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'hulul-msg ' + role;
  wrap.style.cssText = 'display:flex;gap:9px;align-items:flex-start;max-width:88%;' + (role==='user'?'align-self:flex-end;flex-direction:row-reverse;':'align-self:flex-start;');
  const av = document.createElement('div');
  av.style.cssText = 'width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:' + (role==='agent'?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(255,255,255,.15)');
  av.textContent = role==='agent'?'🤖':'👤';
  const bub = document.createElement('div');
  bub.style.cssText = 'padding:11px 15px;border-radius:12px;font-size:13px;line-height:1.75;white-space:pre-wrap;word-break:break-word;' + (role==='agent'?'background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:4px 12px 12px 12px':'background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;border-radius:12px 4px 12px 12px');
  bub.innerHTML = (text||'').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  if (extra) bub.appendChild(extra);
  wrap.appendChild(av); wrap.appendChild(bub);
  c.appendChild(wrap);
  c.scrollTop = c.scrollHeight;
}

// ── Execute action ────────────────────────────────────────────
async function hululExec(action, params) {
  if (action === 'create_client') {
    const r = await apiPost(API_BASE + 'customers&action=save', { name: params.name, phone: params.phone, type: params.type||'client' });
    return r.ok ? `✅ تم إضافة **${params.name}** بنجاح` : '❌ ' + (r.error||'خطأ');
  }
  if (action === 'create_request') {
    const r = await apiPost(API_BASE + 'service_requests&action=save', { service_type: params.service_type||'other', client_name: params.client_name, client_phone: params.client_phone||'', priority: params.priority||'normal', from_agent: 1 });
    if (r.ok) {
      loadHululRequests();
      return `✅ تم إنشاء الطلب — رقم: **${r.code}**`;
    }
    return '❌ ' + (r.error||'خطأ');
  }
  if (action === 'search_client') {
    const r = await apiGet(API_BASE + 'customers&action=list&search=' + encodeURIComponent(params.query||''));
    const list = (r.data||[]).slice(0,5);
    if (!list.length) return `لم أجد نتائج لـ "${params.query}"`;
    return list.map(c => `• ${c.name} | ${c.phone||'—'} | ${c.type}`).join('\n');
  }
  if (action === 'track_request') {
    const r = await apiGet(API_BASE + 'service_requests&action=list');
    const q = (params.query||'').toLowerCase();
    const found = (r.data||[]).filter(x => x.request_code.toLowerCase().includes(q) || x.client_name.toLowerCase().includes(q)).slice(0,3);
    const S = {pending:'⏳ معلق',in_progress:'🔄 قيد التنفيذ',done:'✅ مكتمل',cancelled:'❌ ملغى'};
    return found.length ? found.map(x=>`📋 **${x.request_code}** | ${x.service_icon} ${x.service_label}\n👤 ${x.client_name} | ${S[x.status]||x.status}`).join('\n\n') : `لم أجد طلب بهذا المعرف.`;
  }
  if (action === 'generate_report') {
    const s = await apiGet(API_BASE + 'stats');
    const t = params.type||'general';
    if (t==='workers') return `📊 **تقرير العمال**\n• النشطون: ${s.workers}\n• الكفلاء: ${s.sponsors}`;
    if (t==='requests') return `📊 **تقرير الطلبات**\n• معلق: ${s.requests_pending}`;
    return `📊 **تقرير عام**\n• مبيعات: ${s.sales} ر.س | مصروفات: ${s.expenses} ر.س | ربح: ${s.profit} ر.س`;
  }
  return 'أمر غير معروف: ' + action;
}

// ── Send message ──────────────────────────────────────────────
async function hululSend(override) {
  if (hululBusy) return;
  const inp = document.getElementById('hulul-input');
  const msg = override || inp?.value.trim();
  if (!msg) return;
  if (!override && inp) { inp.value=''; inp.style.height='auto'; }

  hululMsg('user', msg);
  hululHistory.push({ role:'user', parts:[{text:msg}] });
  hululBusy = true;
  document.getElementById('hulul-typing').style.display = 'block';

  const model    = document.getElementById('hulul-model')?.value || 'gemini-2.0-flash';
  const sysPrompt = await buildSystemPrompt();

  try {
    const r = await apiPost(API_BASE + 'gemini&action=proxy', {
      contents: hululHistory,
      model,
      system_instruction: { parts: [{ text: sysPrompt }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
    });

    const raw = r?.candidates?.[0]?.content?.parts?.[0]?.text || 'لم أفهم. حاول مرة أخرى.';
    let display = raw.replace(/<ACTION>[\s\S]*?<\/ACTION>/g,'').trim();

    // Execute actions
    const actionRx = /<ACTION>\s*([\s\S]*?)\s*<\/ACTION>/g;
    let m; let resultMsgs = [];
    while ((m = actionRx.exec(raw)) !== null) {
      try {
        const parsed = JSON.parse(m[1]);
        const result = await hululExec(parsed.action, parsed.params||{});
        resultMsgs.push(result);
        hululHistory.push({role:'user',parts:[{text:'[نتيجة: ' + result + ']'}]});
      } catch(e) { resultMsgs.push('❌ خطأ: ' + e.message); }
    }

    if (resultMsgs.length) display = (display ? display + '\n\n' : '') + resultMsgs.join('\n\n');
    hululHistory.push({ role:'model', parts:[{text:raw}] });
    if (hululHistory.length > 60) hululHistory = hululHistory.slice(-60);
    hululMsg('agent', display);

  } catch(e) {
    hululMsg('agent', '❌ ' + e.message);
  } finally {
    hululBusy = false;
    document.getElementById('hulul-typing').style.display = 'none';
  }
}

// ── File upload ───────────────────────────────────────────────
async function hululUploadFile(file) {
  if (!file) return;
  hululMsg('user', `📎 ${file.name}`);
  hululSend(`تم رفع ملف "${file.name}" بحجم ${(file.size/1024).toFixed(0)} KB. حللّه وأخبرني بالبيانات التي فيه وماذا أفعل.`);
}

function clearHululChat() {
  hululHistory = [];
  const c = document.getElementById('hulul-messages');
  c.innerHTML = `<div id="hulul-welcome" style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;padding:40px 20px"><div style="font-size:56px;margin-bottom:14px">🤖</div><div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:6px">مرحباً، أنا حلول</div><div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:24px">اسألني أي شيء</div><div id="hulul-quick-btns" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:440px"></div></div>`;
  renderQuickBtns();
  showToast('تم مسح المحادثة');
}

function renderQuickBtns() {
  const wrap = document.getElementById('hulul-quick-btns');
  if (!wrap) return;
  const items = [{l:'➕ إضافة عامل',m:'ابغى أضيف عامل'},{l:'🛂 تأشيرة',m:'ابغى تأشيرة عمل'},{l:'📋 إقامة',m:'ابغى تجديد إقامة'},{l:'🔄 نقل كفالة',m:'ابغى نقل كفالة'},{l:'📊 تقرير',m:'أعطني تقرير عام'},{l:'⏳ الطلبات',m:'كم طلب معلق؟'}];
  wrap.innerHTML = items.map(i=>`<button onclick="hululSend('${i.m}')" style="padding:7px 14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20px;color:rgba(255,255,255,.8);font-size:12px;cursor:pointer;font-family:inherit">${i.l}</button>`).join('');
}

function renderSvcBtns() {
  const w = document.getElementById('hulul-svc-btns');
  if (!w) return;
  w.innerHTML = Object.entries(SERVICES).slice(0,8).map(([k,v])=>`<button onclick="hululSend('ابغى ${v.label}')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer;font-family:inherit;font-size:18px;transition:var(--tr);color:var(--text)" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">${v.icon}<span style="font-size:10px;font-weight:700;color:var(--text2)">${v.label}</span></button>`).join('');
}

async function loadHululRequests() {
  try {
    const r = await apiGet(API_BASE + 'service_requests&action=list&status=pending');
    const w = document.getElementById('hulul-requests-list');
    if (!w) return;
    const S = {pending:'⏳',in_progress:'🔄',done:'✅',cancelled:'❌'};
    w.innerHTML = (r.data||[]).slice(0,5).map(x=>`<div style="padding:8px;margin-bottom:6px;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer" onclick="hululSend('تتبع الطلب ${x.request_code}')"><div style="font-size:11px;font-weight:700;color:var(--muted)">${x.request_code}</div><div style="font-size:12px;font-weight:700">${x.service_icon} ${x.service_label}</div><div style="font-size:11px;color:var(--muted)">${x.client_name} | ${S[x.status]||''}</div></div>`).join('') || '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">لا توجد طلبات</div>';
  } catch(e) {}
}

async function loadHululStats() {
  try {
    const s = await apiGet(API_BASE + 'stats');
    const w = document.getElementById('hulul-stats-grid');
    if (!w) return;
    w.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${[['👷',s.workers,'عمال'],['🏠',s.sponsors,'كفلاء'],['👥',s.clients,'عملاء'],['⏳',s.requests_pending,'معلق']].map(([ic,v,l])=>`<div style="text-align:center;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)"><div style="font-size:16px">${ic}</div><div style="font-size:18px;font-weight:900">${v||0}</div><div style="font-size:10px;color:var(--muted)">${l}</div></div>`).join('')}</div>`;
  } catch(e) {}
}

// Init
renderQuickBtns();
renderSvcBtns();
loadHululRequests();
loadHululStats();
</script>

<?php
$body = ob_get_clean();
renderPage('hulul', 'حلول — الوكيل الذكي', $body);
