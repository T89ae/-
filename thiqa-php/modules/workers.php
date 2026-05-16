<?php /* Workers & Sponsors Module */ ?>
<div class="page-header">
  <div class="page-title">👷 العمال والكفلاء</div>
  <div class="page-actions">
    <button class="btn btn-outline" onclick="openModal('m-add-sponsor')">➕ كفيل</button>
    <button class="btn btn-gold" onclick="openModal('m-add-worker')">➕ إضافة عامل</button>
    <button class="btn btn-outline no-print" onclick="exportCSV('workers-table','workers')">📊 CSV</button>
  </div>
</div>

<!-- KPIs -->
<div class="kpi-grid" id="w-kpis"></div>

<!-- Sponsors -->
<div class="card">
  <div class="card-title">🏠 الكفلاء</div>
  <div class="table-wrap"><table id="sponsors-table">
    <thead><tr><th>#</th><th>الاسم</th><th>الجوال</th><th>عدد العمال</th><th>الإجراء</th></tr></thead>
    <tbody id="sponsors-tbody"><tr><td colspan="5" style="text-align:center;color:var(--muted)">جاري التحميل...</td></tr></tbody>
  </table></div>
</div>

<!-- Workers -->
<div class="card">
  <div class="card-title">👷 العمال</div>
  <div class="filter-bar">
    <input type="text" id="worker-search" class="form-control" style="width:240px" placeholder="🔍 بحث..." oninput="debounce(loadWorkers,300)()">
    <select id="worker-status" class="form-control" style="width:150px" onchange="loadWorkers()">
      <option value="">جميع الحالات</option>
      <option value="active">نشط</option>
      <option value="inactive">غير نشط</option>
      <option value="transferred">منقول</option>
      <option value="final_exit">خروج نهائي</option>
    </select>
  </div>
  <div class="table-wrap"><table id="workers-table">
    <thead><tr><th>#</th><th>الاسم</th><th>الجنسية</th><th>الكفيل</th><th>رقم الإقامة</th><th>انتهاء الإقامة</th><th>الراتب</th><th>الحالة</th><th>الإجراء</th></tr></thead>
    <tbody id="workers-tbody"><tr><td colspan="9" style="text-align:center;color:var(--muted)">جاري التحميل...</td></tr></tbody>
  </table></div>
  <div id="workers-pagination"></div>
</div>

<!-- Modal Add Worker -->
<div class="modal-overlay" id="m-add-worker">
  <div class="modal">
    <div class="modal-header"><span>👷 إضافة / تعديل عامل</span><button class="modal-close" onclick="closeModal('m-add-worker')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="wk-edit-id">
      <div class="form-grid">
        <div class="form-group"><label>الاسم *</label><input id="wk-name" class="form-control"></div>
        <div class="form-group"><label>الجوال</label><input id="wk-phone" class="form-control" type="tel"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>الجنسية</label><input id="wk-nationality" class="form-control"></div>
        <div class="form-group"><label>الكفيل</label><select id="wk-sponsor" class="form-control"><option value="">— اختر —</option></select></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>رقم الإقامة</label><input id="wk-iqama" class="form-control"></div>
        <div class="form-group"><label>انتهاء الإقامة</label><input id="wk-iqama-exp" class="form-control" type="date"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>رقم الجواز</label><input id="wk-passport" class="form-control"></div>
        <div class="form-group"><label>انتهاء الجواز</label><input id="wk-passport-exp" class="form-control" type="date"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>الراتب (ر.س)</label><input id="wk-salary" class="form-control" type="number" step="0.01" value="0"></div>
        <div class="form-group"><label>العمولة (ر.س)</label><input id="wk-commission" class="form-control" type="number" step="0.01" value="0"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>المسوّق / الوسيط</label><input id="wk-marketer" class="form-control"></div>
        <div class="form-group"><label>الحالة</label>
          <select id="wk-status" class="form-control">
            <option value="active">نشط</option><option value="inactive">غير نشط</option>
            <option value="transferred">منقول</option><option value="final_exit">خروج نهائي</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>ملاحظات</label><textarea id="wk-note" class="form-control" rows="2"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('m-add-worker')">إلغاء</button>
      <button class="btn btn-gold" onclick="saveWorker()">💾 حفظ</button>
    </div>
  </div>
</div>

<!-- Modal Add Sponsor -->
<div class="modal-overlay" id="m-add-sponsor">
  <div class="modal" style="max-width:400px">
    <div class="modal-header"><span>🏠 إضافة كفيل</span><button class="modal-close" onclick="closeModal('m-add-sponsor')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="sp-edit-id">
      <div class="form-group"><label>الاسم *</label><input id="sp-name" class="form-control"></div>
      <div class="form-group"><label>الجوال</label><input id="sp-phone" class="form-control" type="tel"></div>
      <div class="form-group"><label>رقم الهوية</label><input id="sp-nid" class="form-control"></div>
      <div class="form-group"><label>IBAN</label><input id="sp-iban" class="form-control"></div>
      <div class="form-group"><label>ملاحظات</label><textarea id="sp-note" class="form-control" rows="2"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('m-add-sponsor')">إلغاء</button>
      <button class="btn btn-gold" onclick="saveSponsor()">💾 حفظ</button>
    </div>
  </div>
</div>

<script>
const API = '<?= APP_URL ?>/api/?module=';
let allSponsors=[], currentPage=1;

const STATUS_BADGE = {active:'<span class="badge badge-green">نشط</span>',inactive:'<span class="badge badge-muted">غير نشط</span>',transferred:'<span class="badge badge-blue">منقول</span>',final_exit:'<span class="badge badge-red">خروج نهائي</span>'};

async function loadAll() {
  await Promise.all([loadSponsors(), loadWorkers()]);
}

async function loadSponsors() {
  const r = await apiGet(API + 'sponsors&action=list');
  allSponsors = r.data||[];
  // Populate select
  const sel = document.getElementById('wk-sponsor');
  sel.innerHTML = '<option value="">— لا كفيل —</option>' + allSponsors.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  // Render table
  document.getElementById('sponsors-tbody').innerHTML = allSponsors.map(s=>`
    <tr><td>${s.id}</td><td><strong>${s.name}</strong></td><td>${s.phone||'—'}</td>
    <td><span class="badge badge-blue">${s.worker_count||0} عامل</span></td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="editSponsor(${s.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteSponsor(${s.id})">🗑️</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">لا يوجد كفلاء</td></tr>';
}

async function loadWorkers() {
  const search = document.getElementById('worker-search').value;
  const status = document.getElementById('worker-status').value;
  const r = await apiGet(API + `workers&action=list&search=${encodeURIComponent(search)}&status=${status}&page=${currentPage}`);
  const workers = r.data||[];

  // KPIs
  const active = workers.filter(w=>w.status==='active').length;
  document.getElementById('w-kpis').innerHTML = `
    <div class="kpi-card kpi-blue"><div class="kpi-icon">👷</div><div class="kpi-value">${workers.length}</div><div class="kpi-label">إجمالي العمال</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-value">${active}</div><div class="kpi-label">نشطون</div></div>
    <div class="kpi-card kpi-gold"><div class="kpi-icon">🏠</div><div class="kpi-value">${allSponsors.length}</div><div class="kpi-label">الكفلاء</div></div>`;

  const today = new Date().toISOString().slice(0,10);
  const expColor = d => { if(!d) return ''; const diff=(new Date(d)-new Date())/86400000; return diff<0?'color:var(--red)':diff<30?'color:var(--gold)':''; };
  document.getElementById('workers-tbody').innerHTML = workers.map(w=>`
    <tr><td>${w.id}</td><td><strong>${w.name}</strong></td><td>${w.nationality||'—'}</td>
    <td>${w.sponsor_name||'—'}</td><td>${w.iqama_number||'—'}</td>
    <td style="${expColor(w.iqama_expiry)}">${w.iqama_expiry||'—'}</td>
    <td>${parseFloat(w.salary||0).toLocaleString('ar')} ر.س</td>
    <td>${STATUS_BADGE[w.status]||''}</td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="editWorker(${w.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteWorker(${w.id})">🗑️</button></td></tr>`)
    .join('') || '<tr><td colspan="9" style="text-align:center;color:var(--muted)">لا يوجد عمال</td></tr>';
}

async function saveWorker() {
  const id = document.getElementById('wk-edit-id').value;
  const data = { id:id||null, name:document.getElementById('wk-name').value.trim(), phone:document.getElementById('wk-phone').value, nationality:document.getElementById('wk-nationality').value, sponsor_id:document.getElementById('wk-sponsor').value||null, iqama_number:document.getElementById('wk-iqama').value, iqama_expiry:document.getElementById('wk-iqama-exp').value||null, passport_number:document.getElementById('wk-passport').value, passport_expiry:document.getElementById('wk-passport-exp').value||null, salary:document.getElementById('wk-salary').value||0, commission:document.getElementById('wk-commission').value||0, marketer:document.getElementById('wk-marketer').value, status:document.getElementById('wk-status').value, note:document.getElementById('wk-note').value };
  if(!data.name){showToast('الاسم مطلوب','error');return;}
  const r = await apiPost(API+'workers&action=save', data);
  if(r.ok){closeModal('m-add-worker');showToast(r.msg,'success');loadAll();}
}

function editWorker(id) {}
async function deleteWorker(id) { if(!confirm('حذف العامل؟'))return; await apiPost(API+'workers&action=delete',{id}); showToast('تم الحذف'); loadAll(); }

async function saveSponsor() {
  const id = document.getElementById('sp-edit-id').value;
  const data = { id:id||null, name:document.getElementById('sp-name').value.trim(), phone:document.getElementById('sp-phone').value, national_id:document.getElementById('sp-nid').value, iban:document.getElementById('sp-iban').value, note:document.getElementById('sp-note').value };
  if(!data.name){showToast('الاسم مطلوب','error');return;}
  const r = await apiPost(API+'sponsors&action=save',data);
  if(r.ok){closeModal('m-add-sponsor');showToast('تم الحفظ','success');loadAll();}
}

function editSponsor(id) {}
async function deleteSponsor(id) { if(!confirm('حذف الكفيل؟'))return; await apiPost(API+'sponsors&action=delete',{id}); showToast('تم'); loadAll(); }

loadAll();
</script>
