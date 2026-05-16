<?php /* Transfers Module */ ?>
<div class="page-header">
  <div class="page-title">💸 الحوالات المالية</div>
  <div class="page-actions">
    <button class="btn btn-outline no-print" onclick="exportCSV('tr-table','transfers')">📊 CSV</button>
    <button class="btn btn-gold" onclick="openAddTransfer()">➕ حوالة جديدة</button>
  </div>
</div>

<div class="kpi-grid" id="tr-kpis"></div>

<div class="filter-bar">
  <select id="tr-status" class="form-control" style="width:160px" onchange="loadTransfers()">
    <option value="">جميع الحالات</option>
    <option value="pending">معلقة</option>
    <option value="sent">مُرسلة</option>
    <option value="cancelled">ملغية</option>
  </select>
  <input type="text" id="tr-search" class="form-control" style="width:220px" placeholder="🔍 بحث بالاسم..." oninput="filterTrTable()">
</div>

<div class="card">
  <div class="table-wrap"><table id="tr-table">
    <thead><tr><th>#</th><th>العامل</th><th>المبلغ</th><th>الرسوم</th><th>الطريقة</th><th>المرجع</th><th>التاريخ</th><th>الحالة</th><th>الإجراء</th></tr></thead>
    <tbody id="tr-tbody"></tbody>
  </table></div>
</div>

<!-- Modal -->
<div class="modal-overlay" id="m-add-tr">
  <div class="modal">
    <div class="modal-header"><span>💸 حوالة جديدة</span><button class="modal-close" onclick="closeModal('m-add-tr')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="tr-edit-id">
      <div class="form-grid">
        <div class="form-group"><label>العامل</label><select id="tr-worker-sel" class="form-control" onchange="onWorkerSelect()"><option value="">— اختر عامل —</option></select></div>
        <div class="form-group"><label>أو اكتب الاسم</label><input id="tr-worker-name" class="form-control" placeholder="اسم العامل"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>المبلغ (ر.س) *</label><input id="tr-amount" class="form-control" type="number" step="0.01" placeholder="1200.00"></div>
        <div class="form-group"><label>الرسوم</label><input id="tr-fee" class="form-control" type="number" step="0.01" value="0"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>طريقة التحويل</label>
          <select id="tr-method" class="form-control"><option>بنك</option><option>حوالة</option><option>STC Pay</option><option>نقداً</option></select>
        </div>
        <div class="form-group"><label>رقم المرجع</label><input id="tr-ref" class="form-control"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>التاريخ</label><input id="tr-date" class="form-control" type="date"></div>
        <div class="form-group"><label>الحالة</label>
          <select id="tr-status-sel" class="form-control"><option value="pending">معلقة</option><option value="sent">مُرسلة</option><option value="cancelled">ملغية</option></select>
        </div>
      </div>
      <div class="form-group"><label>ملاحظات</label><textarea id="tr-note" class="form-control" rows="2"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('m-add-tr')">إلغاء</button>
      <button class="btn btn-gold" onclick="saveTransfer()">💾 حفظ</button>
    </div>
  </div>
</div>

<script>
const API = '<?= APP_URL ?>/api/?module=';
let allTr = [], allWorkers = [];
const ST = {pending:'<span class="badge badge-gold">⏳ معلقة</span>',sent:'<span class="badge badge-green">✅ مُرسلة</span>',cancelled:'<span class="badge badge-red">❌ ملغية</span>'};

async function loadTransfers() {
  const status = document.getElementById('tr-status').value;
  const r = await apiGet(API + 'transfers&action=list&status=' + status);
  allTr = r.data||[];
  const t = r.totals||{};
  document.getElementById('tr-kpis').innerHTML = `
    <div class="kpi-card kpi-blue"><div class="kpi-icon">📋</div><div class="kpi-value">${allTr.length}</div><div class="kpi-label">عدد الحوالات</div></div>
    <div class="kpi-card kpi-gold"><div class="kpi-icon">💰</div><div class="kpi-value">${parseFloat(t.total||0).toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي المبالغ</div></div>
    <div class="kpi-card kpi-teal"><div class="kpi-icon">🏦</div><div class="kpi-value">${parseFloat(t.fees||0).toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي الرسوم</div></div>`;
  renderTrTable(allTr);
}

function renderTrTable(data) {
  document.getElementById('tr-tbody').innerHTML = (data||[]).map(t=>`
    <tr><td>${t.id}</td><td><strong>${t.worker_name||'—'}</strong></td>
    <td style="color:var(--green);font-weight:700">${parseFloat(t.amount).toLocaleString('ar')} ر.س</td>
    <td>${parseFloat(t.fee||0).toLocaleString('ar')} ر.س</td>
    <td>${t.method||'—'}</td><td style="font-size:11px">${t.reference_no||'—'}</td>
    <td>${t.transfer_date||'—'}</td><td>${ST[t.status]||''}</td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="editTr(${t.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteTr(${t.id})">🗑️</button></td></tr>`)
    .join('') || '<tr><td colspan="9" style="text-align:center;color:var(--muted)">لا توجد حوالات</td></tr>';
}

function filterTrTable() {
  const q = document.getElementById('tr-search').value.toLowerCase();
  renderTrTable(allTr.filter(t=>(t.worker_name||'').toLowerCase().includes(q)));
}

async function openAddTransfer() {
  const r = await apiGet(API + 'workers&action=list&per_page=200');
  allWorkers = r.data||[];
  const sel = document.getElementById('tr-worker-sel');
  sel.innerHTML = '<option value="">— اختر عامل —</option>' + allWorkers.map(w=>`<option value="${w.id}" data-name="${w.name}">${w.name}</option>`).join('');
  document.getElementById('tr-edit-id').value = '';
  document.getElementById('tr-date').value = new Date().toISOString().slice(0,10);
  openModal('m-add-tr');
}

function onWorkerSelect() {
  const sel = document.getElementById('tr-worker-sel');
  const opt = sel.options[sel.selectedIndex];
  if (opt.dataset.name) document.getElementById('tr-worker-name').value = opt.dataset.name;
}

async function saveTransfer() {
  const id = document.getElementById('tr-edit-id').value;
  const sel = document.getElementById('tr-worker-sel');
  const d = { id:id||null, worker_id:sel.value||null, worker_name:document.getElementById('tr-worker-name').value||sel.options[sel.selectedIndex]?.text||'', amount:document.getElementById('tr-amount').value, fee:document.getElementById('tr-fee').value||0, method:document.getElementById('tr-method').value, reference_no:document.getElementById('tr-ref').value, transfer_date:document.getElementById('tr-date').value, status:document.getElementById('tr-status-sel').value, note:document.getElementById('tr-note').value };
  if (!d.amount) { showToast('المبلغ مطلوب','error'); return; }
  const r = await apiPost(API+'transfers&action=save', d);
  if (r.ok) { closeModal('m-add-tr'); showToast(r.msg||'تم الحفظ','success'); loadTransfers(); }
}

function editTr(id) {
  const t = allTr.find(x=>x.id==id); if(!t) return;
  document.getElementById('tr-edit-id').value=t.id;
  document.getElementById('tr-worker-name').value=t.worker_name||'';
  document.getElementById('tr-amount').value=t.amount;
  document.getElementById('tr-fee').value=t.fee||0;
  document.getElementById('tr-method').value=t.method||'بنك';
  document.getElementById('tr-ref').value=t.reference_no||'';
  document.getElementById('tr-date').value=t.transfer_date||'';
  document.getElementById('tr-status-sel').value=t.status||'pending';
  document.getElementById('tr-note').value=t.note||'';
  openModal('m-add-tr');
}

async function deleteTr(id) { if(!confirm('حذف الحوالة؟'))return; await apiPost(API+'transfers&action=delete',{id}); showToast('تم الحذف'); loadTransfers(); }

loadTransfers();
</script>
