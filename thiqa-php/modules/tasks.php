<?php /* Tasks Module */ ?>
<div class="page-header">
  <div class="page-title">✅ المهام</div>
  <div class="page-actions">
    <button class="btn btn-gold" onclick="openModal('m-add-task')">➕ مهمة جديدة</button>
  </div>
</div>

<div class="kpi-grid" id="task-kpis"></div>

<div class="tab-group">
  <button class="tab-btn active" id="tab-pending" onclick="switchTaskTab('pending')">⏳ معلقة</button>
  <button class="tab-btn" id="tab-in_progress" onclick="switchTaskTab('in_progress')">🔄 قيد التنفيذ</button>
  <button class="tab-btn" id="tab-done" onclick="switchTaskTab('done')">✅ مكتملة</button>
  <button class="tab-btn" id="tab-all" onclick="switchTaskTab('all')">الكل</button>
</div>

<div id="tasks-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px"></div>

<div class="modal-overlay" id="m-add-task">
  <div class="modal" style="max-width:500px">
    <div class="modal-header"><span>✅ مهمة جديدة</span><button class="modal-close" onclick="closeModal('m-add-task')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="task-edit-id">
      <div class="form-group"><label>العنوان *</label><input id="task-title" class="form-control"></div>
      <div class="form-group"><label>الوصف</label><textarea id="task-desc" class="form-control" rows="2"></textarea></div>
      <div class="form-grid">
        <div class="form-group"><label>مُسند إلى</label><input id="task-assigned" class="form-control"></div>
        <div class="form-group"><label>الأولوية</label>
          <select id="task-priority" class="form-control"><option value="low">منخفضة</option><option value="medium" selected>متوسطة</option><option value="high">عالية</option><option value="urgent">عاجل 🔴</option></select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>الاستحقاق</label><input id="task-due" class="form-control" type="date"></div>
        <div class="form-group"><label>الحالة</label>
          <select id="task-status" class="form-control"><option value="pending">معلقة</option><option value="in_progress">قيد التنفيذ</option><option value="done">مكتملة</option></select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('m-add-task')">إلغاء</button>
      <button class="btn btn-gold" onclick="saveTask()">💾 حفظ</button>
    </div>
  </div>
</div>

<script>
const API = '<?= APP_URL ?>/api/?module=';
let allTasks=[], currentTab='pending';
const PBADGE={low:'<span class="badge badge-muted">منخفضة</span>',medium:'<span class="badge badge-blue">متوسطة</span>',high:'<span class="badge badge-gold">عالية</span>',urgent:'<span class="badge badge-red">🔴 عاجل</span>'};
const SBADGE={pending:'⏳',in_progress:'🔄',done:'✅'};

async function loadTasks() {
  const r = await apiGet(API + 'tasks&action=list');
  allTasks = r.data||[];
  const pend = allTasks.filter(t=>t.status==='pending').length;
  const prog = allTasks.filter(t=>t.status==='in_progress').length;
  const done = allTasks.filter(t=>t.status==='done').length;
  document.getElementById('task-kpis').innerHTML = `
    <div class="kpi-card kpi-gold"><div class="kpi-icon">⏳</div><div class="kpi-value">${pend}</div><div class="kpi-label">معلقة</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-icon">🔄</div><div class="kpi-value">${prog}</div><div class="kpi-label">قيد التنفيذ</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-value">${done}</div><div class="kpi-label">مكتملة</div></div>
    <div class="kpi-card kpi-purple"><div class="kpi-icon">📋</div><div class="kpi-value">${allTasks.length}</div><div class="kpi-label">الإجمالي</div></div>`;
  renderTasks();
}

function switchTaskTab(tab) {
  currentTab = tab;
  ['pending','in_progress','done','all'].forEach(t=>document.getElementById('tab-'+t)?.classList.remove('active'));
  document.getElementById('tab-'+tab)?.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const list = currentTab==='all' ? allTasks : allTasks.filter(t=>t.status===currentTab);
  document.getElementById('tasks-grid').innerHTML = list.length ? list.map(t=>`
    <div class="card" style="margin:0;${t.status==='done'?'opacity:.6':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        ${PBADGE[t.priority]||''}
        <div style="display:flex;gap:5px">
          ${t.status!=='done'?`<button class="btn btn-sm btn-green" onclick="completeTask(${t.id})">✅</button>`:''}
          <button class="btn btn-sm btn-outline" onclick="editTask(${t.id})">✏️</button>
          <button class="btn btn-sm btn-red" onclick="deleteTask(${t.id})">🗑️</button>
        </div>
      </div>
      <div style="font-weight:800;font-size:14px;margin-bottom:4px">${t.title}</div>
      ${t.description?`<div style="font-size:12px;color:var(--muted);margin-bottom:8px">${t.description}</div>`:''}
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">
        <span>${SBADGE[t.status]||''} ${t.assigned_to?'→ '+t.assigned_to:''}</span>
        <span>${t.due_date?'📅 '+t.due_date:''}</span>
      </div>
    </div>`).join('') : '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">لا توجد مهام في هذه الفئة</div>';
}

async function saveTask() {
  const id = document.getElementById('task-edit-id').value;
  const d = { id:id||null, title:document.getElementById('task-title').value.trim(), description:document.getElementById('task-desc').value, assigned_to:document.getElementById('task-assigned').value, priority:document.getElementById('task-priority').value, status:document.getElementById('task-status').value, due_date:document.getElementById('task-due').value||null };
  if (!d.title) { showToast('العنوان مطلوب','error'); return; }
  const r = await apiPost(API+'tasks&action=save', d);
  if (r.ok) { closeModal('m-add-task'); showToast('تم الحفظ','success'); loadTasks(); }
}

function editTask(id) {
  const t=allTasks.find(x=>x.id==id); if(!t) return;
  document.getElementById('task-edit-id').value=t.id;
  document.getElementById('task-title').value=t.title;
  document.getElementById('task-desc').value=t.description||'';
  document.getElementById('task-assigned').value=t.assigned_to||'';
  document.getElementById('task-priority').value=t.priority||'medium';
  document.getElementById('task-status').value=t.status||'pending';
  document.getElementById('task-due').value=t.due_date||'';
  openModal('m-add-task');
}

async function completeTask(id) { await apiPost(API+'tasks&action=complete',{id}); showToast('✅ تم إكمال المهمة','success'); loadTasks(); }
async function deleteTask(id) { if(!confirm('حذف المهمة؟'))return; await apiPost(API+'tasks&action=delete',{id}); showToast('تم'); loadTasks(); }

loadTasks();
</script>
