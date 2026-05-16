<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';
requireLogin();

// Handle file import POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['import_file'])) {
    header('Content-Type: application/json');
    if (!verifyCsrf()) { echo json_encode(['error'=>'CSRF mismatch']); exit; }
    $upload = uploadFile($_FILES['import_file'], 'imports');
    if (!$upload['ok']) { echo json_encode(['error'=>$upload['msg']]); exit; }
    // Return file info for JS processing
    echo json_encode(['ok'=>true, 'path'=>$upload['url'], 'filename'=>$_FILES['import_file']['name'], 'ext'=>$upload['ext']]);
    exit;
}

ob_start(); include __DIR__ . '/modules/import.php'; $body = ob_get_clean();
renderPage('import', 'استيراد وتحليل الملفات', $body);
