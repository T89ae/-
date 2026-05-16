<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';
requireLogin();

$flash = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf()) { $flash = ['type'=>'error','msg'=>'CSRF error']; }
    else {
        $action = sanitize($_POST['action'] ?? '');
        if ($action === 'save_settings') {
            foreach (['office_name','office_phone','currency','date_format'] as $key) {
                if (isset($_POST[$key])) {
                    dbExec("INSERT INTO settings (key_name,key_value) VALUES (?,?) ON DUPLICATE KEY UPDATE key_value=?", [$key, sanitize($_POST[$key]), sanitize($_POST[$key])]);
                }
            }
            $flash = ['type'=>'success','msg'=>'✅ تم حفظ الإعدادات'];
        }
        if ($action === 'save_gemini_key') {
            $key = sanitize($_POST['gemini_key'] ?? '');
            dbExec("INSERT INTO settings (key_name,key_value) VALUES ('gemini_api_key',?) ON DUPLICATE KEY UPDATE key_value=?", [$key, $key]);
            $flash = ['type'=>'success','msg'=>'✅ تم حفظ مفتاح Gemini'];
            redirect(APP_URL . '/hulul.php');
        }
        if ($action === 'change_password') {
            $old = $_POST['old_pass'] ?? '';
            $new = $_POST['new_pass'] ?? '';
            $confirm = $_POST['confirm_pass'] ?? '';
            $user = dbFirst("SELECT * FROM users WHERE id=?", [currentUserId()]);
            if (!password_verify($old, $user['password'])) $flash = ['type'=>'error','msg'=>'كلمة المرور القديمة غير صحيحة'];
            elseif ($new !== $confirm) $flash = ['type'=>'error','msg'=>'كلمة المرور الجديدة غير متطابقة'];
            elseif (strlen($new) < 6) $flash = ['type'=>'error','msg'=>'كلمة المرور يجب أن تكون 6 أحرف على الأقل'];
            else { dbExec("UPDATE users SET password=? WHERE id=?", [hashPassword($new), currentUserId()]); $flash = ['type'=>'success','msg'=>'✅ تم تغيير كلمة المرور']; }
        }
    }
}

$settings = [];
foreach (dbQuery("SELECT key_name, key_value FROM settings") as $row) {
    $settings[$row['key_name']] = $row['key_value'];
}

ob_start(); ?>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <!-- Office Settings -->
  <div class="card">
    <div class="card-title">🏢 إعدادات المكتب</div>
    <form method="POST">
      <input type="hidden" name="_csrf" value="<?= esc(csrfToken()) ?>">
      <input type="hidden" name="action" value="save_settings">
      <div class="form-group"><label>اسم المكتب</label><input type="text" name="office_name" class="form-control" value="<?= esc($settings['office_name']??'') ?>"></div>
      <div class="form-group"><label>رقم الهاتف</label><input type="tel" name="office_phone" class="form-control" value="<?= esc($settings['office_phone']??'') ?>"></div>
      <div class="form-group"><label>العملة</label><input type="text" name="currency" class="form-control" value="<?= esc($settings['currency']??'ر.س') ?>"></div>
      <button type="submit" class="btn btn-gold">💾 حفظ</button>
    </form>
  </div>

  <!-- Gemini API -->
  <div class="card">
    <div class="card-title">🤖 إعدادات الذكاء الاصطناعي</div>
    <form method="POST">
      <input type="hidden" name="_csrf" value="<?= esc(csrfToken()) ?>">
      <input type="hidden" name="action" value="save_gemini_key">
      <div class="form-group">
        <label>🔑 مفتاح Gemini API</label>
        <input type="password" name="gemini_key" class="form-control" value="<?= esc($settings['gemini_api_key']??'') ?>" placeholder="AIzaSy...">
        <div class="form-hint">احصل على مفتاحك مجاناً من <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--gold)">Google AI Studio</a></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span>الحالة:</span>
        <?php if (!empty($settings['gemini_api_key'])): ?>
        <span class="badge badge-green">✅ مفعّل</span>
        <?php else: ?>
        <span class="badge badge-muted">❌ غير مضبوط</span>
        <?php endif; ?>
      </div>
      <button type="submit" class="btn btn-gold">💾 حفظ المفتاح</button>
    </form>
  </div>

  <!-- Change Password -->
  <div class="card">
    <div class="card-title">🔒 تغيير كلمة المرور</div>
    <form method="POST">
      <input type="hidden" name="_csrf" value="<?= esc(csrfToken()) ?>">
      <input type="hidden" name="action" value="change_password">
      <div class="form-group"><label>كلمة المرور الحالية</label><input type="password" name="old_pass" class="form-control" required></div>
      <div class="form-group"><label>كلمة المرور الجديدة</label><input type="password" name="new_pass" class="form-control" required minlength="6"></div>
      <div class="form-group"><label>تأكيد كلمة المرور</label><input type="password" name="confirm_pass" class="form-control" required></div>
      <button type="submit" class="btn btn-primary">🔒 تغيير كلمة المرور</button>
    </form>
  </div>

  <!-- System Info -->
  <div class="card">
    <div class="card-title">ℹ️ معلومات النظام</div>
    <table style="font-size:13px">
      <tr><td style="padding:6px 0;color:var(--muted)">الإصدار:</td><td style="font-weight:700"><?= APP_VERSION ?></td></tr>
      <tr><td style="padding:6px 0;color:var(--muted)">PHP:</td><td><?= PHP_VERSION ?></td></tr>
      <tr><td style="padding:6px 0;color:var(--muted)">قاعدة البيانات:</td><td><?= DB_NAME ?></td></tr>
      <tr><td style="padding:6px 0;color:var(--muted)">المستخدم:</td><td><?= esc(currentUser()['name']??'') ?></td></tr>
    </table>
  </div>
</div>

<?php
$body = ob_get_clean();
renderPage('settings', 'الإعدادات', $body, ['flash' => $flash]);
