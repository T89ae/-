<?php
/**
 * ================================================================
 *  نظام ثقة للخدمات العامة — PHP v2.0
 *  config/config.php
 * ================================================================
 */

// قاعدة البيانات — يفضل تعيينها عبر متغيرات البيئة (.env)
define('DB_HOST',    $_ENV['DB_HOST']    ?? getenv('DB_HOST')    ?: 'localhost');
define('DB_NAME',    $_ENV['DB_NAME']    ?? getenv('DB_NAME')    ?: 'thiqa_db');
define('DB_USER',    $_ENV['DB_USER']    ?? getenv('DB_USER')    ?: 'root');
define('DB_PASS',    $_ENV['DB_PASS']    ?? getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');

// النظام
define('APP_NAME',    'نظام ثقة للخدمات العامة');
define('APP_VERSION', '2.0.0');
define('APP_URL',     rtrim($_ENV['APP_URL'] ?? getenv('APP_URL') ?: 'http://localhost/thiqa', '/'));
define('APP_TIMEZONE','Asia/Riyadh');
define('APP_LOCALE',  'ar_SA.UTF-8');

// الملفات
define('UPLOAD_DIR',   __DIR__ . '/../uploads/');
define('UPLOAD_URL',   APP_URL . '/uploads/');
define('MAX_FILE_MB',  10);
// امتدادات الملفات المسموح بها
define('ALLOWED_EXTS', ['pdf','xlsx','xls','docx','doc','jpg','jpeg','png','gif','csv','txt']);

// Gemini AI
define('GEMINI_API_KEY',    $_ENV['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: '');
define('GEMINI_MODEL',      'gemini-2.0-flash');
define('GEMINI_MAX_TOKENS', 1500);

// الأمان
define('SESSION_LIFETIME', 7200);
define('BCRYPT_COST',      12);
define('RATE_LIMIT_RPM',   60);

// ── Bootstrap ───────────────────────────────────────────────────
date_default_timezone_set(APP_TIMEZONE);
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}
