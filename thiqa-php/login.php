<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';

if (isLoggedIn()) redirect(APP_URL . '/dashboard.php');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!checkRateLimit('login')) {
        $error = '⚠️ تجاوزت الحد المسموح من المحاولات. انتظر دقيقة ثم أعد المحاولة.';
    } else {
        $username = sanitize($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        if (login($username, $password)) {
            redirect(APP_URL . '/dashboard.php');
        } else {
            $error = '❌ اسم المستخدم أو كلمة المرور غير صحيحة.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>تسجيل الدخول — <?= esc(APP_NAME) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cairo',sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.login-box{background:#fff;border-radius:20px;padding:44px 40px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.logo{text-align:center;margin-bottom:32px}
.logo-icon{font-size:52px;margin-bottom:8px}
.logo-title{font-size:22px;font-weight:900;color:#1e3a5f;margin-bottom:3px}
.logo-sub{font-size:12px;color:#64748b}
.form-group{margin-bottom:18px}
label{display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px}
input{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;color:#0f172a;background:#f8fafc;font-family:'Cairo',sans-serif;outline:none;transition:border-color .18s,box-shadow .18s}
input:focus{border-color:#d97706;background:#fff;box-shadow:0 0 0 3px rgba(217,119,6,.1)}
.btn{width:100%;padding:13px;background:linear-gradient(135deg,#1e3a5f,#2d5a9e);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif;transition:opacity .18s;margin-top:6px}
.btn:hover{opacity:.88}
.error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px;text-align:center}
.hint{text-align:center;font-size:11px;color:#94a3b8;margin-top:18px;line-height:1.7}
.hint code{background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:11px;color:#475569}
</style>
</head>
<body>
<div class="login-box">
  <div class="logo">
    <div class="logo-icon">🏢</div>
    <div class="logo-title"><?= esc(APP_NAME) ?></div>
    <div class="logo-sub">نظام إدارة الخدمات العامة</div>
  </div>

  <?php if ($error): ?>
  <div class="error"><?= esc($error) ?></div>
  <?php endif; ?>

  <form method="POST" autocomplete="off">
    <div class="form-group">
      <label for="username">👤 اسم المستخدم</label>
      <input type="text" id="username" name="username" placeholder="admin"
             value="<?= esc($_POST['username'] ?? '') ?>" required autofocus>
    </div>
    <div class="form-group">
      <label for="password">🔒 كلمة المرور</label>
      <input type="password" id="password" name="password" placeholder="••••••••" required>
    </div>
    <button type="submit" class="btn">🔐 تسجيل الدخول</button>
  </form>

  <div class="hint">
    تواصل مع مدير النظام للحصول على بيانات الدخول
  </div>
</div>
</body>
</html>
