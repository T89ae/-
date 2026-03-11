import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('thiqah.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    job TEXT,
    sponsor TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT,
    price REAL,
    client TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    amount REAL
  );

  CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sponsor_name TEXT,
    national_id TEXT UNIQUE,
    phone TEXT,
    broker_name TEXT,
    created_date TEXT,
    workers_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sponsored_workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_name TEXT,
    sponsor_id INTEGER,
    FOREIGN KEY (sponsor_id) REFERENCES sponsors(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    role_id INTEGER,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_key TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER,
    permission_id INTEGER,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    check_in TEXT,
    check_out TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER,
    user2_id INTEGER,
    last_message_at TEXT,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    sender_id INTEGER,
    content TEXT,
    type TEXT DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    created_at TEXT,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    person_name TEXT,
    amount REAL,
    due_date TEXT,
    description TEXT,
    status TEXT DEFAULT 'unpaid',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    quantity INTEGER,
    price REAL,
    type TEXT DEFAULT 'regular',
    moaqeb_name TEXT,
    service_name TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    invoice_number TEXT UNIQUE,
    created_at TEXT,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );
`);

// Migration: Add category_id and date to expenses
const expenseCols = db.prepare("PRAGMA table_info(expenses)").all() as any[];
if (!expenseCols.some(col => col.name === 'category_id')) {
  db.exec("ALTER TABLE expenses ADD COLUMN category_id INTEGER REFERENCES expense_categories(id)");
}
if (!expenseCols.some(col => col.name === 'date')) {
  db.exec("ALTER TABLE expenses ADD COLUMN date TEXT");
}

// Migration: Add date to sales
const salesCols = db.prepare("PRAGMA table_info(sales)").all() as any[];
if (!salesCols.some(col => col.name === 'date')) {
  db.exec("ALTER TABLE sales ADD COLUMN date TEXT");
}

// Migration: Check if users table has role_id column
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasRoleId = tableInfo.some(col => col.name === 'role_id');
if (tableInfo.length > 0 && !hasRoleId) {
  db.exec("DROP TABLE users");
}

// Migration: Add is_active to users
const userCols = db.prepare("PRAGMA table_info(users)").all() as any[];
if (!userCols.some(col => col.name === 'is_active')) {
  db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
}

// Initialize default roles and admin
const initDb = db.transaction(() => {
  db.prepare("INSERT OR IGNORE INTO roles (role_name) VALUES ('super_admin')").run();
  db.prepare("INSERT OR IGNORE INTO roles (role_name) VALUES ('admin')").run();
  db.prepare("INSERT OR IGNORE INTO roles (role_name) VALUES ('user')").run();

  const categories = ['إيجار', 'رواتب', 'صيانة', 'فواتير', 'أخرى'];
  categories.forEach(cat => {
    db.prepare("INSERT OR IGNORE INTO expense_categories (name) VALUES (?)").run(cat);
  });

  // Default settings
  const defaultSettings = [
    { key: 'site_name', value: 'نظام ثقة' },
    { key: 'site_logo', value: '' },
    { key: 'official_email', value: 'info@thiqah.com' },
    { key: 'allow_registration', value: '0' },
    { key: 'smtp_host', value: '' },
    { key: 'smtp_port', value: '' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' }
  ];
  defaultSettings.forEach(s => {
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
  });

  const superAdminRole = db.prepare("SELECT id FROM roles WHERE role_name = 'super_admin'").get() as any;

  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('1095972897');
  if (!adminExists) {
    db.prepare('INSERT INTO users (username, password, full_name, role_id) VALUES (?, ?, ?, ?)').run(
      '1095972897',
      'Tt@112233',
      'تركي النجعي',
      superAdminRole.id
    );
  } else {
    // Update existing admin to Super Admin and change name
    db.prepare('UPDATE users SET full_name = ?, role_id = ? WHERE username = ?').run(
      'تركي النجعي',
      superAdminRole.id,
      '1095972897'
    );
  }
});

initDb();

export default db;
