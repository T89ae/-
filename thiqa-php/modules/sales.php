<?php /* Sales Module */ ?>
<div class="page-header">
  <div class="page-title">🛒 المبيعات</div>
  <div class="page-actions">
    <button class="btn btn-outline no-print" onclick="exportCSV('sales-table','sales')">📊 CSV</button>
    <button class="btn btn-gold" onclick="openModal('m-add-sale')">➕ تسجيل بيع</button>
  </div>
</div>

<div class="kpi-grid" id="sales-kpis"></div>

<div class="filter-bar">
  <input type="text" id="sale-search" class="form-control" style="width:240px" placeholder="🔍 بحث..." oninput="filterSales()">
  <input type="date" id="sale-from" class="form-control" style="width:160px" onchange="loadSales()">
  <input type="date" id="sale-to" class="form-control" style="width:160px" onchange="loadSales()">
  <button class="btn btn-outline" onclick="document.getElementById('sale-from').value='';document.getElementById('sale-to').value='';loadSales()">مسح</button>
</div>

<div class="card">
  <div class="table-wrap"><table id="sales-table">
    <thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th>العميل</th><th>طريقة الدفع</th><th>التاريخ</th><th>الإجراء</th></tr></thead>
    <tbody id="sales-tbody"></tbody>
  </table></div>
</div>

<!-- Modal -->
<div class="modal-overlay" id="m-add-sale">
  <div class="modal">
    <div class="modal-header"><span>🛒 تسجيل بيع</span><button class="modal-close" onclick="closeModal('m-add-sale')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="sale-edit-id">
      <div class="form-grid">
        <div class="form-group"><label>اسم الصنف *</label><input id="sale-item" class="form-control"></div>
        <div class="form-group"><label>العميل</label><input id="sale-customer" class="form-control"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>الكمية</label><input id="sale-qty" class="form-control" type="number" step="0.001" value="1" oninput="calcSaleTotal()"></div>
        <div class="form-group"><label>سعر الوحدة *</label><input id="sale-price" class="form-control" type="number" step="0.01" oninput="calcSaleTotal()"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>الإجمالي</label><input id="sale-total" class="form-control" readonly style="background:var(--bg);font-weight:700"></div>
        <div class="form-group"><label>طريقة الدفع</label>
          <select id="sale-method" class="form-control"><option value="cash">نقداً</option><option value="bank">بنك</option><option value="transfer">تحويل</option><option value="credit">آجل</option></select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>التاريخ</label><input id="sale-date" class="form-control" type="date"></div>
        <div class="form-group"><label>ملاحظات</label><input id="sale-note" class="form-control"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('m-add-sale')">إلغاء</button>
      <button class="btn btn-gold" onclick="saveSale()">💾 حفظ</button>
    </div>
  </div>
</div>

<script>
const API = '<?= APP_URL ?>/api/?module=';
let allSales = [];
const METH = {cash:'نقداً',bank:'بنك',transfer:'تحويل',credit:'آجل'};

function calcSaleTotal() {
  const q = parseFloat(document.getElementById('sale-qty').value)||1;
  const p = parseFloat(document.getElementById('sale-price').value)||0;
  document.getElementById('sale-total').value = (q*p).toFixed(2);
}

async function loadSales() {
  const from = document.getElementById('sale-from').value;
  const to   = document.getElementById('sale-to').value;
  const r = await apiGet(API + `sales&action=list${from?'&from='+from:''}${to?'&to='+to:''}`);
  allSales = r.data||[];
  const t  = r.totals||{};
  document.getElementById('sales-kpis').innerHTML = `
    <div class="kpi-card kpi-green"><div class="kpi-icon">💰</div><div class="kpi-value">${parseFloat(t.total_amount||0).toLocaleString('ar')} ر.س</div><div class="kpi-label">إجمالي المبيعات</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-icon">📋</div><div class="kpi-value">${t.cnt||0}</div><div class="kpi-label">عدد المبيعات</div></div>`;
  renderSales(allSales);
}

function renderSales(data) {
  document.getElementById('sales-tbody').innerHTML = (data||[]).map(s=>`
    <tr><td>${s.id}</td><td><strong>${s.item_name}</strong></td><td>${s.quantity}</td>
    <td>${parseFloat(s.unit_price).toLocaleString('ar')} ر.س</td>
    <td style="color:var(--green);font-weight:700">${parseFloat(s.total).toLocaleString('ar')} ر.س</td>
    <td>${s.customer_name||'—'}</td><td>${METH[s.payment_method]||s.payment_method}</td>
    <td>${s.sale_date||'—'}</td>
    <td class="td-actions"><button class="btn btn-sm btn-outline" onclick="editSale(${s.id})">✏️</button><button class="btn btn-sm btn-red" onclick="deleteSale(${s.id})">🗑️</button></td></tr>`)
    .join('') || '<tr><td colspan="9" style="text-align:center;color:var(--muted)">لا توجد مبيعات</td></tr>';
}

function filterSales() {
  const q = document.getElementById('sale-search').value.toLowerCase();
  renderSales(allSales.filter(s=>(s.item_name+(s.customer_name||'')).toLowerCase().includes(q)));
}

function openAddSale() {
  document.getElementById('sale-edit-id').value='';
  document.getElementById('sale-date').value=new Date().toISOString().slice(0,10);
  document.getElementById('sale-qty').value=1;
  openModal('m-add-sale');
}

async function saveSale() {
  const id = document.getElementById('sale-edit-id').value;
  const d = { id:id||null, item_name:document.getElementById('sale-item').value.trim(), customer_name:document.getElementById('sale-customer').value, quantity:document.getElementById('sale-qty').value||1, unit_price:document.getElementById('sale-price').value, payment_method:document.getElementById('sale-method').value, sale_date:document.getElementById('sale-date').value||new Date().toISOString().slice(0,10), note:document.getElementById('sale-note').value };
  if (!d.item_name||!d.unit_price) { showToast('الصنف والسعر مطلوبان','error'); return; }
  const r = await apiPost(API+'sales&action=save', d);
  if (r.ok) { closeModal('m-add-sale'); showToast(r.msg||'تم الحفظ','success'); loadSales(); }
}

function editSale(id) {
  const s = allSales.find(x=>x.id==id); if(!s) return;
  document.getElementById('sale-edit-id').value=s.id;
  document.getElementById('sale-item').value=s.item_name;
  document.getElementById('sale-customer').value=s.customer_name||'';
  document.getElementById('sale-qty').value=s.quantity;
  document.getElementById('sale-price').value=s.unit_price;
  document.getElementById('sale-total').value=s.total;
  document.getElementById('sale-method').value=s.payment_method||'cash';
  document.getElementById('sale-date').value=s.sale_date||'';
  document.getElementById('sale-note').value=s.note||'';
  openModal('m-add-sale');
}

async function deleteSale(id) { if(!confirm('حذف؟'))return; await apiPost(API+'sales&action=delete',{id}); showToast('تم'); loadSales(); }

// Init
document.getElementById('sale-date').value = new Date().toISOString().slice(0,10);
loadSales();
</script>
