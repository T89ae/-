<?php /* Contacts / Customers Module */ ?>
<div class="page-header">
  <div class="page-title">👥 جهات الاتصال</div>
  <div class="page-actions">
    <button class="btn btn-outline no-print" onclick="exportCSV('contacts-table','contacts')">📊 CSV</button>
    <button class="btn btn-gold" onclick="openModal('m-add-contact')">➕ إضافة جهة</button>
  </div>
</div>
<div class="kpi-grid" id="con-kpis"></div>
<div class="filter-bar">
  <input type="text" id="con-search" class="form-control" style="width:240px" placeholder="🔍 بحث بالاسم أو الجوال..." oninput="filterContacts()">
  <select id="con-type-filter" class="form-control" style="width:160px" onchange="filterContacts()">
    <option value="">كل الأنواع</option>
    <option value="worker">عامل</option><option value="sponsor">كفيل</option>
    <option value="middleman">وسيط</option><option value="client">عميل</option>
  </select>
</div>
<div class="card">
  <div class="table-wrap"><table id="contacts-table">
    <thead><tr><th>#</th><th>الاسم</th><th>الجوال</th><th>النوع</th><th>المدينة</th><th>البريد</th><th>الإجراء</th></tr></thead>
    <tbody id="con-tbody"></tbody>
  </table></div>
</div>

<div class="modal-overlay" id="m-add-contact"><div class="modal" style="max-width:480px">
  <div class="modal-header"><span>👥 إضافة جهة اتصال</span><button class="modal-close" onclick="closeModal('m-add-contact')">✕</button></div>
  <div class="modal-body"><input type="hidden" id="con-edit-id">
    <div class="form-grid"><div class="form-group"><label>الاسم *</label><input id="con-name" class="form-control"></div><div class="form-group"><label>الجوال</label><input id="con-phone" class="form-control" type="tel"></div></div>
    <div class="form-grid"><div class="form-group"><label>النوع</label><select id="con-type" class="form-control"><option value="client">عميل</option><option value="worker">عامل</option><option value="sponsor">كفيل</option><option value="middleman">وسيط</option><option value="other">أخرى</option></select></div><div class="form-group"><label>المدينة</label><input id="con-city" class="form-control"></div></div>
    <div class="form-group"><label>البريد الإلكتروني</label><input id="con-email" class="form-control" type="email"></div>
    <div class="form-group"><label>ملاحظات</label><textarea id="con-note" class="form-control" rows="2"></textarea></div>
  </div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('m-add-contact')">إلغاء</button><button class="btn btn-gold" onclick="saveContact()">💾 حفظ</button></div>
</div></div>

<script>
const API='<?= APP_URL ?>/api/?module=';
let allCon=[];
const TBADGE={worker:'<span class="badge badge-blue">👷 عامل</span>',sponsor:'<span class="badge badge-gold">🏠 كفيل</span>',middleman:'<span class="badge badge-teal">🤝 وسيط</span>',client:'<span class="badge badge-muted">👤 عميل</span>',other:'<span class="badge badge-muted">📁 أخرى</span>'};

async function loadContacts(){
  const r=await apiGet(API+'customers&action=list');
  allCon=r.data||[];
  const byType={};allCon.forEach(c=>{byType[c.type]=(byType[c.type]||0)+1;});
  document.getElementById('con-kpis').innerHTML=`
    <div class="kpi-card kpi-blue"><div class="kpi-icon">👥</div><div class="kpi-value">${allCon.length}</div><div class="kpi-label">إجمالي جهات الاتصال</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-icon">👷</div><div class="kpi-value">${byType.worker||0}</div><div class="kpi-label">عمال</div></div>
    <div class="kpi-card kpi-gold"><div class="kpi-icon">🏠</div><div class="kpi-value">${byType.sponsor||0}</div><div class="kpi-label">كفلاء</div></div>
    <div class="kpi-card kpi-muted"><div class="kpi-icon">👤</div><div class="kpi-value">${byType.client||0}</div><div class="kpi-label">عملاء</div></div>`;
  renderContacts(allCon);
}

function renderContacts(data){
  document.getElementById('con-tbody').innerHTML=(data||[]).map(c=>`
    <tr><td>${c.id}</td><td><strong>${c.name}</strong></td><td>${c.phone||'—'}</td><td>${TBADGE[c.type]||''}</td><td>${c.city||'—'}</td><td>${c.email||'—'}</td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="editContact(${c.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteCon(${c.id})">🗑️</button></td></tr>`)
    .join('')||'<tr><td colspan="7" style="text-align:center;color:var(--muted)">لا توجد جهات اتصال</td></tr>';
}

function filterContacts(){
  const q=document.getElementById('con-search').value.toLowerCase();
  const t=document.getElementById('con-type-filter').value;
  renderContacts(allCon.filter(c=>(c.name+(c.phone||'')).toLowerCase().includes(q)&&(!t||c.type===t)));
}

async function saveContact(){
  const id=document.getElementById('con-edit-id').value;
  const d={id:id||null,name:document.getElementById('con-name').value.trim(),phone:document.getElementById('con-phone').value,type:document.getElementById('con-type').value,city:document.getElementById('con-city').value,email:document.getElementById('con-email').value,note:document.getElementById('con-note').value};
  if(!d.name){showToast('الاسم مطلوب','error');return;}
  const r=await apiPost(API+'customers&action=save',d);
  if(r.ok){closeModal('m-add-contact');showToast('تم','success');loadContacts();}
}

function editContact(id){const c=allCon.find(x=>x.id==id);if(!c)return;document.getElementById('con-edit-id').value=c.id;document.getElementById('con-name').value=c.name;document.getElementById('con-phone').value=c.phone||'';document.getElementById('con-type').value=c.type||'client';document.getElementById('con-city').value=c.city||'';document.getElementById('con-email').value=c.email||'';document.getElementById('con-note').value=c.note||'';openModal('m-add-contact');}
async function deleteCon(id){if(!confirm('حذف؟'))return;await apiPost(API+'customers&action=delete',{id});showToast('تم');loadContacts();}
loadContacts();
</script>
