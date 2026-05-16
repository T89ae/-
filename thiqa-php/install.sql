-- ================================================================
--  نظام ثقة للخدمات العامة — قاعدة البيانات الكاملة
--  install.sql
--  تشغيل: mysql -u root -p < install.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS thiqa_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE thiqa_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ── المستخدمون ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150),
    phone         VARCHAR(20),
    role          ENUM('admin','manager','user') DEFAULT 'user',
    is_active     TINYINT(1) DEFAULT 1,
    last_login    DATETIME,
    login_count   INT DEFAULT 0,
    avatar        VARCHAR(255),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB;

INSERT IGNORE INTO users (username, password, name, role)
VALUES ('admin', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'المدير العام', 'admin');
-- كلمة المرور الافتراضية: password

-- ── الكفلاء ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsors (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    national_id VARCHAR(30),
    iban        VARCHAR(50),
    address     VARCHAR(200),
    note        TEXT,
    is_active   TINYINT(1) DEFAULT 1,
    created_by  INT UNSIGNED,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── العمال ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    phone            VARCHAR(20),
    nationality      VARCHAR(50),
    national_id      VARCHAR(30),
    sponsor_id       INT UNSIGNED,
    iqama_number     VARCHAR(30),
    iqama_expiry     DATE,
    passport_number  VARCHAR(30),
    passport_expiry  DATE,
    salary           DECIMAL(10,2) DEFAULT 0,
    commission       DECIMAL(10,2) DEFAULT 0,
    marketer         VARCHAR(100),
    transfer_date    DATE,
    status           ENUM('active','inactive','transferred','final_exit') DEFAULT 'active',
    note             TEXT,
    from_import      TINYINT(1) DEFAULT 0,
    created_by       INT UNSIGNED,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_iqama_expiry (iqama_expiry),
    FOREIGN KEY (sponsor_id)  REFERENCES sponsors(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── العملاء / جهات الاتصال ───────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    type        ENUM('worker','sponsor','middleman','client','other') DEFAULT 'client',
    city        VARCHAR(80),
    email       VARCHAR(150),
    note        TEXT,
    from_import TINYINT(1) DEFAULT 0,
    from_agent  TINYINT(1) DEFAULT 0,
    created_by  INT UNSIGNED,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_type (type),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── الوسطاء ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brokers (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    national_id VARCHAR(30),
    email       VARCHAR(150),
    specialty   VARCHAR(100),
    note        TEXT,
    created_by  INT UNSIGNED,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── مستحقات الوسطاء ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broker_entitlements (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    broker_id      INT UNSIGNED NOT NULL,
    type           VARCHAR(50),
    amount         DECIMAL(10,2) NOT NULL,
    due_date       DATE,
    status         ENUM('unpaid','paid','late') DEFAULT 'unpaid',
    paid_at        DATE,
    note           TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_broker_status (broker_id, status),
    INDEX idx_due_date (due_date),
    FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── الحوالات المالية ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfers (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    worker_id     INT UNSIGNED,
    worker_name   VARCHAR(100),
    amount        DECIMAL(10,2) NOT NULL,
    fee           DECIMAL(10,2) DEFAULT 0,
    method        VARCHAR(50),
    reference_no  VARCHAR(80),
    transfer_date DATE DEFAULT (CURRENT_DATE),
    status        ENUM('pending','sent','cancelled') DEFAULT 'pending',
    note          TEXT,
    created_by    INT UNSIGNED,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_worker (worker_id),
    INDEX idx_date (transfer_date),
    INDEX idx_status (status),
    FOREIGN KEY (worker_id)  REFERENCES workers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── المبيعات ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_name      VARCHAR(150) NOT NULL,
    quantity       DECIMAL(10,3) DEFAULT 1,
    unit_price     DECIMAL(10,2) NOT NULL,
    total          DECIMAL(10,2) NOT NULL,
    customer_name  VARCHAR(100),
    payment_method ENUM('cash','bank','transfer','credit') DEFAULT 'cash',
    sale_date      DATE DEFAULT (CURRENT_DATE),
    receipt_path   VARCHAR(255),
    note           TEXT,
    created_by     INT UNSIGNED,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (sale_date),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── المصروفات ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category       VARCHAR(80),
    description    VARCHAR(250) NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bank','transfer','credit') DEFAULT 'cash',
    vendor         VARCHAR(100),
    expense_date   DATE DEFAULT (CURRENT_DATE),
    receipt_path   VARCHAR(255),
    note           TEXT,
    created_by     INT UNSIGNED,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (expense_date),
    INDEX idx_category (category),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── المخزون ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(80),
    quantity    DECIMAL(10,3) DEFAULT 0,
    unit        VARCHAR(30),
    buy_price   DECIMAL(10,2) DEFAULT 0,
    sell_price  DECIMAL(10,2) DEFAULT 0,
    min_qty     DECIMAL(10,3) DEFAULT 0,
    note        TEXT,
    created_by  INT UNSIGNED,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── المهام ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(250) NOT NULL,
    description  TEXT,
    assigned_to  VARCHAR(100),
    priority     ENUM('low','medium','high','urgent') DEFAULT 'medium',
    status       ENUM('pending','in_progress','done') DEFAULT 'pending',
    due_date     DATE,
    completed_at DATETIME,
    created_by   INT UNSIGNED,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_priority (status, priority),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── الملفات المرفوعة ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    display_name  VARCHAR(250) NOT NULL,
    file_name     VARCHAR(250) NOT NULL,
    file_path     VARCHAR(500),
    file_size     INT UNSIGNED,
    mime_type     VARCHAR(100),
    category      VARCHAR(80),
    related_to    VARCHAR(150),
    note          TEXT,
    created_by    INT UNSIGNED,
    uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── الحضور ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    worker_id  INT UNSIGNED NOT NULL,
    att_date   DATE NOT NULL,
    status     ENUM('present','absent','late','holiday','sick') DEFAULT 'present',
    note       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_worker_date (worker_id, att_date),
    INDEX idx_date (att_date),
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── نظام الولاء ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    points      INT DEFAULT 0,
    tier        ENUM('bronze','silver','gold') DEFAULT 'bronze',
    note        TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── الإيصالات ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type           ENUM('income','expense') DEFAULT 'income',
    category       VARCHAR(80),
    amount         DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    vendor         VARCHAR(100),
    description    VARCHAR(250),
    receipt_date   DATE DEFAULT (CURRENT_DATE),
    note           TEXT,
    created_by     INT UNSIGNED,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── طلبات الخدمة (حلول الوكيل) ─────────────────────────────
CREATE TABLE IF NOT EXISTS service_requests (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_code  VARCHAR(30) UNIQUE NOT NULL,
    service_type  VARCHAR(50) NOT NULL,
    service_label VARCHAR(100),
    service_icon  VARCHAR(10),
    client_name   VARCHAR(100) NOT NULL,
    client_phone  VARCHAR(20),
    priority      ENUM('normal','urgent') DEFAULT 'normal',
    status        ENUM('pending','in_progress','done','cancelled') DEFAULT 'pending',
    notes         TEXT,
    from_agent    TINYINT(1) DEFAULT 0,
    assigned_to   INT UNSIGNED,
    completed_at  DATETIME,
    created_by    INT UNSIGNED,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_code (request_code),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── المتابعون (Agents) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(20),
    note       TEXT,
    created_by INT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── طلبات المتابعين ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_requests (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    agent_id       INT UNSIGNED NOT NULL,
    client_name    VARCHAR(100),
    client_phone   VARCHAR(20),
    description    TEXT NOT NULL,
    paid_amount    DECIMAL(10,2) DEFAULT 0,
    wholesale_price DECIMAL(10,2) DEFAULT 0,
    debt           DECIMAL(10,2) DEFAULT 0,
    paid_at        DATE,
    note           TEXT,
    from_import    TINYINT(1) DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent (agent_id),
    INDEX idx_debt (debt),
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── سجل الاستيراد ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_history (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename    VARCHAR(250),
    total       INT DEFAULT 0,
    imported    INT DEFAULT 0,
    duplicates  INT DEFAULT 0,
    skipped     INT DEFAULT 0,
    created_by  INT UNSIGNED,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── سجل النشاطات ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED,
    action     VARCHAR(150) NOT NULL,
    module     VARCHAR(80),
    detail     TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── إعدادات النظام ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key_name   VARCHAR(100) UNIQUE NOT NULL,
    key_value  TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO settings (key_name, key_value) VALUES
('office_name',    'مكتب ثقة للخدمات العامة'),
('office_phone',   ''),
('gemini_api_key', ''),
('currency',       'ر.س'),
('date_format',    'd/m/Y');

SET FOREIGN_KEY_CHECKS = 1;

-- ── فهارس إضافية لتحسين الأداء ──────────────────────────────
ALTER TABLE workers    ADD INDEX IF NOT EXISTS idx_phone (phone);
ALTER TABLE customers  ADD INDEX IF NOT EXISTS idx_phone (phone);
ALTER TABLE transfers  ADD INDEX IF NOT EXISTS idx_worker_name (worker_name);
ALTER TABLE brokers    ADD INDEX IF NOT EXISTS idx_name (name);
ALTER TABLE agents     ADD INDEX IF NOT EXISTS idx_name (name);
