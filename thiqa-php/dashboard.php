<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';
requireLogin();

ob_start(); ?>

<div class="kpi-grid" id="kpi-grid">
  <div class="kpi-card kpi-blue"><div class="kpi-icon">👷</div><div class="kpi-value" id="kpi-workers">—</div><div class="kpi-label">العمال النشطون</div></div>
  <div class="kpi-card kpi-gold"><div class="kpi-icon">💰</div><div class="kpi-value" id="kpi-sales">—</div><div class="kpi-label">مبيعات الشهر</div></div>
  <div class="kpi-card kpi-red"><div class="kpi-icon">💳</div><div class="kpi-value" id="kpi-expenses">—</div><div class="kpi-label">مصروفات الشهر</div></div>
  <div class="kpi-card kpi-green"><div class="kpi-icon">📊</div><div class="kpi-value" id="kpi-profit">—</div><div class="kpi-label">صافي الربح</div></div>
  <div class="kpi-card kpi-teal"><div class="kpi-icon">💸</div><div class="kpi-value" id="kpi-transfers">—</div><div class="kpi-label">حوالات الشهر</div></div>
  <div class="kpi-card kpi-purple"><div class="kpi-icon">⏳</div><div class="kpi-value" id="kpi-tasks">—</div><div class="kpi-label">مهام معلقة</div></div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
  <div class="card">
    <div class="card-title">⚡ إجراءات سريعة</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <a href="workers.php" class="btn btn-outline">👷 إضافة عامل</a>
      <a href="transfers.php" class="btn btn-outline">💸 حوالة جديدة</a>
      <a href="sales.php" class="btn btn-outline">🛒 تسجيل بيع</a>
      <a href="tasks.php" class="btn btn-outline">✅ مهمة جديدة</a>
      <a href="hulul.php" class="btn btn-gold">🤖 وكيل حلول</a>
    </div>
  </div>
  <div class="card">
    <div class="card-title">⚠️ تنبيهات النظام</div>
    <div id="alerts-box"><div style="color:var(--muted);font-size:13px">جاري التحميل...</div></div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <div class="card">
    <div class="card-title">✅ آخر المهام العاجلة</div>
    <div id="urgent-tasks"><div style="color:var(--muted);font-size:13px">جاري التحميل...</div></div>
  </div>
  <div class="card">
    <div class="card-title">📋 آخر طلبات الخدمة</div>
    <div id="recent-requests"><div style="color:var(--muted);font-size:13px">جاري التحميل...</div></div>
  </div>
</div>

<script>
const API = '<?= APP_URL ?>/api/?module=';

(async function initDashboard() {
  // Load KPIs
  try {
    const s = await apiGet(API + 'stats');
    document.getElementById('kpi-workers').textContent   = s.workers;
    document.getElementById('kpi-sales').textContent     = formatMoney(s.sales) + ' ر.س';
    document.getElementById('kpi-expenses').textContent  = formatMoney(s.expenses) + ' ر.س';
    const profitEl = document.getElementById('kpi-profit');
    profitEl.textContent   = formatMoney(s.profit) + ' ر.س';
    profitEl.style.color   = s.profit >= 0 ? 'var(--green)' : 'var(--red)';
    document.getElementById('kpi-transfers').textContent = s.transfers.cnt + ' حوالة';
    document.getElementById('kpi-tasks').textContent     = s.tasks_pending;

    // Alerts
    const alerts = [];
    if (s.late_ents > 0) alerts.push(`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;color:var(--red)">🔴 ${s.late_ents} مستحقات متأخرة للوسطاء</div>`);
    if (s.requests_pending > 0) alerts.push(`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;color:var(--gold)">⏳ ${s.requests_pending} طلب خدمة معلق</div>`);
    if (s.total_debt > 0) alerts.push(`<div style="padding:6px 0;font-size:12px;color:var(--red)">⚠️ ديون مستحقة: ${formatMoney(s.total_debt)} ر.س</div>`);
    document.getElementById('alerts-box').innerHTML = alerts.length ? alerts.join('') : '<div style="color:var(--green);font-size:13px">✅ لا توجد تنبيهات</div>';
  } catch(e) {}

  // Urgent tasks
  try {
    const t = await apiGet(API + 'tasks&action=list&status=pending');
    const urgent = (t.data||[]).filter(x => x.priority==='urgent'||x.priority==='high').slice(0,5);
    const PMAP = {urgent:'<span class="badge badge-red">عاجل</span>',high:'<span class="badge badge-gold">مهم</span>'};
    document.getElementById('urgent-tasks').innerHTML = urgent.length
      ? urgent.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">${PMAP[t.priority]||''}<span style="font-size:13px">${t.title}</span><span style="font-size:11px;color:var(--muted);margin-right:auto">${t.due_date||''}</span></div>`).join('')
      : '<div style="color:var(--green);font-size:13px">✅ لا توجد مهام عاجلة</div>';
  } catch(e) {}

  // Recent requests
  try {
    const r = await apiGet(API + 'service_requests&action=list&status=pending');
    const reqs = (r.data||[]).slice(0,5);
    const SMAP = {pending:'⏳',in_progress:'🔄',done:'✅',cancelled:'❌'};
    document.getElementById('recent-requests').innerHTML = reqs.length
      ? reqs.map(r => `<div style="padding:7px 0;border-bottom:1px solid var(--border);font-size:12px"><div style="font-weight:700">${r.service_icon} ${r.service_label} — ${r.client_name}</div><div style="color:var(--muted)">${r.request_code} | ${SMAP[r.status]} | ${r.created_at?.slice(0,10)||''}</div></div>`).join('')
      : '<div style="color:var(--muted);font-size:13px">لا توجد طلبات معلقة</div>';
  } catch(e) {}
})();
</script>

<?php
$body = ob_get_clean();
renderPage('dashboard', 'لوحة التحكم', $body);
