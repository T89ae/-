<?php /* Agents Module */ ?>
<div class="page-header">
  <div class="page-title">👤 المتابعون وطلبات الخدمة</div>
  <div class="page-actions">
    <button class="btn btn-outline" onclick="sendAllDebtAlerts()">📧 تنبيه الديون</button>
    <button class="btn btn-outline" onclick="switchAgTab('debt');loadDebtReport()">⚠️ تقرير الديون</button>
    <button class="btn btn-gold" onclick="openModal('m-add-agent')">➕ متابع جديد</button>
  </div>
</div>

<div class="kpi-grid" id="ag-kpis"></div>

<div class="tab-group">
  <button class="tab-btn active" id="tab-agents-list" onclick="switchAgTab('list')">👥 المتابعون</button>
  <button class="tab-btn" id="tab-agents-debt" onclick="switchAgTab('debt');loadDebtReport()">⚠️ تقرير الديون</button>
</div>

<div id="ag-tab-list"><div id="ag-agents-container"></div></div>
<div id="ag-tab-debt" style="display:none">
  <div class="card">
    <div class="card-title">⚠️ قائمة الديون المستحقة</div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <input type="text" id="debt-search" class="form-control" style="max-width:240px" placeholder="🔍 بحث..." oninput="filterDebt()">
      <button class="btn btn-outline no-print" onclick="exportCSV('debt-table','debts')">📊 CSV</button>
      <button class="btn btn-outline" onclick="sendAllDebtAlerts()">📧 إرسال تنبيهات</button>
    </div>
    <div class="table-wrap"><table id="debt-table">
      <thead><tr><th>المتابع</th><th>العميل</th><th>الطلب</th><th>المدفوع</th><th>سعر الجملة</th><th>الدين</th><th>التاريخ</th><th>إجراء</th></tr></thead>
      <tbody id="debt-tbody"></tbody>
    </table></div>
  </div>
</div>

<!-- Modal Agent -->
<div class="modal-overlay" id="m-add-agent"><div class="modal" style="max-width:400px">
  <div class="modal-header"><span>👤 متابع جديد</span><button class="modal-close" onclick="closeModal('m-add-agent')">✕</button></div>
  <div class="modal-body"><input type="hidden" id="ag-edit-id">
    <div class="form-group"><label>الاسم *</label><input id="ag-name" class="form-control"></div>
    <div class="form-group"><label>الجوال</label><input id="ag-phone" class="form-control" type="tel"></div>
    <div class="form-group"><label>ملاحظات</label><textarea id="ag-note" class="form-control" rows="2"></textarea></div>
  </div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('m-add-agent')">إلغاء</button><button class="btn btn-gold" onclick="saveAgent()">💾 حفظ</button></div>
</div></div>

<!-- Modal Request -->
<div class="modal-overlay" id="m-add-req"><div class="modal" style="max-width:520px">
  <div class="modal-header"><span>📋 طلب خدمة</span><button class="modal-close" onclick="closeModal('m-add-req')">✕</button></div>
  <div class="modal-body"><input type="hidden" id="req-id"><input type="hidden" id="req-agent-id">
    <div class="form-group"><label>وصف الطلب *</label><textarea id="req-desc" class="form-control" rows="2"></textarea></div>
    <div class="form-grid">
      <div class="form-group"><label>المبلغ المدفوع (ر.س)</label><input id="req-paid" class="form-control" type="number" step="0.01" oninput="calcReqDebt()"></div>
      <div class="form-group"><label>سعر الجملة (ر.س)</label><input id="req-wholesale" class="form-control" type="number" step="0.01" oninput="calcReqDebt()"></div>
    </div>
    <div class="form-group"><label>الدين المتبقي</label><input id="req-debt" class="form-control" readonly style="background:var(--bg)"></div>
    <div style="padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">🔗 ربط بعميل (اختياري)</div>
      <div class="form-grid">
        <div class="form-group" style="margin:0"><label>الاسم</label><input id="req-client" class="form-control"></div>
        <div class="form-group" style="margin:0"><label>الجوال</label><input id="req-client-phone" class="form-control" type="tel"></div>
      </div>
    </div>
    <div class="form-group"><label>ملاحظات</label><textarea id="req-note" class="form-control" rows="2"></textarea></div>
  </div>
  <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal('m-add-req')">إلغاء</button><button class="btn btn-gold" onclick="saveRequest()">💾 حفظ</button></div>
</div></div>

<script>
const API='<?= APP_URL ?>/api/?module=';
let allAgents=[], allReqs=[], allDebts=[];

function calcReqDebt(){const p=parseFloat(document.getElementById('req-paid').value)||0;const w=parseFloat(document.getElementById('req-wholesale').value)||0;const d=w>p?w-p:0;const el=document.getElementById('req-debt');el.value=d>0?d.toFixed(2):'';el.style.color=d>0?'var(--red)':'var(--green)';}

async function loadAgents(){
  const [ar,rr]=await Promise.all([apiGet(API+'agents&action=list'),apiGet(API+'agent_requests&action=list')]);
  allAgents=ar.data||[]; allReqs=rr.data||[];
  renderKpis(); renderAgents();
}

function renderKpis(){
  const totalPaid=allReqs.reduce((s,r)=>s+(parseFloat(r.paid_amount)||0),0);
  const totalDebt=allReqs.reduce((s,r)=>s+(parseFloat(r.debt)||0),0);
  document.getElementById('ag-kpis').innerHTML=`
    <div class="kpi-card kpi-blue"><div class="kpi-icon">👥</div><div class="kpi-value">${allAgents.length}</div><div class="kpi-label">المتابعون</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">💰</div><div class="kpi-value">${totalPaid.toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي المدفوع</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-icon">⚠️</div><div class="kpi-value">${totalDebt.toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي الديون</div></div>`;
}

function renderAgents(){
  document.getElementById('ag-agents-container').innerHTML=allAgents.length?allAgents.map(ag=>{
    const agReqs=allReqs.filter(r=>r.agent_id==ag.id);
    const debt=agReqs.reduce((s,r)=>s+(parseFloat(r.debt)||0),0);
    return`<div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff">${ag.name.charAt(0)}</div>
          <div><div style="font-weight:800">${ag.name}</div><div style="font-size:11px;color:var(--muted)">${ag.phone||'لا جوال'}</div></div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${debt>0?`<span class="badge badge-red">دين: ${debt.toLocaleString('ar')} ر.س</span>`:'<span class="badge badge-green">لا ديون</span>'}
          <span class="badge badge-blue">${agReqs.length} طلب</span>
          <button class="btn btn-sm btn-outline" onclick="openReq(${ag.id})">➕ طلب</button>
          <button class="btn btn-sm btn-outline" onclick="editAgent(${ag.id})">✏️</button>
          <button class="btn btn-sm btn-red" onclick="deleteAgent(${ag.id})">🗑️</button>
        </div>
      </div>
      ${agReqs.length?`<div class="table-wrap"><table><thead><tr><th>الطلب</th><th>المدفوع</th><th>الجملة</th><th>الدين</th><th>إجراء</th></tr></thead><tbody>
        ${agReqs.map(r=>`<tr><td>${r.description||'—'}</td><td style="color:var(--green)">${parseFloat(r.paid_amount||0).toLocaleString('ar')} ر.س</td><td>${parseFloat(r.wholesale_price||0).toLocaleString('ar')} ر.س</td><td>${parseFloat(r.debt||0)>0?`<span class="badge badge-red">${parseFloat(r.debt).toLocaleString('ar')} ر.س</span>`:'<span class="badge badge-green">مسدد</span>'}</td><td class="td-actions"><button class="btn btn-sm btn-green" onclick="payReq(${r.id})">✅</button><button class="btn btn-sm btn-red" onclick="deleteReq(${r.id})">🗑️</button></td></tr>`).join('')}
      </tbody></table></div>`:'<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px">لا توجد طلبات</div>'}
    </div>`;
  }).join(''):'<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">لا يوجد متابعون</div></div>';
}

async function loadDebtReport(){
  const r=await apiGet(API+'agent_requests&action=list&debts_only=1');
  allDebts=r.data||[];
  renderDebtTable(allDebts);
}

function renderDebtTable(data){
  document.getElementById('debt-tbody').innerHTML=(data||[]).map(r=>`
    <tr><td>${r.agent_name||'—'}</td><td>${r.client_name||'—'}</td><td>${r.description||'—'}</td>
    <td style="color:var(--green)">${parseFloat(r.paid_amount||0).toLocaleString('ar')} ر.س</td>
    <td>${parseFloat(r.wholesale_price||0).toLocaleString('ar')} ر.س</td>
    <td><span class="badge badge-red">${parseFloat(r.debt).toLocaleString('ar')} ر.س</span></td>
    <td>${r.created_at?.slice(0,10)||'—'}</td>
    <td><button class="btn btn-sm btn-green" onclick="payReq(${r.id})">✅ تسديد</button></td></tr>`)
    .join('')||'<tr><td colspan="8" style="text-align:center;color:var(--muted)">لا توجد ديون مستحقة</td></tr>';
}

function filterDebt(){const q=document.getElementById('debt-search').value.toLowerCase();renderDebtTable(allDebts.filter(r=>(r.client_name||'').toLowerCase().includes(q)||(r.agent_name||'').toLowerCase().includes(q)));}

function switchAgTab(tab){
  document.getElementById('ag-tab-list').style.display=tab==='list'?'block':'none';
  document.getElementById('ag-tab-debt').style.display=tab==='debt'?'block':'none';
  document.getElementById('tab-agents-list').classList.toggle('active',tab==='list');
  document.getElementById('tab-agents-debt').classList.toggle('active',tab==='debt');
}

async function saveAgent(){
  const id=document.getElementById('ag-edit-id').value;
  const d={id:id||null,name:document.getElementById('ag-name').value.trim(),phone:document.getElementById('ag-phone').value,note:document.getElementById('ag-note').value};
  if(!d.name){showToast('الاسم مطلوب','error');return;}
  const r=await apiPost(API+'agents&action=save',d);
  if(r.ok){closeModal('m-add-agent');showToast('تم','success');loadAgents();}
}

function editAgent(id){const a=allAgents.find(x=>x.id==id);if(!a)return;document.getElementById('ag-edit-id').value=a.id;document.getElementById('ag-name').value=a.name;document.getElementById('ag-phone').value=a.phone||'';document.getElementById('ag-note').value=a.note||'';openModal('m-add-agent');}
async function deleteAgent(id){if(!confirm('حذف المتابع وجميع طلباته؟'))return;await apiPost(API+'agents&action=delete',{id});showToast('تم');loadAgents();}

function openReq(agentId){document.getElementById('req-id').value='';document.getElementById('req-agent-id').value=agentId;document.getElementById('req-desc').value='';document.getElementById('req-paid').value='';document.getElementById('req-wholesale').value='';document.getElementById('req-debt').value='';document.getElementById('req-client').value='';document.getElementById('req-client-phone').value='';document.getElementById('req-note').value='';openModal('m-add-req');}

async function saveRequest(){
  const d={agent_id:document.getElementById('req-agent-id').value,description:document.getElementById('req-desc').value.trim(),paid_amount:document.getElementById('req-paid').value||0,wholesale_price:document.getElementById('req-wholesale').value||0,client_name:document.getElementById('req-client').value,client_phone:document.getElementById('req-client-phone').value,note:document.getElementById('req-note').value};
  if(!d.description){showToast('الوصف مطلوب','error');return;}
  const r=await apiPost(API+'agent_requests&action=save',d);
  if(r.ok){closeModal('m-add-req');showToast('تم','success');loadAgents();}
}

async function payReq(id){if(!confirm('تسديد هذا الدين؟'))return;await apiPost(API+'agent_requests&action=pay',{id});showToast('✅ تم','success');loadAgents();if(document.getElementById('ag-tab-debt').style.display!=='none')loadDebtReport();}
async function deleteReq(id){if(!confirm('حذف؟'))return;await apiPost(API+'agent_requests&action=delete',{id});showToast('تم');loadAgents();}

function sendAllDebtAlerts(){
  const debts=allReqs.filter(r=>parseFloat(r.debt)>0);
  if(!debts.length){showToast('لا توجد ديون','info');return;}
  const lines=debts.map(r=>`• ${r.client_name||'—'} (${r.agent_name||'—'}): ${r.debt} ر.س`);
  const body=`قائمة الديون المستحقة:\n\n${lines.join('\n')}\n\nالإجمالي: ${debts.reduce((s,r)=>s+(parseFloat(r.debt)||0),0).toFixed(2)} ر.س`;
  window.location.href=`mailto:?subject=${encodeURIComponent('تقرير الديون - '+new Date().toLocaleDateString('ar-SA'))}&body=${encodeURIComponent(body)}`;
}

loadAgents();
</script>
