<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';
requireLogin();

$titles = [
  'workers'=>'العمال والكفلاء','transfers'=>'الحوالات المالية',
  'sales'=>'المبيعات','expenses'=>'المصروفات','tasks'=>'المهام',
  'brokers'=>'الوسطاء','contacts'=>'جهات الاتصال','reports'=>'التقارير',
];
$section = 'tasks';
$title   = $titles[$section];

ob_start();
include __DIR__ . '/modules/tasks.php';
$body = ob_get_clean();
renderPage($section, $title, $body);
