<?php /* Reports Module */
$stats = [
  'workers'   => dbFirst("SELECT COUNT(*) AS c FROM workers WHERE status='active'")['c'] ?? 0,
  'sponsors'  => dbFirst("SELECT COUNT(*) AS c FROM sponsors WHERE is_active=1")['c'] ?? 0,
  'customers' => dbFirst("SELECT COUNT(*) AS c FROM customers")['c'] ?? 0,
  'sales_m'   => dbFirst("SELECT COALESCE(SUM(total),0) AS t FROM sales WHERE MONTH(sale_date)=MONTH(CURDATE()) AND YEAR(sale_date)=YEAR(CURDATE())")['t'] ?? 0,
  'exp_m'     => dbFirst("SELECT COALESCE(SUM(amount),0) AS t FROM expenses WHERE MONTH(expense_date)=MONTH(CURDATE()) AND YEAR(expense_date)=YEAR(CURDATE())")['t'] ?? 0,
  'tr_total'  => dbFirst("SELECT COALESCE(SUM(amount),0) AS t FROM transfers")['t'] ?? 0,
  'tasks_done'=> dbFirst("SELECT COUNT(*) AS c FROM tasks WHERE status='done'")['c'] ?? 0,
  'tasks_all' => dbFirst("SELECT COUNT(*) AS c FROM tasks")['c'] ?? 0,
  'req_total' => dbFirst("SELECT COUNT(*) AS c FROM service_requests")['c'] ?? 0,
  'req_done'  => dbFirst("SELECT COUNT(*) AS c FROM service_requests WHERE status='done'")['c'] ?? 0,
];
$profit = $stats['sales_m'] - $stats['exp_m'];
?>
<div class="page-header">
  <div class="page-title">📈 التقارير والإحصائيات</div>
  <div class="page-actions no-print">
    <button class="btn btn-outline" onclick="window.print()">🖨️ طباعة</button>
  </div>
</div>

<!-- KPIs -->
<div class="kpi-grid">
  <div class="kpi-card kpi-blue"><div class="kpi-icon">👷</div><div class="kpi-value"><?= $stats['workers'] ?></div><div class="kpi-label">العمال النشطون</div></div>
  <div class="kpi-card kpi-gold"><div class="kpi-icon">🏠</div><div class="kpi-value"><?= $stats['sponsors'] ?></div><div class="kpi-label">الكفلاء</div></div>
  <div class="kpi-card kpi-teal"><div class="kpi-icon">👥</div><div class="kpi-value"><?= $stats['customers'] ?></div><div class="kpi-label">جهات الاتصال</div></div>
  <div class="kpi-card kpi-green"><div class="kpi-icon">💰</div><div class="kpi-value"><?= number_format($stats['sales_m'],2) ?> ر.س</div><div class="kpi-label">مبيعات هذا الشهر</div></div>
  <div class="kpi-card kpi-red"><div class="kpi-icon">💳</div><div class="kpi-value"><?= number_format($stats['exp_m'],2) ?> ر.س</div><div class="kpi-label">مصروفات هذا الشهر</div></div>
  <div class="kpi-card <?= $profit>=0?'kpi-green':'kpi-red' ?>"><div class="kpi-icon">📊</div><div class="kpi-value"><?= number_format($profit,2) ?> ر.س</div><div class="kpi-label">صافي الربح</div></div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

  <!-- Workers by nationality -->
  <div class="card">
    <div class="card-title">🌍 توزيع العمال بالجنسية</div>
    <div class="table-wrap"><table>
      <thead><tr><th>الجنسية</th><th>العدد</th><th>النسبة</th></tr></thead>
      <tbody>
      <?php
      $total_workers = max(1, $stats['workers']);
      $nats = dbQuery("SELECT nationality, COUNT(*) AS cnt FROM workers WHERE status='active' GROUP BY nationality ORDER BY cnt DESC LIMIT 10");
      foreach ($nats as $n):
        $pct = round($n['cnt'] / $total_workers * 100);
      ?>
        <tr><td><?= esc($n['nationality']??'غير محدد') ?></td><td><?= $n['cnt'] ?></td>
        <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:<?= $pct ?>%;height:100%;background:var(--gold);border-radius:3px"></div></div><span style="font-size:11px;color:var(--muted)"><?= $pct ?>%</span></div></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table></div>
  </div>

  <!-- Monthly Sales vs Expenses -->
  <div class="card">
    <div class="card-title">📊 المبيعات مقابل المصروفات (آخر 6 أشهر)</div>
    <canvas id="chart-monthly" height="180"></canvas>
  </div>

  <!-- Tasks Summary -->
  <div class="card">
    <div class="card-title">✅ ملخص المهام</div>
    <div class="kpi-grid" style="margin:0">
      <div class="kpi-card kpi-green" style="padding:12px"><div class="kpi-value"><?= $stats['tasks_done'] ?></div><div class="kpi-label">مكتملة</div></div>
      <div class="kpi-card kpi-gold" style="padding:12px"><div class="kpi-value"><?= $stats['tasks_all'] - $stats['tasks_done'] ?></div><div class="kpi-label">معلقة</div></div>
    </div>
    <div style="margin-top:12px">
      <div style="font-size:12px;color:var(--muted);margin-bottom:6px">معدل الإنجاز</div>
      <div style="height:8px;background:var(--border);border-radius:4px"><div style="width:<?= $stats['tasks_all']>0?round($stats['tasks_done']/$stats['tasks_all']*100):0 ?>%;height:100%;background:var(--green);border-radius:4px"></div></div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px"><?= $stats['tasks_all']>0?round($stats['tasks_done']/$stats['tasks_all']*100):0 ?>%</div>
    </div>
  </div>

  <!-- Service Requests -->
  <div class="card">
    <div class="card-title">📋 ملخص طلبات الخدمة</div>
    <?php
    $req_by_type = dbQuery("SELECT service_label, service_icon, COUNT(*) AS cnt FROM service_requests GROUP BY service_type ORDER BY cnt DESC LIMIT 8");
    ?>
    <?php foreach($req_by_type as $r): ?>
    <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:18px"><?= esc($r['service_icon']??'📁') ?></span>
      <span style="font-size:13px;flex:1"><?= esc($r['service_label']??'') ?></span>
      <span class="badge badge-blue"><?= $r['cnt'] ?></span>
    </div>
    <?php endforeach; ?>
    <?php if(empty($req_by_type)): ?>
    <div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">لا توجد طلبات بعد</div>
    <?php endif; ?>
  </div>

</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script>
(async function() {
  const API = '<?= APP_URL ?>/api/?module=';
  const r   = await apiGet(API + 'stats');

  // Monthly chart
  const months6Labels = [];
  const salesData=[], expData=[];
  const now = new Date();
  for (let i=5;i>=0;i--) {
    const d = new Date(now); d.setMonth(d.getMonth()-i);
    months6Labels.push(d.toLocaleDateString('ar-SA',{month:'short'}));
    salesData.push(0); expData.push(0); // placeholder — extend API if needed
  }
  // Use current month data we have
  salesData[5] = <?= $stats['sales_m'] ?>;
  expData[5]   = <?= $stats['exp_m'] ?>;

  new Chart(document.getElementById('chart-monthly'), {
    type:'bar',
    data:{ labels:months6Labels, datasets:[
      {label:'المبيعات',data:salesData,backgroundColor:'rgba(22,163,74,.7)',borderColor:'#16a34a',borderWidth:2,borderRadius:6},
      {label:'المصروفات',data:expData,backgroundColor:'rgba(220,38,38,.6)',borderColor:'#dc2626',borderWidth:2,borderRadius:6}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',rtl:true,labels:{font:{family:'Cairo',size:11}}}},scales:{x:{ticks:{font:{family:'Cairo'}}},y:{ticks:{font:{family:'Cairo'}}}}}
  });
})();
</script>
