<?php
/**
 * includes/layout.php — القالب الرئيسي للنظام
 */

function renderPage(string $section, string $title, string $body, array $opts = []): void {
    $user    = currentUser();
    $csrf    = csrfToken();
    $appName = APP_NAME;
    $version = APP_VERSION;

    $nav = [
        ['section'=>'dashboard',  'icon'=>'📊', 'label'=>'لوحة التحكم',       'group'=>'الرئيسية'],
        ['section'=>'workers',    'icon'=>'👷', 'label'=>'العمال والكفلاء',    'group'=>'إدارة العمال'],
        ['section'=>'transfers',  'icon'=>'💸', 'label'=>'الحوالات المالية',   'group'=>'إدارة العمال'],
        ['section'=>'accounting', 'icon'=>'📒', 'label'=>'المحاسبة',           'group'=>'المالية'],
        ['section'=>'sales',      'icon'=>'🛒', 'label'=>'المبيعات',           'group'=>'المالية'],
        ['section'=>'expenses',   'icon'=>'💳', 'label'=>'المصروفات',          'group'=>'المالية'],
        ['section'=>'inventory',  'icon'=>'📦', 'label'=>'المخزون',            'group'=>'المالية'],
        ['section'=>'brokers',    'icon'=>'🤝', 'label'=>'الوسطاء',            'group'=>'المالية'],
        ['section'=>'receipts',   'icon'=>'🧾', 'label'=>'الإيصالات',          'group'=>'المالية'],
        ['section'=>'contacts',   'icon'=>'👥', 'label'=>'جهات الاتصال',       'group'=>'الإدارة'],
        ['section'=>'tasks',      'icon'=>'✅', 'label'=>'المهام',              'group'=>'الإدارة'],
        ['section'=>'attendance', 'icon'=>'📅', 'label'=>'الحضور',             'group'=>'الإدارة'],
        ['section'=>'files',      'icon'=>'📁', 'label'=>'الملفات',            'group'=>'الإدارة'],
        ['section'=>'loyalty',    'icon'=>'⭐', 'label'=>'نظام الولاء',         'group'=>'الإدارة'],
        ['section'=>'agents',     'icon'=>'👤', 'label'=>'المتابعون',           'group'=>'الاستيراد والمتابعة'],
        ['section'=>'import',     'icon'=>'📥', 'label'=>'استيراد الملفات',    'group'=>'الاستيراد والمتابعة'],
        ['section'=>'reports',    'icon'=>'📈', 'label'=>'التقارير',           'group'=>'التحليل'],
        ['section'=>'hulul',      'icon'=>'🤖', 'label'=>'حلول — الوكيل الذكي','group'=>'الذكاء الاصطناعي', 'badge'=>'AI'],
        ['section'=>'ops',        'icon'=>'📋', 'label'=>'سجل النشاطات',       'group'=>'النظام'],
        ['section'=>'settings',   'icon'=>'⚙️', 'label'=>'الإعدادات',          'group'=>'النظام'],
    ];

    // Group nav items
    $groups = [];
    foreach ($nav as $item) {
        $groups[$item['group']][] = $item;
    }
    ?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="<?= esc($csrf) ?>">
<title><?= esc($title) ?> — <?= esc($appName) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link rel="stylesheet" href="<?= APP_URL ?>/assets/css/main.css">
</head>
<body>

<div id="app">

  <!-- ═══ SIDEBAR ═══ -->
  <nav id="sidebar">
    <div class="brand">
      <div class="brand-logo">🏢</div>
      <div class="brand-text">
        <div class="brand-name"><?= esc($appName) ?></div>
        <div class="brand-sub">v<?= esc($version) ?></div>
      </div>
    </div>

    <div class="sidebar-user">
      <div class="su-avatar"><?= mb_substr($user['name'] ?? 'م', 0, 1) ?></div>
      <div>
        <div class="su-name"><?= esc($user['name'] ?? 'مدير') ?></div>
        <div class="su-role"><?= esc($user['role'] ?? '') ?></div>
      </div>
    </div>

    <div class="sidebar-nav">
      <?php foreach ($groups as $groupName => $items): ?>
      <div class="nav-group">
        <div class="nav-group-title"><?= esc($groupName) ?></div>
        <?php foreach ($items as $item): ?>
        <a href="<?= APP_URL ?>/<?= $item['section'] ?>.php"
           class="nav-item <?= $section === $item['section'] ? 'active' : '' ?>">
          <span class="nav-icon"><?= $item['icon'] ?></span>
          <span class="nav-label"><?= esc($item['label']) ?></span>
          <?php if (!empty($item['badge'])): ?>
          <span class="nav-ai-badge"><?= esc($item['badge']) ?></span>
          <?php endif; ?>
        </a>
        <?php endforeach; ?>
      </div>
      <?php endforeach; ?>
    </div>

    <div class="sidebar-footer">
      <a href="<?= APP_URL ?>/logout.php" class="nav-item">
        <span class="nav-icon">🚪</span>
        <span class="nav-label">تسجيل الخروج</span>
      </a>
    </div>
  </nav>

  <!-- ═══ MAIN ═══ -->
  <div id="main">

    <!-- Topbar -->
    <div id="topbar">
      <div class="tb-left">
        <button id="sidebar-toggle" onclick="toggleSidebar()" class="tb-btn" title="القائمة">
          <i class="fas fa-bars"></i>
        </button>
        <div class="tb-title"><?= esc($title) ?></div>
      </div>
      <div class="tb-right">
        <button class="tb-btn no-print" onclick="window.print()" title="طباعة">🖨️</button>
        <div class="tb-user">
          <div class="tb-avatar"><?= mb_substr($user['name'] ?? 'م', 0, 1) ?></div>
          <span class="tb-uname"><?= esc($user['name'] ?? '') ?></span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div id="content">
      <?php if (!empty($opts['flash'])): ?>
      <div class="alert alert-<?= esc($opts['flash']['type'] ?? 'info') ?>">
        <?= esc($opts['flash']['msg']) ?>
      </div>
      <?php endif; ?>

      <?= $body ?>
    </div>

  </div><!-- /#main -->

</div><!-- /#app -->

<!-- Toast Container -->
<div id="toast-container"></div>

<!-- Global CSRF -->
<input type="hidden" id="csrf-token" value="<?= esc($csrf) ?>">

<script src="<?= APP_URL ?>/assets/js/main.js"></script>
<?php if (!empty($opts['scripts'])): ?>
<?php foreach ($opts['scripts'] as $script): ?>
<script src="<?= APP_URL ?>/assets/js/<?= esc($script) ?>"></script>
<?php endforeach; ?>
<?php endif; ?>
<?php if (!empty($opts['inline_js_data'])): ?>
<script>
// بيانات مُمررة بأمان من PHP إلى JavaScript
const PAGE_DATA = <?= json_encode($opts['inline_js_data'], JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
</script>
<?php endif; ?>

</body>
</html>
<?php
}
