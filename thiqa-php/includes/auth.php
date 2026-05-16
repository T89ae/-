<?php
/**
 * includes/auth.php — نظام المصادقة
 */

function isLoggedIn(): bool {
    if (empty($_SESSION['user_id']) || empty($_SESSION['last_activity'])) {
        return false;
    }
    // تحقق من انتهاء الجلسة من جانب السيرفر وتدميرها
    if ((time() - $_SESSION['last_activity']) >= SESSION_LIFETIME) {
        session_unset();
        session_destroy();
        return false;
    }
    return true;
}

function currentUser(): array {
    return $_SESSION['user'] ?? [];
}

function currentUserId(): ?int {
    return $_SESSION['user_id'] ?? null;
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        if (isAjax()) {
            json(['error' => 'غير مصرح. يرجى تسجيل الدخول.', 'redirect' => '/login.php'], 401);
        }
        redirect(APP_URL . '/login.php');
    }
    $_SESSION['last_activity'] = time();
}

/** يقبل أدواراً متعددة: requireRole('admin','manager') */
function requireRole(string ...$roles): void {
    requireLogin();
    $userRole = currentUser()['role'] ?? '';
    if (!in_array($userRole, $roles, true)) {
        json(['error' => 'ليس لديك صلاحية لهذه العملية'], 403);
    }
}

function login(string $username, string $password): bool {
    $user = dbFirst(
        "SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1",
        [strtolower(trim($username))]
    );

    if (!$user || !password_verify($password, $user['password'])) {
        logActivity('فشل تسجيل الدخول', 'auth', $username, null);
        return false;
    }

    // تجديد معرف الجلسة — يمنع Session Fixation Attack
    session_regenerate_id(true);

    dbExec("UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?", [$user['id']]);

    $_SESSION['user_id']       = $user['id'];
    $_SESSION['user']          = $user;
    $_SESSION['last_activity'] = time();
    $_SESSION['csrf_token']    = bin2hex(random_bytes(32));

    logActivity('تسجيل دخول', 'auth', "الدور: {$user['role']}", $user['id']);
    return true;
}

function logout(): void {
    logActivity('تسجيل خروج', 'auth', '', currentUserId());
    session_unset();
    session_destroy();
    redirect(APP_URL . '/login.php');
}

function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}
