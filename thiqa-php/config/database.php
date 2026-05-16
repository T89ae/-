<?php
/**
 * config/database.php — اتصال PDO بقاعدة البيانات
 */

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST, DB_NAME, DB_CHARSET
    );

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_FOUND_ROWS   => true,
        ]);
        $pdo->exec("SET time_zone = '+03:00'");
    } catch (PDOException $e) {
        error_log('DB Connection failed: ' . $e->getMessage());
        die(json_encode(['error' => 'فشل الاتصال بقاعدة البيانات'], JSON_UNESCAPED_UNICODE));
    }

    return $pdo;
}

/** Execute a query and return all rows */
function dbQuery(string $sql, array $params = []): array {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/** Execute a query and return first row */
function dbFirst(string $sql, array $params = []): ?array {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

/** Execute insert/update/delete and return affected rows */
function dbExec(string $sql, array $params = []): int {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}

/** Execute insert and return last insert ID */
function dbInsert(string $sql, array $params = []): int {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return (int) db()->lastInsertId();
}

/** Count rows for a base query (without ORDER BY / LIMIT) */
function dbCount(string $sql, array $params = []): int {
    $row = dbFirst("SELECT COUNT(*) AS cnt FROM ({$sql}) AS _count_wrap", $params);
    return (int)($row['cnt'] ?? 0);
}

/** Paginate results — returns data + pagination meta */
function dbPaginate(string $sql, array $params, int $page = 1, int $perPage = 20): array {
    $page    = max(1, $page);
    $perPage = max(1, min(100, $perPage));
    $offset  = ($page - 1) * $perPage;
    $total   = dbCount($sql, $params);

    $rows = dbQuery("{$sql} LIMIT {$perPage} OFFSET {$offset}", $params);

    return [
        'data'         => $rows,
        'total'        => $total,
        'per_page'     => $perPage,
        'current_page' => $page,
        'last_page'    => (int) ceil($total / max(1, $perPage)),
    ];
}

/** Run a callable inside a DB transaction; rolls back on any exception */
function dbTransaction(callable $fn): mixed {
    db()->beginTransaction();
    try {
        $result = $fn();
        db()->commit();
        return $result;
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
}
