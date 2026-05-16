<?php /* Expenses Module */ ?>
<div class="page-header">
  <div class="page-title">💳 المصروفات</div>
  <div class="page-actions">
    <button class="btn btn-outline no-print" onclick="exportCSV('exp-table','expenses')">📊 CSV</button>
    <button class="btn btn-gold" onclick="openModal('m-add-exp')">➕ إضافة مصروف</button>
  </div>
</div>
<div class="kpi-grid" id="exp-kpis"></div>
<div class="card">
  <div class="filter-bar" style="margin-bottom:0">
    <input type="text" id="exp-search" class="form-control" style="width:240px" placeholder="🔍 بحث..." oninput="filterExp()">
    <select id="exp-cat-filter" class="form-control" style="width:160px" onchange="filterExp()">
      <option value="">كل التصنيفات</option>
      <?php foreach(['مشتريات','رواتب','فواتير','إيجار','مرافق','نقل','صيانة','أخرى'] as $cat): ?>
      <option><?= esc($cat) ?></option>
      <?php endforeach; ?>
    </select>
  </div>
</div>
<div class="card">
  <div class="table-wrap"><table id="exp-table">
    <thead><tr><th>#</th><th>التصنيف</th><th>الوصف</th><th>المبلغ</th><th>الجهة</th><th>طريقة الدفع</th><th>التاريخ</th><th>الإجراء</th></tr></thead>
    <tbody id="exp-tbody"></tbody>
  </table></div>
</div>

<div class="modal-overlay" id="m-add-exp">
  <div class="modal">
    <div class="modal-header"><span>💳 إضافة مصروف</span><button class="modal-close" onclick="closeModal('m-add-exp')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="exp-edit-id">
      <div class="form-grid">
        <div class="form-group"><label>التصنيف</label>
          <select id="exp-category" class="form-control"><option>مشتريات</option><option>رواتب</option><option>فواتير</option><option>إيجار</option><option>مرافق</option><option>نقل</option><option>صيانة</option><option>أخرى</option></select>
        </div>
        <div class="form-group"><label>طريقة الدفع</label>
          <select id="exp-method" class="form-control"><option value="cash">نقداً</option><option value="bank">بنك</option><option value="transfer">تحويل</option></select>
        </div>
      </div>
      <div class="form-group"><label>الوصف *</label><input id="exp-desc" class="form-control"></div>
      <div class="form-grid">
        <div class="form-group"><label>المبلغ (ر.س) *</label><input id="exp-amount" class="form-control" type="number" step="0.01"></div>
        <div class="form-group"><label>الجهة / المورد</label><input id="exp-vendor" class="form-control"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>التاريخ</label><input id="exp-date" class="form-control" type="date"></div>
        <div class="form-group"><label>ملاحظات</label><input id="exp-note" class="form-control"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('m-add-exp')">إلغاء</button>
      <button class="btn btn-gold" onclick="saveExpense()">💾 حفظ</button>
    </div>
  </div>
</div>

<script>
const API = '<?= APP_URL ?>/api/?module=';
let allExp = [];
const METH = {cash:'نقداً',bank:'بنك',transfer:'تحويل',credit:'آجل'};

async function loadExpenses() {
  const r = await apiGet(API + 'expenses&action=list');
  allExp = r.data||[];
  const t = r.totals||{};
  document.getElementById('exp-kpis').innerHTML = `
    <div class="kpi-card kpi-red"><div class="kpi-icon">💳</div><div class="kpi-value">${parseFloat(t.total||0).toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي المصروفات</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-icon">📋</div><div class="kpi-value">${t.cnt||0}</div><div class="kpi-label">عدد المصروفات</div></div>`;
  renderExp(allExp);
}

function renderExp(data) {
  document.getElementById('exp-tbody').innerHTML = (data||[]).map(e=>`
    <tr><td>${e.id}</td><td>${e.category||'—'}</td><td><strong>${e.description}</strong></td>
    <td style="color:var(--red);font-weight:700">${parseFloat(e.amount).toLocaleString('ar')} ر.س</td>
    <td>${e.vendor||'—'}</td><td>${METH[e.payment_method]||e.payment_method}</td>
    <td>${e.expense_date||'—'}</td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="editExp(${e.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteExp(${e.id})">🗑️</button></td></tr>`)
    .join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted)">لا توجد مصروفات</td></tr>';
}

function filterExp() {
  const q   = document.getElementById('exp-search').value.toLowerCase();
  const cat = document.getElementById('exp-cat-filter').value;
  renderExp(allExp.filter(e => (e.description+(e.vendor||'')).toLowerCase().includes(q) && (!cat||e.category===cat)));
}

async function saveExpense() {
  const id = document.getElementById('exp-edit-id').value;
  const d = { id:id||null, category:document.getElementById('exp-category').value, description:document.getElementById('exp-desc').value.trim(), amount:document.getElementById('exp-amount').value, payment_method:document.getElementById('exp-method').value, vendor:document.getElementById('exp-vendor').value, expense_date:document.getElementById('exp-date').value||new Date().toISOString().slice(0,10), note:document.getElementById('exp-note').value };
  if (!d.description||!d.amount) { showToast('الوصف والمبلغ مطلوبان','error'); return; }
  const r = await apiPost(API+'expenses&action=save', d);
  if (r.ok) { closeModal('m-add-exp'); showToast(r.msg||'تم','success'); loadExpenses(); }
}

function editExp(id) {
  const e = allExp.find(x=>x.id==id); if(!e) return;
  document.getElementById('exp-edit-id').value=e.id;
  document.getElementById('exp-category').value=e.category||'أخرى';
  document.getElementById('exp-desc').value=e.description;
  document.getElementById('exp-amount').value=e.amount;
  document.getElementById('exp-method').value=e.payment_method||'cash';
  document.getElementById('exp-vendor').value=e.vendor||'';
  document.getElementById('exp-date').value=e.expense_date||'';
  document.getElementById('exp-note').value=e.note||'';
  openModal('m-add-exp');
}

async function deleteExp(id) { if(!confirm('حذف؟'))return; await apiPost(API+'expenses&action=delete',{id}); showToast('تم'); loadExpenses(); }

document.getElementById('exp-date').value = new Date().toISOString().slice(0,10);
loadExpenses();
</script>
