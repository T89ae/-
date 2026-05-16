<?php
/**
 * api/index.php — Unified API Router
 * Route: /api/?module=workers&action=list
 */
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json; charset=UTF-8');
requireLogin();

if (!checkRateLimit()) json(['error' => 'Rate limit exceeded'], 429);

// حد حجم الـ body المقبول (1 MB)
$rawInput = '';
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) <= 1048576) {
    $rawInput = file_get_contents('php://input');
}

// CSRF check لجميع العمليات التي تغير البيانات (POST / PUT / DELETE / PATCH)
$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
    if (!verifyCsrf()) json(['error' => 'CSRF token mismatch'], 403);
}

$module = sanitize($_GET['module'] ?? '');
$action = sanitize($_GET['action'] ?? 'list');
$body   = json_decode($rawInput, true) ?? [];
$params = array_merge($_GET, $_POST, $body);

try {
    switch ($module) {

    // ══════════════════════════════════════════════
    // WORKERS
    // ══════════════════════════════════════════════
    case 'workers':
        if ($action === 'list') {
            $search  = sanitize($params['search'] ?? '');
            $status  = sanitize($params['status'] ?? '');
            $page    = max(1, (int)($params['page'] ?? 1));
            $perPage = max(1, min(100, (int)($params['per_page'] ?? 20)));

            $baseSql = "SELECT w.*, s.name AS sponsor_name FROM workers w LEFT JOIN sponsors s ON w.sponsor_id = s.id WHERE 1=1";
            $args    = [];
            if ($search) {
                $baseSql .= " AND (w.name LIKE ? OR w.phone LIKE ? OR w.iqama_number LIKE ?)";
                $args = array_merge($args, ["%$search%", "%$search%", "%$search%"]);
            }
            if ($status) {
                $baseSql .= " AND w.status = ?";
                $args[] = $status;
            }

            // COUNT منفصل بدون ORDER BY لضمان الدقة
            $total = dbCount($baseSql, $args);
            $rows  = dbQuery($baseSql . " ORDER BY w.created_at DESC LIMIT {$perPage} OFFSET " . (($page - 1) * $perPage), $args);
            json(['data' => $rows, 'total' => $total, 'page' => $page]);
        }

        if ($action === 'save') {
            $errors = validateRequired(['name' => 'الاسم'], $params);
            if ($errors) json(['errors' => $errors], 422);

            $salary     = (float)($params['salary'] ?? 0);
            $commission = (float)($params['commission'] ?? 0);
            if ($salary < 0)     json(['error' => 'الراتب لا يمكن أن يكون سالباً'], 422);
            if ($commission < 0) json(['error' => 'العمولة لا يمكن أن تكون سالبة'], 422);

            $data = [
                sanitize($params['name'] ?? ''),
                cleanPhone(sanitize($params['phone'] ?? '')),
                sanitize($params['nationality'] ?? ''),
                !empty($params['sponsor_id']) ? (int)$params['sponsor_id'] : null,
                sanitize($params['iqama_number'] ?? ''),
                $params['iqama_expiry'] ?: null,
                sanitize($params['passport_number'] ?? ''),
                $params['passport_expiry'] ?: null,
                $salary,
                $commission,
                sanitize($params['marketer'] ?? ''),
                in_array($params['status'] ?? '', ['active','inactive','transferred','final_exit']) ? $params['status'] : 'active',
                sanitize($params['note'] ?? ''),
                currentUserId(),
            ];

            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE workers SET name=?,phone=?,nationality=?,sponsor_id=?,iqama_number=?,iqama_expiry=?,passport_number=?,passport_expiry=?,salary=?,commission=?,marketer=?,status=?,note=?,created_by=? WHERE id=?", $data);
                logActivity('تعديل عامل', 'workers', $params['name'] ?? '');
                json(['ok' => true, 'msg' => 'تم تعديل العامل بنجاح']);
            } else {
                $id = dbInsert("INSERT INTO workers (name,phone,nationality,sponsor_id,iqama_number,iqama_expiry,passport_number,passport_expiry,salary,commission,marketer,status,note,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", $data);
                logActivity('إضافة عامل', 'workers', $params['name'] ?? '');
                json(['ok' => true, 'msg' => 'تم إضافة العامل بنجاح', 'id' => $id]);
            }
        }

        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            $worker = dbFirst("SELECT name FROM workers WHERE id = ?", [$id]);
            if (!$worker) json(['error' => 'العامل غير موجود'], 404);
            dbExec("DELETE FROM workers WHERE id = ?", [$id]);
            logActivity('حذف عامل', 'workers', $worker['name'] ?? '');
            json(['ok' => true, 'msg' => 'تم الحذف']);
        }
        break;

    // ══════════════════════════════════════════════
    // SPONSORS
    // ══════════════════════════════════════════════
    case 'sponsors':
        if ($action === 'list') {
            $search = sanitize($params['search'] ?? '');
            $sql    = "SELECT *, (SELECT COUNT(*) FROM workers WHERE sponsor_id = sponsors.id) AS worker_count FROM sponsors WHERE is_active = 1";
            $args   = [];
            if ($search) { $sql .= " AND (name LIKE ? OR phone LIKE ?)"; $args = ["%$search%", "%$search%"]; }
            $sql .= " ORDER BY name";
            json(['data' => dbQuery($sql, $args)]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['name' => 'الاسم'], $params);
            if ($errors) json(['errors' => $errors], 422);

            $data = [sanitize($params['name']), cleanPhone(sanitize($params['phone'] ?? '')), sanitize($params['national_id'] ?? ''), sanitize($params['iban'] ?? ''), sanitize($params['note'] ?? ''), currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE sponsors SET name=?,phone=?,national_id=?,iban=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true, 'msg' => 'تم التعديل']);
            } else {
                $id = dbInsert("INSERT INTO sponsors (name,phone,national_id,iban,note,created_by) VALUES (?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id, 'msg' => 'تم إضافة الكفيل']);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("UPDATE sponsors SET is_active = 0 WHERE id = ?", [$id]);
            logActivity('حذف كفيل', 'sponsors', (string)$id);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // TRANSFERS
    // ══════════════════════════════════════════════
    case 'transfers':
        if ($action === 'list') {
            $status = sanitize($params['status'] ?? '');
            $sql    = "SELECT t.*, w.name AS worker_name_rel FROM transfers t LEFT JOIN workers w ON t.worker_id = w.id WHERE 1=1";
            $args   = [];
            if ($status && $status !== 'all') { $sql .= " AND t.status = ?"; $args[] = $status; }
            $sql .= " ORDER BY t.transfer_date DESC, t.created_at DESC LIMIT 200";
            $rows = dbQuery($sql, $args);

            // إصلاح SQL Injection — استخدام parameterized query
            $totSql  = "SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS total, COALESCE(SUM(fee),0) AS fees FROM transfers";
            $totArgs = [];
            if ($status && $status !== 'all') { $totSql .= " WHERE status = ?"; $totArgs[] = $status; }
            $totals = dbFirst($totSql, $totArgs);
            json(['data' => $rows, 'totals' => $totals]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['amount' => 'المبلغ'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $amount = (float)($params['amount'] ?? 0);
            if ($amount <= 0) json(['error' => 'المبلغ يجب أن يكون أكبر من صفر'], 422);

            $data = [
                !empty($params['worker_id']) ? (int)$params['worker_id'] : null,
                sanitize($params['worker_name'] ?? ''),
                $amount,
                (float)($params['fee'] ?? 0),
                sanitize($params['method'] ?? ''),
                sanitize($params['reference_no'] ?? ''),
                $params['transfer_date'] ?: today(),
                in_array($params['status'] ?? '', ['pending','sent','cancelled']) ? $params['status'] : 'pending',
                sanitize($params['note'] ?? ''),
                currentUserId(),
            ];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE transfers SET worker_id=?,worker_name=?,amount=?,fee=?,method=?,reference_no=?,transfer_date=?,status=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true, 'msg' => 'تم التعديل']);
            } else {
                $id = dbInsert("INSERT INTO transfers (worker_id,worker_name,amount,fee,method,reference_no,transfer_date,status,note,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)", $data);
                $workerLabel = sanitize($params['worker_name'] ?? '') . ' - ' . $amount . ' ر.س';
                logActivity('إضافة حوالة', 'transfers', $workerLabel);
                json(['ok' => true, 'id' => $id, 'msg' => 'تم إضافة الحوالة']);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM transfers WHERE id = ?", [$id]);
            logActivity('حذف حوالة', 'transfers', (string)$id);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // SALES
    // ══════════════════════════════════════════════
    case 'sales':
        if ($action === 'list') {
            $sql  = "SELECT * FROM sales WHERE 1=1";
            $args = [];
            $from = sanitize($params['from'] ?? '');
            $to   = sanitize($params['to'] ?? '');
            // التحقق من نطاق التاريخ
            if ($from && $to && $from > $to) json(['error' => 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية'], 422);
            if ($from) { $sql .= " AND sale_date >= ?"; $args[] = $from; }
            if ($to)   { $sql .= " AND sale_date <= ?"; $args[] = $to; }
            $sql .= " ORDER BY sale_date DESC, created_at DESC LIMIT 500";
            $rows   = dbQuery($sql, $args);
            $totals = dbFirst("SELECT COALESCE(SUM(total),0) AS total_amount, COUNT(*) AS cnt FROM sales");
            json(['data' => $rows, 'totals' => $totals]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['item_name' => 'اسم الصنف', 'unit_price' => 'السعر'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $qty   = max(0, (float)($params['quantity']  ?? 1));
            $price = (float)($params['unit_price'] ?? 0);
            if ($price < 0) json(['error' => 'السعر لا يمكن أن يكون سالباً'], 422);
            $total = $qty * $price;
            $data  = [sanitize($params['item_name']), $qty, $price, $total, sanitize($params['customer_name'] ?? ''), in_array($params['payment_method'] ?? '', ['cash','bank','transfer','credit']) ? $params['payment_method'] : 'cash', $params['sale_date'] ?: today(), sanitize($params['note'] ?? ''), currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE sales SET item_name=?,quantity=?,unit_price=?,total=?,customer_name=?,payment_method=?,sale_date=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true, 'msg' => 'تم التعديل']);
            } else {
                $id = dbInsert("INSERT INTO sales (item_name,quantity,unit_price,total,customer_name,payment_method,sale_date,note,created_by) VALUES (?,?,?,?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id, 'msg' => 'تم تسجيل البيع']);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM sales WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // EXPENSES
    // ══════════════════════════════════════════════
    case 'expenses':
        if ($action === 'list') {
            $rows   = dbQuery("SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC LIMIT 500");
            $totals = dbFirst("SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt FROM expenses");
            json(['data' => $rows, 'totals' => $totals]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['description' => 'الوصف', 'amount' => 'المبلغ'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $amount = (float)($params['amount'] ?? 0);
            if ($amount < 0) json(['error' => 'المبلغ لا يمكن أن يكون سالباً'], 422);
            $data = [sanitize($params['category'] ?? ''), sanitize($params['description']), $amount, in_array($params['payment_method'] ?? '', ['cash','bank','transfer','credit']) ? $params['payment_method'] : 'cash', sanitize($params['vendor'] ?? ''), $params['expense_date'] ?: today(), sanitize($params['note'] ?? ''), currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE expenses SET category=?,description=?,amount=?,payment_method=?,vendor=?,expense_date=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO expenses (category,description,amount,payment_method,vendor,expense_date,note,created_by) VALUES (?,?,?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id, 'msg' => 'تم تسجيل المصروف']);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM expenses WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // TASKS
    // ══════════════════════════════════════════════
    case 'tasks':
        if ($action === 'list') {
            $status = sanitize($params['status'] ?? '');
            $sql    = "SELECT * FROM tasks WHERE 1=1";
            $args   = [];
            if ($status) { $sql .= " AND status = ?"; $args[] = $status; }
            // ترتيب الأولوية عبر CASE بدلاً من FIELD() لضمان التوافق
            $sql .= " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, due_date ASC";
            json(['data' => dbQuery($sql, $args)]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['title' => 'العنوان'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $data = [sanitize($params['title']), sanitize($params['description'] ?? ''), sanitize($params['assigned_to'] ?? ''), in_array($params['priority'] ?? '', ['low','medium','high','urgent']) ? $params['priority'] : 'medium', in_array($params['status'] ?? '', ['pending','in_progress','done']) ? $params['status'] : 'pending', $params['due_date'] ?: null, currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE tasks SET title=?,description=?,assigned_to=?,priority=?,status=?,due_date=?,created_by=? WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO tasks (title,description,assigned_to,priority,status,due_date,created_by) VALUES (?,?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id]);
            }
        }
        if ($action === 'complete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("UPDATE tasks SET status='done', completed_at=NOW() WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM tasks WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // BROKERS
    // ══════════════════════════════════════════════
    case 'brokers':
        if ($action === 'list') {
            json(['data' => dbQuery("SELECT * FROM brokers ORDER BY created_at DESC")]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['name' => 'الاسم'], $params);
            if ($errors) json(['errors' => $errors], 422);

            $email = sanitize($params['email'] ?? '');
            if ($email && !isValidEmail($email)) json(['error' => 'البريد الإلكتروني غير صالح'], 422);

            $data = [sanitize($params['name']), cleanPhone(sanitize($params['phone'] ?? '')), sanitize($params['national_id'] ?? ''), $email, sanitize($params['specialty'] ?? ''), sanitize($params['note'] ?? ''), currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE brokers SET name=?,phone=?,national_id=?,email=?,specialty=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO brokers (name,phone,national_id,email,specialty,note,created_by) VALUES (?,?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id]);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM brokers WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // BROKER ENTITLEMENTS
    // ══════════════════════════════════════════════
    case 'entitlements':
        dbExec("UPDATE broker_entitlements SET status='late' WHERE status='unpaid' AND due_date < CURDATE()");
        if ($action === 'list') {
            $brokerId = (int)($params['broker_id'] ?? 0);
            $sql      = "SELECT e.*, b.name AS broker_name FROM broker_entitlements e JOIN brokers b ON e.broker_id = b.id WHERE 1=1";
            $args     = [];
            if ($brokerId) { $sql .= " AND e.broker_id = ?"; $args[] = $brokerId; }
            $sql .= " ORDER BY e.due_date ASC";
            json(['data' => dbQuery($sql, $args)]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['broker_id' => 'الوسيط', 'amount' => 'المبلغ'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $amount = (float)($params['amount'] ?? 0);
            if ($amount < 0) json(['error' => 'المبلغ لا يمكن أن يكون سالباً'], 422);
            $data = [(int)$params['broker_id'], sanitize($params['type'] ?? ''), $amount, $params['due_date'] ?: null, in_array($params['status'] ?? '', ['unpaid','paid','late']) ? $params['status'] : 'unpaid', sanitize($params['note'] ?? '')];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE broker_entitlements SET broker_id=?,type=?,amount=?,due_date=?,status=?,note=? WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO broker_entitlements (broker_id,type,amount,due_date,status,note) VALUES (?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id]);
            }
        }
        if ($action === 'pay') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("UPDATE broker_entitlements SET status='paid', paid_at=CURDATE() WHERE id=?", [$id]);
            json(['ok' => true, 'msg' => 'تم تسجيل الدفع']);
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM broker_entitlements WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // CUSTOMERS
    // ══════════════════════════════════════════════
    case 'customers':
        if ($action === 'list') {
            $search = sanitize($params['search'] ?? '');
            $type   = sanitize($params['type'] ?? '');
            $sql    = "SELECT * FROM customers WHERE 1=1";
            $args   = [];
            if ($search) { $sql .= " AND (name LIKE ? OR phone LIKE ?)"; $args = ["%$search%", "%$search%"]; }
            if ($type)   { $sql .= " AND type = ?"; $args[] = $type; }
            $sql .= " ORDER BY created_at DESC LIMIT 500";
            json(['data' => dbQuery($sql, $args)]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['name' => 'الاسم'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $email = sanitize($params['email'] ?? '');
            if ($email && !isValidEmail($email)) json(['error' => 'البريد الإلكتروني غير صالح'], 422);
            $data = [sanitize($params['name']), cleanPhone(sanitize($params['phone'] ?? '')), in_array($params['type'] ?? '', ['worker','sponsor','middleman','client','other']) ? $params['type'] : 'client', sanitize($params['city'] ?? ''), $email, sanitize($params['note'] ?? ''), currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE customers SET name=?,phone=?,type=?,city=?,email=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO customers (name,phone,type,city,email,note,created_by) VALUES (?,?,?,?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id]);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM customers WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // SERVICE REQUESTS (Hulul Agent)
    // ══════════════════════════════════════════════
    case 'service_requests':
        if ($action === 'list') {
            $status = sanitize($params['status'] ?? '');
            $sql    = "SELECT sr.*, u.name AS assigned_name FROM service_requests sr LEFT JOIN users u ON sr.assigned_to = u.id WHERE 1=1";
            $args   = [];
            if ($status) { $sql .= " AND sr.status = ?"; $args[] = $status; }
            $sql   .= " ORDER BY sr.created_at DESC LIMIT 200";
            $rows   = dbQuery($sql, $args);
            $counts = dbFirst("SELECT COUNT(*) AS total, SUM(status='pending') AS pending, SUM(status='in_progress') AS in_progress, SUM(status='done') AS done FROM service_requests");
            json(['data' => $rows, 'counts' => $counts]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['service_type' => 'نوع الخدمة', 'client_name' => 'اسم العميل'], $params);
            if ($errors) json(['errors' => $errors], 422);

            $services = ['visa'=>'تأشيرة عمل','iqama'=>'تجديد الإقامة','transfer'=>'نقل الكفالة','contract'=>'عقد إيجار','exit_reentry'=>'تأشيرة خروج وعودة','final_exit'=>'خروج نهائي','muqeem'=>'خدمات مقيم','absher'=>'خدمات أبشر','musaned'=>'مساند','other'=>'معاملة أخرى'];
            $svcType  = sanitize($params['service_type']);
            $svcLabel = $services[$svcType] ?? 'معاملة أخرى';
            $icons    = ['visa'=>'🛂','iqama'=>'📋','transfer'=>'🔄','contract'=>'🏠','exit_reentry'=>'✈️','final_exit'=>'🚪','muqeem'=>'🖥️','absher'=>'📱','musaned'=>'🤝','other'=>'📁'];

            if (!empty($params['id'])) {
                dbExec("UPDATE service_requests SET service_type=?,service_label=?,client_name=?,client_phone=?,priority=?,status=?,notes=?,updated_at=NOW() WHERE id=?",
                    [$svcType, $svcLabel, sanitize($params['client_name']), cleanPhone(sanitize($params['client_phone'] ?? '')), in_array($params['priority'] ?? '', ['normal','urgent']) ? $params['priority'] : 'normal', in_array($params['status'] ?? '', ['pending','in_progress','done','cancelled']) ? $params['status'] : 'pending', sanitize($params['notes'] ?? ''), (int)$params['id']]);
                json(['ok' => true]);
            } else {
                $code = 'REQ-' . strtoupper(substr(md5(uniqid('', true)), 0, 6));
                $id   = dbInsert("INSERT INTO service_requests (request_code,service_type,service_label,service_icon,client_name,client_phone,priority,status,notes,from_agent,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    [$code, $svcType, $svcLabel, $icons[$svcType] ?? '📁', sanitize($params['client_name']), cleanPhone(sanitize($params['client_phone'] ?? '')), in_array($params['priority'] ?? '', ['normal','urgent']) ? $params['priority'] : 'normal', 'pending', sanitize($params['notes'] ?? ''), (int)($params['from_agent'] ?? 0), currentUserId()]);
                logActivity('إنشاء طلب خدمة', 'service_requests', $code . ' | ' . $svcLabel . ' | ' . $params['client_name']);
                json(['ok' => true, 'id' => $id, 'code' => $code, 'msg' => "✅ تم إنشاء الطلب — رقم: $code"]);
            }
        }
        if ($action === 'update_status') {
            $id     = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            $status = in_array($params['status'] ?? '', ['pending','in_progress','done','cancelled']) ? $params['status'] : 'pending';
            $extra  = $status === 'done' ? ", completed_at=NOW()" : '';
            dbExec("UPDATE service_requests SET status=?, updated_at=NOW()$extra WHERE id=?", [$status, $id]);
            json(['ok' => true]);
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM service_requests WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // AGENTS
    // ══════════════════════════════════════════════
    case 'agents':
        if ($action === 'list') {
            $rows = dbQuery("SELECT a.*, COUNT(ar.id) AS request_count, COALESCE(SUM(ar.debt),0) AS total_debt FROM agents a LEFT JOIN agent_requests ar ON a.id = ar.agent_id GROUP BY a.id ORDER BY a.created_at DESC");
            json(['data' => $rows]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['name' => 'الاسم'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $data = [sanitize($params['name']), cleanPhone(sanitize($params['phone'] ?? '')), sanitize($params['note'] ?? ''), currentUserId()];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE agents SET name=?,phone=?,note=?,created_by=? WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO agents (name,phone,note,created_by) VALUES (?,?,?,?)", $data);
                json(['ok' => true, 'id' => $id]);
            }
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM agents WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // AGENT REQUESTS
    // ══════════════════════════════════════════════
    case 'agent_requests':
        if ($action === 'list') {
            $agentId = (int)($params['agent_id'] ?? 0);
            $sql     = "SELECT ar.*, a.name AS agent_name FROM agent_requests ar JOIN agents a ON ar.agent_id = a.id WHERE 1=1";
            $args    = [];
            if ($agentId) { $sql .= " AND ar.agent_id = ?"; $args[] = $agentId; }
            if (!empty($params['debts_only'])) { $sql .= " AND ar.debt > 0"; }
            $sql .= " ORDER BY ar.created_at DESC";
            json(['data' => dbQuery($sql, $args)]);
        }
        if ($action === 'save') {
            $errors = validateRequired(['agent_id' => 'المتابع', 'description' => 'الوصف'], $params);
            if ($errors) json(['errors' => $errors], 422);
            $paid  = (float)($params['paid_amount'] ?? 0);
            $price = (float)($params['wholesale_price'] ?? 0);
            // إصلاح حساب الدين — يُسمح بالقيمة الفعلية حتى السالبة (دفع زائد)
            $debt  = $price - $paid;
            $data  = [(int)$params['agent_id'], sanitize($params['client_name'] ?? ''), cleanPhone(sanitize($params['client_phone'] ?? '')), sanitize($params['description']), $paid, $price, $debt, sanitize($params['note'] ?? '')];
            if (!empty($params['id'])) {
                $data[] = (int)$params['id'];
                dbExec("UPDATE agent_requests SET agent_id=?,client_name=?,client_phone=?,description=?,paid_amount=?,wholesale_price=?,debt=?,note=?,updated_at=NOW() WHERE id=?", $data);
                json(['ok' => true]);
            } else {
                $id = dbInsert("INSERT INTO agent_requests (agent_id,client_name,client_phone,description,paid_amount,wholesale_price,debt,note) VALUES (?,?,?,?,?,?,?,?)", $data);
                if (!empty($params['client_name'])) {
                    $exists = dbFirst("SELECT id FROM customers WHERE name=? LIMIT 1", [sanitize($params['client_name'])]);
                    if (!$exists) dbInsert("INSERT INTO customers (name,phone,type,note,created_by) VALUES (?,?,'client','من طلب متابع',?)", [sanitize($params['client_name']), cleanPhone(sanitize($params['client_phone'] ?? '')), currentUserId()]);
                }
                json(['ok' => true, 'id' => $id, 'debt' => $debt]);
            }
        }
        if ($action === 'pay') {
            $id  = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            $req = dbFirst("SELECT * FROM agent_requests WHERE id=?", [$id]);
            if ($req) dbExec("UPDATE agent_requests SET paid_amount=wholesale_price, debt=0, paid_at=CURDATE(), updated_at=NOW() WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        if ($action === 'delete') {
            $id = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            dbExec("DELETE FROM agent_requests WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // ACTIVITY LOG
    // ══════════════════════════════════════════════
    case 'activity_log':
        if ($action === 'list') {
            $logModule = sanitize($params['module'] ?? '');
            $from      = sanitize($params['from'] ?? '');
            $to        = sanitize($params['to'] ?? '');
            $search    = sanitize($params['search'] ?? '');
            $page      = max(1, (int)($params['page'] ?? 1));
            $perPage   = max(1, min(100, (int)($params['per_page'] ?? 50)));

            $sql  = "SELECT al.*, u.name AS user_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1";
            $args = [];
            if ($logModule) { $sql .= " AND al.module = ?"; $args[] = $logModule; }
            if ($from)      { $sql .= " AND DATE(al.created_at) >= ?"; $args[] = $from; }
            if ($to)        { $sql .= " AND DATE(al.created_at) <= ?"; $args[] = $to; }
            if ($search)    { $sql .= " AND (al.action LIKE ? OR al.detail LIKE ?)"; $args[] = "%$search%"; $args[] = "%$search%"; }
            $sql .= " ORDER BY al.created_at DESC";

            $total = dbCount($sql, $args);
            $rows  = dbQuery($sql . " LIMIT {$perPage} OFFSET " . (($page - 1) * $perPage), $args);
            json(['data' => $rows, 'total' => $total, 'page' => $page]);
        }
        break;

    // ══════════════════════════════════════════════
    // STATS (Dashboard)
    // ══════════════════════════════════════════════
    case 'stats':
        $workers   = (int)(dbFirst("SELECT COUNT(*) AS c FROM workers WHERE status='active'")['c'] ?? 0);
        $sponsors  = (int)(dbFirst("SELECT COUNT(*) AS c FROM sponsors WHERE is_active=1")['c'] ?? 0);
        $clients   = (int)(dbFirst("SELECT COUNT(*) AS c FROM customers")['c'] ?? 0);
        $transfers = dbFirst("SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS t FROM transfers WHERE MONTH(transfer_date)=MONTH(CURDATE()) AND YEAR(transfer_date)=YEAR(CURDATE())");
        $sales     = (float)(dbFirst("SELECT COALESCE(SUM(total),0) AS t FROM sales WHERE MONTH(sale_date)=MONTH(CURDATE()) AND YEAR(sale_date)=YEAR(CURDATE())")['t'] ?? 0);
        $expenses  = (float)(dbFirst("SELECT COALESCE(SUM(amount),0) AS t FROM expenses WHERE MONTH(expense_date)=MONTH(CURDATE()) AND YEAR(expense_date)=YEAR(CURDATE())")['t'] ?? 0);
        $tasks_p   = (int)(dbFirst("SELECT COUNT(*) AS c FROM tasks WHERE status != 'done'")['c'] ?? 0);
        $late_ents = (int)(dbFirst("SELECT COUNT(*) AS c FROM broker_entitlements WHERE status='late'")['c'] ?? 0);
        $req_p     = (int)(dbFirst("SELECT COUNT(*) AS c FROM service_requests WHERE status='pending'")['c'] ?? 0);
        $debts     = (float)(dbFirst("SELECT COALESCE(SUM(debt),0) AS t FROM agent_requests WHERE debt > 0")['t'] ?? 0);

        json([
            'workers'          => $workers,
            'sponsors'         => $sponsors,
            'clients'          => $clients,
            'transfers'        => $transfers,
            'sales'            => $sales,
            'expenses'         => $expenses,
            'profit'           => $sales - $expenses,
            'tasks_pending'    => $tasks_p,
            'late_ents'        => $late_ents,
            'requests_pending' => $req_p,
            'total_debt'       => $debts,
        ]);
        break;

    // ══════════════════════════════════════════════
    // GEMINI / HULUL PROXY
    // ══════════════════════════════════════════════
    case 'gemini':
        $key = GEMINI_API_KEY ?: (dbFirst("SELECT key_value FROM settings WHERE key_name='gemini_api_key'")['key_value'] ?? '');
        if (!$key) json(['error' => 'مفتاح Gemini API غير مضبوط'], 500);

        $contents = $body['contents'] ?? [];
        $sysInstr = $body['system_instruction'] ?? null;
        $model    = preg_replace('/[^a-z0-9\-\.]/', '', $body['model'] ?? GEMINI_MODEL);

        if (empty($contents)) json(['error' => 'محتوى الرسالة مطلوب'], 400);

        // إصلاح scope — جلب البيانات هنا بدلاً من الاعتماد على متغيرات غير معرفة
        $liveWorkers = (int)(dbFirst("SELECT COUNT(*) AS c FROM workers WHERE status='active'")['c'] ?? 0);
        $liveClients = (int)(dbFirst("SELECT COUNT(*) AS c FROM customers")['c'] ?? 0);
        $liveReqP    = (int)(dbFirst("SELECT COUNT(*) AS c FROM service_requests WHERE status='pending'")['c'] ?? 0);
        $liveData    = "بيانات النظام: عمال نشطون={$liveWorkers}, عملاء={$liveClients}, طلبات معلقة={$liveReqP}";

        if ($sysInstr) {
            $sysInstr['parts'][0]['text'] = ($sysInstr['parts'][0]['text'] ?? '') . "\n" . $liveData;
        } else {
            $sysInstr = ['parts' => [['text' => $liveData]]];
        }

        $payload = json_encode([
            'system_instruction' => $sysInstr,
            'contents'           => $contents,
            'generationConfig'   => ['temperature' => 0.4, 'maxOutputTokens' => GEMINI_MAX_TOKENS],
        ]);

        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $result   = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) json(['error' => 'خطأ في الاتصال بـ Gemini'], 502);
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo $result;
        exit;

    // ══════════════════════════════════════════════
    // FILES UPLOAD
    // ══════════════════════════════════════════════
    case 'files':
        if ($action === 'list') {
            json(['data' => dbQuery("SELECT * FROM uploaded_files ORDER BY uploaded_at DESC LIMIT 200")]);
        }
        if ($action === 'upload' && isset($_FILES['file'])) {
            $upload = uploadFile($_FILES['file']);
            if (!$upload['ok']) json(['error' => $upload['msg']], 422);
            $id = dbInsert("INSERT INTO uploaded_files (display_name,file_name,file_path,file_size,mime_type,category,note,created_by) VALUES (?,?,?,?,?,?,?,?)",
                [sanitize($params['display_name'] ?? $_FILES['file']['name']), $upload['filename'], $upload['path'], $upload['size'], $upload['mime'], sanitize($params['category'] ?? ''), sanitize($params['note'] ?? ''), currentUserId()]);
            json(['ok' => true, 'id' => $id, 'url' => $upload['url'], 'filename' => $upload['filename']]);
        }
        if ($action === 'delete') {
            $id   = (int)($params['id'] ?? 0);
            if (!$id) json(['error' => 'معرف غير صحيح'], 422);
            $file = dbFirst("SELECT * FROM uploaded_files WHERE id=?", [$id]);
            if ($file && file_exists($file['file_path'])) {
                unlink($file['file_path']);
            }
            dbExec("DELETE FROM uploaded_files WHERE id=?", [$id]);
            json(['ok' => true]);
        }
        break;

    // ══════════════════════════════════════════════
    // IMPORT HISTORY
    // ══════════════════════════════════════════════
    case 'import_history':
        if ($action === 'save') {
            dbInsert("INSERT INTO import_history (filename,total,imported,duplicates,skipped,created_by) VALUES (?,?,?,?,?,?)",
                [sanitize($params['filename'] ?? 'ملف مستورد'), (int)($params['total'] ?? 0), (int)($params['imported'] ?? 0), (int)($params['duplicates'] ?? 0), (int)($params['skipped'] ?? 0), currentUserId()]);
            json(['ok' => true]);
        }
        if ($action === 'list') {
            json(['data' => dbQuery("SELECT ih.*, u.name AS user_name FROM import_history ih LEFT JOIN users u ON ih.created_by=u.id ORDER BY ih.created_at DESC LIMIT 50")]);
        }
        break;

    default:
        json(['error' => 'وحدة غير موجودة'], 404);
    }

} catch (PDOException $e) {
    error_log('API DB Error: ' . $e->getMessage());
    json(['error' => 'خطأ في قاعدة البيانات'], 500);
} catch (Throwable $e) {
    error_log('API Error: ' . $e->getMessage());
    // لا نكشف تفاصيل الخطأ للمستخدم
    json(['error' => 'حدث خطأ في الخادم'], 500);
}
