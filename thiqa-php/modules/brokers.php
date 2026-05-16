<?php /* Brokers & Entitlements Module */ ?>
<div class="page-header">
  <div class="page-title">🤝 الوسطاء ومستحقاتهم</div>
  <div class="page-actions">
    <button class="btn btn-outline" onclick="openModal('m-add-ent')">➕ مستحق</button>
    <button class="btn btn-gold" onclick="openModal('m-add-broker')">➕ وسيط جديد</button>
    <button class="btn btn-outline no-print" onclick="exportCSV('ent-table','entitlements')">📊 CSV</button>
  </div>
</div>
<div class="kpi-grid" id="bk-kpis"></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <div class="card">
    <div class="card-title">🤝 الوسطاء</div>
    <div class="table-wrap"><table><thead><tr><th>الاسم</th><th>الجوال</th><th>التخصص</th><th>الديون</th><th>الإجراء</th></tr></thead><tbody id="bk-tbody"></tbody></table></div>
  </div>
  <div class="card">
    <div class="card-title">📋 المستحقات</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <select id="ent-filter-broker" class="form-control" style="flex:1;min-width:120px" onchange="loadEntitlements()"><option value="">كل الوسطاء</option></select>
      <select id="ent-filter-status" class="form-control" style="width:140px" onchange="loadEntitlements()"><option value="">كل الحالات</option><option value="unpaid">غير مدفوع</option><option value="paid">مدفوع</option><option value="late">متأخر</option></select>
    </div>
    <div class="table-wrap"><table id="ent-table"><thead><tr><th>الوسيط</th><th>النوع</th><th>المبلغ</th><th>الاستحقاق</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody id="ent-tbody"></tbody></table></div>
  </div>
</div>

<!-- Modal Broker -->
<div class="modal-overlay" id="m-add-broker"><div class="modal" style="max-width:420px">
  <div class="modal-header"><span>🤝 وسيط جديد</span><button class="modal-close" onclick="closeModal('m-add-broker')">✕</button></div>
  <div class="modal-body"><input type="hidden" id="bk-edit-id">
    <div class="form-grid"><div class="form-group"><label>الاسم *</label><input id="bk-name" class="form-control"></div><div class="form-group"><label>الجوال</label><input id="bk-phone" class="form-control" type="tel"></div></div>
    <div class="form-grid"><div class="form-group"><label>رقم الهوية</label><input id="bk-nid" class="form-control"></div><div class="form-group"><label>التخصص</label><input id="bk-spec" class="form-control"></div></div>
    <div class="form-group"><label>الإيميل</label><input id="bk-email" class="form-control" type="email"></div>
    <div class="form-group"><label>ملاحظات</label><textarea id="bk-note" class="form-control" rows="2"></textarea></div>
  </div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('m-add-broker')">إلغاء</button><button class="btn btn-gold" onclick="saveBroker()">💾 حفظ</button></div>
</div></div>

<!-- Modal Entitlement -->
<div class="modal-overlay" id="m-add-ent"><div class="modal" style="max-width:420px">
  <div class="modal-header"><span>📋 مستحق جديد</span><button class="modal-close" onclick="closeModal('m-add-ent')">✕</button></div>
  <div class="modal-body"><input type="hidden" id="ent-edit-id">
    <div class="form-grid"><div class="form-group"><label>الوسيط *</label><select id="ent-broker" class="form-control"></select></div><div class="form-group"><label>النوع</label><select id="ent-type" class="form-control"><option>عمولة</option><option>أتعاب</option><option>مكافأة</option><option>دفعة دورية</option><option>تسوية</option><option>أخرى</option></select></div></div>
    <div class="form-grid"><div class="form-group"><label>المبلغ *</label><input id="ent-amount" class="form-control" type="number" step="0.01"></div><div class="form-group"><label>تاريخ الاستحقاق</label><input id="ent-due" class="form-control" type="date"></div></div>
    <div class="form-group"><label>الحالة</label><select id="ent-status" class="form-control"><option value="unpaid">غير مدفوع</option><option value="paid">مدفوع</option></select></div>
    <div class="form-group"><label>ملاحظات</label><textarea id="ent-note" class="form-control" rows="2"></textarea></div>
  </div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('m-add-ent')">إلغاء</button><button class="btn btn-gold" onclick="saveEntitlement()">💾 حفظ</button></div>
</div></div>

<script>
const API='<?= APP_URL ?>/api/?module=';
let allBrokers=[],allEnts=[];
const EST={unpaid:'<span class="badge badge-gold">⏳ غير مدفوع</span>',paid:'<span class="badge badge-green">✅ مدفوع</span>',late:'<span class="badge badge-red">🔴 متأخر</span>'};

async function loadAll() {
  const [b,e]=await Promise.all([apiGet(API+'brokers&action=list'),apiGet(API+'entitlements&action=list')]);
  allBrokers=b.data||[]; allEnts=e.data||[];
  const bsel=document.getElementById('ent-broker'); bsel.innerHTML='<option value="">— اختر —</option>'+allBrokers.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
  const fsel=document.getElementById('ent-filter-broker'); fsel.innerHTML='<option value="">كل الوسطاء</option>'+allBrokers.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
  renderBrokers(); renderEntitlements(); renderKpis();
}

function renderKpis() {
  const tot=allEnts.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const paid=allEnts.filter(e=>e.status==='paid').reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const late=allEnts.filter(e=>e.status==='late').reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  document.getElementById('bk-kpis').innerHTML=`
    <div class="kpi-card kpi-blue"><div class="kpi-icon">🤝</div><div class="kpi-value">${allBrokers.length}</div><div class="kpi-label">الوسطاء</div></div>
    <div class="kpi-card kpi-gold"><div class="kpi-icon">💰</div><div class="kpi-value">${tot.toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي المستحقات</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-value">${paid.toLocaleString('ar')} ر.س</div><div class="kpi-label">المدفوع</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-icon">⚠️</div><div class="kpi-value">${late.toLocaleString('ar')} ر.س</div><div class="kpi-label">المتأخر</div></div>`;
}

function renderBrokers(){
  document.getElementById('bk-tbody').innerHTML=allBrokers.map(b=>{
    const bEnts=allEnts.filter(e=>e.broker_id==b.id);
    const debt=bEnts.filter(e=>e.status!=='paid').reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
    return `<tr><td><strong>${b.name}</strong></td><td>${b.phone||'—'}</td><td>${b.specialty||'—'}</td>
    <td>${debt>0?`<span class="badge badge-red">${debt.toLocaleString('ar')} ر.س</span>`:'<span class="badge badge-green">مسوّى</span>'}</td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="addEntFor(${b.id})">➕</button><button class="btn btn-sm btn-outline" onclick="editBroker(${b.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteBroker(${b.id})">🗑️</button></td></tr>`;
  }).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--muted)">لا يوجد وسطاء</td></tr>';
}

async function loadEntitlements(){
  const bId=document.getElementById('ent-filter-broker').value;
  const st=document.getElementById('ent-filter-status').value;
  const r=await apiGet(API+'entitlements&action=list'+(bId?'&broker_id='+bId:''));
  allEnts=r.data||[];
  renderEntitlements(st);
}

function renderEntitlements(statusFilter){
  let list=allEnts; if(statusFilter) list=list.filter(e=>e.status===statusFilter);
  document.getElementById('ent-tbody').innerHTML=list.map(e=>`
    <tr><td>${e.broker_name||'—'}</td><td>${e.type||'—'}</td>
    <td><strong>${parseFloat(e.amount).toLocaleString('ar')} ر.س</strong></td>
    <td>${e.due_date||'—'}</td><td>${EST[e.status]||''}</td>
    <td class="td-actions">${e.status!=='paid'?`<button class="btn btn-sm btn-green" onclick="payEnt(${e.id})">✅ دفع</button>`:''}<button class="btn btn-sm btn-red" onclick="deleteEnt(${e.id})">🗑️</button></td></tr>`)
    .join('')||'<tr><td colspan="6" style="text-align:center;color:var(--muted)">لا توجد مستحقات</td></tr>';
}

async function saveBroker(){
  const id=document.getElementById('bk-edit-id').value;
  const d={id:id||null,name:document.getElementById('bk-name').value.trim(),phone:document.getElementById('bk-phone').value,national_id:document.getElementById('bk-nid').value,specialty:document.getElementById('bk-spec').value,email:document.getElementById('bk-email').value,note:document.getElementById('bk-note').value};
  if(!d.name){showToast('الاسم مطلوب','error');return;}
  const r=await apiPost(API+'brokers&action=save',d);
  if(r.ok){closeModal('m-add-broker');showToast('تم','success');loadAll();}
}

async function saveEntitlement(){
  const id=document.getElementById('ent-edit-id').value;
  const d={id:id||null,broker_id:document.getElementById('ent-broker').value,type:document.getElementById('ent-type').value,amount:document.getElementById('ent-amount').value,due_date:document.getElementById('ent-due').value||null,status:document.getElementById('ent-status').value,note:document.getElementById('ent-note').value};
  if(!d.broker_id||!d.amount){showToast('الوسيط والمبلغ مطلوبان','error');return;}
  const r=await apiPost(API+'entitlements&action=save',d);
  if(r.ok){closeModal('m-add-ent');showToast('تم','success');loadAll();}
}

async function payEnt(id){if(!confirm('تأكيد الدفع؟'))return;await apiPost(API+'entitlements&action=pay',{id});showToast('✅ تم تسجيل الدفع','success');loadAll();}
async function deleteBroker(id){if(!confirm('حذف الوسيط؟'))return;await apiPost(API+'brokers&action=delete',{id});showToast('تم');loadAll();}
async function deleteEnt(id){if(!confirm('حذف؟'))return;await apiPost(API+'entitlements&action=delete',{id});showToast('تم');loadAll();}
function editBroker(id){const b=allBrokers.find(x=>x.id==id);if(!b)return;document.getElementById('bk-edit-id').value=b.id;document.getElementById('bk-name').value=b.name;document.getElementById('bk-phone').value=b.phone||'';document.getElementById('bk-nid').value=b.national_id||'';document.getElementById('bk-spec').value=b.specialty||'';document.getElementById('bk-email').value=b.email||'';document.getElementById('bk-note').value=b.note||'';openModal('m-add-broker');}
function addEntFor(bId){document.getElementById('ent-broker').value=bId;openModal('m-add-ent');}

loadAll();
</script>
