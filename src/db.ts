import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('thiqah.db');
let db: any;
try {
  db = new Database(dbPath);
  console.log('Database initialized successfully at', dbPath);
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    job TEXT,
    sponsor TEXT,
    nid TEXT,
    registration_date TEXT,
    last_followup_date TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT,
    price REAL,
    client TEXT,
    date TEXT,
    supplier_name TEXT,
    wholesale_price REAL,
    net_profit REAL,
    paid_amount REAL,
    remaining_amount REAL,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    assigned_to TEXT,
    due_date TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS broker_dues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    broker_name TEXT,
    service_name TEXT,
    total_amount REAL,
    paid_amount REAL,
    remaining_amount REAL,
    status TEXT DEFAULT 'waiting',
    created_at TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT,
    file_type TEXT,
    upload_date TEXT,
    analysis_status TEXT DEFAULT 'processing',
    extracted_data TEXT,
    classification TEXT,
    file_path TEXT,
    client_id INTEGER,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    national_id TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    service TEXT,
    notes TEXT,
    category TEXT, -- 'worker', 'sponsor', 'mediator'
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS agent_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER,
    description TEXT,
    paid_amount REAL,
    wholesale_price REAL,
    debt REAL,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    amount REAL,
    date TEXT
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
    email TEXT,
    phone TEXT,
    role_id INTEGER,
    is_active INTEGER DEFAULT 1,
    subscription_start TEXT,
    subscription_end TEXT,
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

// Migration: Add nid, registration_date, last_followup_date to workers
const workerCols = db.prepare("PRAGMA table_info(workers)").all() as any[];
if (!workerCols.some(col => col.name === 'nid')) {
  db.exec("ALTER TABLE workers ADD COLUMN nid TEXT");
}
if (!workerCols.some(col => col.name === 'registration_date')) {
  db.exec("ALTER TABLE workers ADD COLUMN registration_date TEXT");
}
if (!workerCols.some(col => col.name === 'last_followup_date')) {
  db.exec("ALTER TABLE workers ADD COLUMN last_followup_date TEXT");
}

// Migration: Add category_id and date to expenses
const expenseCols = db.prepare("PRAGMA table_info(expenses)").all() as any[];
if (!expenseCols.some(col => col.name === 'category_id')) {
  db.exec("ALTER TABLE expenses ADD COLUMN category_id INTEGER REFERENCES expense_categories(id)");
}
if (!expenseCols.some(col => col.name === 'date')) {
  db.exec("ALTER TABLE expenses ADD COLUMN date TEXT");
}

// Migration: Add new columns to sales
const salesCols = db.prepare("PRAGMA table_info(sales)").all() as any[];
if (!salesCols.some(col => col.name === 'date')) {
  db.exec("ALTER TABLE sales ADD COLUMN date TEXT");
}
if (!salesCols.some(col => col.name === 'supplier_name')) {
  db.exec("ALTER TABLE sales ADD COLUMN supplier_name TEXT");
}
if (!salesCols.some(col => col.name === 'wholesale_price')) {
  db.exec("ALTER TABLE sales ADD COLUMN wholesale_price REAL");
}
if (!salesCols.some(col => col.name === 'net_profit')) {
  db.exec("ALTER TABLE sales ADD COLUMN net_profit REAL");
}
if (!salesCols.some(col => col.name === 'paid_amount')) {
  db.exec("ALTER TABLE sales ADD COLUMN paid_amount REAL");
}
if (!salesCols.some(col => col.name === 'remaining_amount')) {
  db.exec("ALTER TABLE sales ADD COLUMN remaining_amount REAL");
}
if (!salesCols.some(col => col.name === 'created_by')) {
  db.exec("ALTER TABLE sales ADD COLUMN created_by INTEGER REFERENCES users(id)");
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
if (!userCols.some(col => col.name === 'email')) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
}
if (!userCols.some(col => col.name === 'phone')) {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
}
if (!userCols.some(col => col.name === 'subscription_start')) {
  db.exec("ALTER TABLE users ADD COLUMN subscription_start TEXT");
}
if (!userCols.some(col => col.name === 'subscription_end')) {
  db.exec("ALTER TABLE users ADD COLUMN subscription_end TEXT");
}

// Migration: Add client_id to files
const fileCols = db.prepare("PRAGMA table_info(files)").all() as any[];
if (!fileCols.some(col => col.name === 'client_id')) {
  db.exec("ALTER TABLE files ADD COLUMN client_id INTEGER REFERENCES clients(id)");
}
if (!fileCols.some(col => col.name === 'classification')) {
  db.exec("ALTER TABLE files ADD COLUMN classification TEXT");
}

// Migration: Add category to clients
const clientCols = db.prepare("PRAGMA table_info(clients)").all() as any[];
if (!clientCols.some(col => col.name === 'category')) {
  db.exec("ALTER TABLE clients ADD COLUMN category TEXT");
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
    { key: 'site_name', value: 'حلول' },
    { key: 'site_logo', value: '' },
    { key: 'official_email', value: 'Torkiali054@gmail.com' },
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
