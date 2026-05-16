<?php /* Import & File Analysis Module */ ?>
<div class="page-header">
  <div class="page-title">📥 استيراد وتحليل الملفات</div>
  <div class="page-actions">
    <button class="btn btn-gold" onclick="document.getElementById('imp-file').click()">📂 رفع ملف جديد</button>
    <input type="file" id="imp-file" accept=".xlsx,.xls,.docx" style="display:none" onchange="handleImport(this.files[0]);this.value=''">
  </div>
</div>

<!-- Drop Zone -->
<div id="drop-zone" class="card" style="border:2px dashed var(--border);background:var(--bg);text-align:center;padding:40px 20px;cursor:pointer;transition:var(--tr)"
  ondragover="event.preventDefault();this.style.borderColor='var(--gold)';this.style.background='var(--gold-bg)'"
  ondragleave="this.style.borderColor='var(--border)';this.style.background='var(--bg)'"
  ondrop="event.preventDefault();this.style.borderColor='var(--border)';this.style.background='var(--bg)';handleImport(event.dataTransfer.files[0])"
  onclick="document.getElementById('imp-file').click()">
  <div style="font-size:52px;margin-bottom:14px">📊</div>
  <div style="font-size:17px;font-weight:800;margin-bottom:6px">اسحب الملف هنا أو اضغط للاختيار</div>
  <div style="font-size:13px;color:var(--muted);margin-bottom:14px">يدعم: Excel (.xlsx, .xls) وWord (.docx)</div>
  <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
    <span class="badge badge-blue">👷 عمال</span>
    <span class="badge badge-gold">🏠 كفلاء</span>
    <span class="badge badge-teal">🤝 وسطاء</span>
    <span class="badge badge-muted">👤 جهات اتصال</span>
  </div>
</div>

<!-- Preview Panel (hidden until file uploaded) -->
<div id="imp-preview-panel" style="display:none">
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:12px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
      <span style="font-size:24px">📄</span>
      <div>
        <div style="font-weight:700" id="imp-fname">—</div>
        <div style="font-size:12px;color:var(--muted)" id="imp-fcount">—</div>
      </div>
      <div id="imp-stats" style="display:flex;gap:6px;flex-wrap:wrap;margin-right:auto"></div>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
      <label style="font-size:12px;font-weight:700">تصنيف الكل:</label>
      <select id="imp-override" class="form-control" style="width:180px" onchange="overrideAll(this.value)">
        <option value="">— تلقائي —</option>
        <option value="worker">👷 عمال</option>
        <option value="sponsor">🏠 كفلاء</option>
        <option value="middleman">🤝 وسطاء</option>
        <option value="client">👤 عملاء</option>
      </select>
    </div>

    <div class="table-wrap" style="max-height:360px;overflow-y:auto">
      <table>
        <thead><tr>
          <th><input type="checkbox" id="imp-check-all" checked onchange="toggleAllChecks(this.checked)"></th>
          <th>الاسم</th><th>الجوال</th><th>التصنيف</th><th>المبلغ</th>
        </tr></thead>
        <tbody id="imp-tbody"></tbody>
      </table>
    </div>

    <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">
      <button class="btn btn-outline" onclick="cancelImport()">❌ إلغاء</button>
      <button class="btn btn-gold" onclick="confirmImport()">✅ استيراد المحدد</button>
    </div>
  </div>
</div>

<!-- Import History -->
<div class="card">
  <div class="card-title">📋 سجل الاستيراد</div>
  <div class="table-wrap"><table>
    <thead><tr><th>التاريخ</th><th>الملف</th><th>مستورد</th><th>مكرر</th><th>مرفوض</th><th>الإجمالي</th></tr></thead>
    <tbody id="imp-history-tbody">
      <?php
      $history = dbQuery("SELECT ih.*, u.name AS user_name FROM import_history ih LEFT JOIN users u ON ih.created_by=u.id ORDER BY ih.created_at DESC LIMIT 20");
      if ($history): foreach($history as $h): ?>
      <tr>
        <td><?= esc($h['created_at']) ?></td>
        <td><?= esc($h['filename']??'—') ?></td>
        <td style="color:var(--green);font-weight:700"><?= $h['imported'] ?></td>
        <td style="color:var(--muted)"><?= $h['duplicates'] ?></td>
        <td style="color:var(--red)"><?= $h['skipped'] ?></td>
        <td><?= $h['total'] ?></td>
      </tr>
      <?php endforeach; else: ?>
      <tr><td colspan="6" style="text-align:center;color:var(--muted)">لا يوجد سجل استيراد</td></tr>
      <?php endif; ?>
    </tbody>
  </table></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
<script>
const API = '<?= APP_URL ?>/api/?module=';
const CSRF = document.getElementById('csrf-token')?.value||'';
let pendingEntries = [];
const TYPES = {worker:'👷 عامل',sponsor:'🏠 كفيل',middleman:'🤝 وسيط',client:'👤 عميل'};

function classifyEntry(name, extra='') {
  const n = (name+' '+extra).toLowerCase();
  if(/كفيل|sponsor/.test(n)) return 'sponsor';
  if(/وسيط|سمسار|broker/.test(n)) return 'middleman';
  if(/عامل|worker/.test(n)) return 'worker';
  return 'client';
}

function cleanPhone(raw) {
  if(!raw) return '';
  let p = String(raw).replace(/[\s\-\(\)\+]/g,'');
  if(p.startsWith('966')) p='0'+p.slice(3);
  if(p.length===9&&p.startsWith('5')) p='0'+p;
  return p;
}

async function handleImport(file) {
  if(!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  showToast('جاري تحليل الملف...','info');

  try {
    let entries = [];
    if(['xlsx','xls'].includes(ext)) {
      entries = await parseExcel(file);
    } else if(ext==='docx') {
      entries = await parseWord(file);
    } else {
      showToast('نوع غير مدعوم. يُقبل xlsx وdocx فقط','error'); return;
    }
    if(!entries.length) { showToast('لم أجد بيانات في الملف','error'); return; }
    pendingEntries = entries;
    showPreview(entries, file.name);
  } catch(e) {
    showToast('خطأ: '+e.message,'error');
  }
}

async function parseExcel(file) {
  return new Promise((res,rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result,{type:'array'});
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
        if(!rows.length) return res([]);
        const hdr = rows[0].map(h=>String(h).toLowerCase());
        const nc = hdr.findIndex(h=>/اسم|name/.test(h)); const pc = hdr.findIndex(h=>/جوال|phone|هاتف/.test(h)); const tc = hdr.findIndex(h=>/نوع|type|تصنيف/.test(h)); const ac = hdr.findIndex(h=>/مبلغ|amount/.test(h));
        const entries = rows.slice(1).filter(r=>String(r[nc>=0?nc:0]||'').trim().length>1).map((r,i)=>({name:String(r[nc>=0?nc:0]||'').trim(),phone:cleanPhone(String(r[pc>=0?pc:1]||'')),type:classifyEntry(String(r[nc>=0?nc:0]||''),tc>=0?String(r[tc]||''):''),amount:ac>=0?parseFloat(r[ac])||0:0,row:i+2}));
        res(entries);
      } catch(e){rej(e);}
    };
    reader.readAsArrayBuffer(file);
  });
}

async function parseWord(file) {
  return new Promise((res,rej) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const result = await mammoth.extractRawText({arrayBuffer:e.target.result});
        const lines  = result.value.split('\n').map(l=>l.trim()).filter(l=>l.length>2);
        const entries = lines.map((line,i) => {
          const phones = [...line.matchAll(/0?5\d[\s-]?\d{3}[\s-]?\d{4}/g)].map(m=>cleanPhone(m[0]));
          const name   = line.replace(/0?5\d[\s-]?\d{3}[\s-]?\d{4}/g,'').replace(/[,\-:؛،]+/g,' ').trim().split(/\s+/).slice(0,4).join(' ');
          return name.length>2?{name,phone:phones[0]||'',type:classifyEntry(name),amount:0,row:i+1}:null;
        }).filter(Boolean);
        res(entries);
      } catch(e){rej(e);}
    };
    reader.readAsArrayBuffer(file);
  });
}

function showPreview(entries, filename) {
  document.getElementById('imp-preview-panel').style.display='block';
  document.getElementById('drop-zone').style.display='none';
  document.getElementById('imp-fname').textContent=filename;
  document.getElementById('imp-fcount').textContent=entries.length+' سجل';
  const stats={};entries.forEach(e=>{stats[e.type]=(stats[e.type]||0)+1;});
  const TC={worker:'badge-blue',sponsor:'badge-gold',middleman:'badge-teal',client:'badge-muted'};
  document.getElementById('imp-stats').innerHTML=Object.entries(stats).map(([t,c])=>`<span class="badge ${TC[t]||'badge-muted'}">${TYPES[t]||t}: ${c}</span>`).join('');
  document.getElementById('imp-tbody').innerHTML=entries.slice(0,60).map((e,i)=>`
    <tr><td><input type="checkbox" class="imp-chk" data-idx="${i}" checked></td>
    <td>${e.name}</td><td>${e.phone||'—'}</td>
    <td><select class="form-control imp-type-sel" data-idx="${i}" style="padding:3px 8px;font-size:11px" onchange="pendingEntries[this.dataset.idx].type=this.value">
      ${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${e.type===k?'selected':''}>${v}</option>`).join('')}
    </select></td>
    <td>${e.amount>0?e.amount.toLocaleString('ar')+' ر.س':'—'}</td></tr>`).join('');
  if(entries.length>60) document.getElementById('imp-tbody').innerHTML+=`<tr><td colspan="5" style="text-align:center;color:var(--muted);font-size:12px">... و ${entries.length-60} سجل إضافي</td></tr>`;
}

function overrideAll(type){if(!type)return;pendingEntries.forEach(e=>e.type=type);document.querySelectorAll('.imp-type-sel').forEach(s=>s.value=type);}
function toggleAllChecks(v){document.querySelectorAll('.imp-chk').forEach(c=>c.checked=v);}
function cancelImport(){pendingEntries=[];document.getElementById('imp-preview-panel').style.display='none';document.getElementById('drop-zone').style.display='block';}

async function confirmImport() {
  const checked = [...document.querySelectorAll('.imp-chk:checked')];
  const selected = checked.map(cb=>pendingEntries[+cb.dataset.idx]).filter(Boolean);
  if(!selected.length){showToast('لم تختر أي سجل','error');return;}

  // Import via API
  let imported=0,dups=0,skipped=0;
  for(const e of selected){
    if(!e.name||e.name.length<2){skipped++;continue;}
    try{
      const r=await apiPost(API+'customers&action=save',{name:e.name,phone:e.phone,type:e.type,note:'مستورد من ملف'});
      if(r.ok)imported++;else dups++;
    }catch(err){skipped++;}
  }

  // Save import history
  await apiPost(API.replace('module=','')+'module=import_history&action=save',{total:selected.length,imported,duplicates:dups,skipped}).catch(()=>{});

  cancelImport();
  showToast(`✅ تم استيراد ${imported} | مكرر: ${dups} | مرفوض: ${skipped}`,'success');
  setTimeout(()=>location.reload(),1500);
}
</script>
