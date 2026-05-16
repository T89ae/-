<?php
/**
 * includes/functions.php — دوال مساعدة عامة
 */

// ── Output Helpers ───────────────────────────────────────────
function json(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function redirect(string $url): void {
    header("Location: {$url}");
    exit;
}

function isAjax(): bool {
    return (strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest')
        || (($_SERVER['HTTP_ACCEPT'] ?? '') === 'application/json');
}

// ── Security ────────────────────────────────────────────────
function esc(mixed $val): string {
    return htmlspecialchars((string)($val ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function sanitize(string $val): string {
    return trim(strip_tags($val));
}

function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf(): bool {
    $token = $_POST['_csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

function cleanPhone(string $raw): string {
    $p = preg_replace('/[\s\-\(\)\+]/', '', $raw);
    $p = ltrim($p, '0');
    if (str_starts_with($p, '966')) $p = substr($p, 3);
    if (strlen($p) === 9 && str_starts_with($p, '5')) {
        return '0' . $p;
    }
    return strlen($p) === 10 ? $p : $raw;
}

function isValidPhone(string $phone): bool {
    return (bool) preg_match('/^05[0-9]{8}$/', $phone);
}

function isValidEmail(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validateRequired(array $fields, array $data): array {
    $errors = [];
    foreach ($fields as $field => $label) {
        if (empty($data[$field]) || trim((string)$data[$field]) === '') {
            $errors[$field] = "{$label} مطلوب";
        }
    }
    return $errors;
}

function validatePositiveNumber(mixed $val, string $label): ?string {
    if ((float)$val < 0) return "{$label} لا يمكن أن يكون سالباً";
    return null;
}

// ── Date & Format Helpers ────────────────────────────────────
function today(): string {
    return date('Y-m-d');
}

function nowTs(): string {
    return date('Y-m-d H:i:s');
}

function formatDate(string $date): string {
    if (empty($date) || $date === '0000-00-00') return '—';
    return date('d/m/Y', strtotime($date));
}

function formatMoney(float $amount, string $currency = 'ر.س'): string {
    return number_format($amount, 2) . ' ' . $currency;
}

function daysUntil(string $date): int {
    $diff = (new DateTime($date))->diff(new DateTime(today()));
    $days = (int) $diff->format('%r%a');
    return -$days; // negative = expired
}

function classifyType(string $name, string $extra = ''): string {
    $text = strtolower($name . ' ' . $extra);
    if (preg_match('/كفيل|sponsor|kafeel/', $text))       return 'sponsor';
    if (preg_match('/وسيط|سمسار|broker|mediator/', $text)) return 'middleman';
    if (preg_match('/عامل|worker|employee/', $text))        return 'worker';
    return 'client';
}

// ── Pagination HTML ──────────────────────────────────────────
function paginationLinks(int $currentPage, int $lastPage, string $baseUrl): string {
    if ($lastPage <= 1) return '';
    $html = '<div class="pagination">';
    for ($i = 1; $i <= $lastPage; $i++) {
        $active = $i === $currentPage ? ' active' : '';
        $html  .= '<a href="' . esc($baseUrl) . '&page=' . $i . '" class="page-link' . $active . '">' . $i . '</a>';
    }
    return $html . '</div>';
}

// ── Rate Limiting (file-based) ───────────────────────────────
function getClientIp(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $key) {
        $ip = $_SERVER[$key] ?? '';
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }
    return 'unknown';
}

function checkRateLimit(string $key = ''): bool {
    $ip   = getClientIp();
    $file = sys_get_temp_dir() . '/rl_' . md5($ip . $key) . '.json';
    $now  = time();
    $data = ['count' => 0, 'window' => $now];

    if (file_exists($file)) {
        $raw  = file_get_contents($file);
        $data = json_decode($raw, true) ?: $data;
    }

    if ($now - $data['window'] > 60) {
        $data = ['count' => 0, 'window' => $now];
    }

    $data['count']++;
    file_put_contents($file, json_encode($data), LOCK_EX);
    return $data['count'] <= RATE_LIMIT_RPM;
}

// ── Activity Log ─────────────────────────────────────────────
function logActivity(string $action, string $module, string $detail = '', ?int $userId = null): void {
    try {
        dbInsert(
            "INSERT INTO activity_log (user_id, action, module, detail, ip_address, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())",
            [$userId ?? ($_SESSION['user_id'] ?? null), $action, $module, $detail, getClientIp()]
        );
    } catch (Exception $e) {
        error_log('Log failed: ' . $e->getMessage());
    }
}

// ── File Upload ──────────────────────────────────────────────
function uploadFile(array $file, string $subDir = ''): array {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'msg' => 'خطأ في رفع الملف'];
    }

    $size = $file['size'] / 1024 / 1024;
    if ($size > MAX_FILE_MB) {
        return ['ok' => false, 'msg' => "الملف أكبر من الحد المسموح ({$size} MB > " . MAX_FILE_MB . ' MB)'];
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTS, true)) {
        return ['ok' => false, 'msg' => "نوع الملف غير مسموح: .{$ext}"];
    }

    // منع Path Traversal في subDir
    if ($subDir) {
        if (!preg_match('/^[a-zA-Z0-9_\-\/]+$/', $subDir) || str_contains($subDir, '..')) {
            return ['ok' => false, 'msg' => 'مسار الرفع غير صالح'];
        }
    }

    $dir = UPLOAD_DIR . ($subDir ? rtrim($subDir, '/') . '/' : '');
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $safeName = preg_replace('/[^a-z0-9_\-]/i', '_', pathinfo($file['name'], PATHINFO_FILENAME));
    $filename = date('Ymd_His') . '_' . substr($safeName, 0, 40) . '.' . $ext;
    $path     = $dir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $path)) {
        return ['ok' => false, 'msg' => 'فشل حفظ الملف'];
    }

    // استخدام finfo بدلاً من mime_content_type المتقادمة
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $path) ?: 'application/octet-stream';
    finfo_close($finfo);

    return [
        'ok'       => true,
        'filename' => $filename,
        'path'     => $path,
        'url'      => UPLOAD_URL . ($subDir ? $subDir . '/' : '') . $filename,
        'size'     => $file['size'],
        'mime'     => $mimeType,
        'ext'      => $ext,
    ];
}
