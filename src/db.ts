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
    remaining_amount REAL
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
if (!expenseCols.some(col => col.name === 'sale_id')) {
  db.exec("ALTER TABLE expenses ADD COLUMN sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE");
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

// Initialize default categories
const initDb = db.transaction(() => {
  const categories = ['إيجار', 'رواتب', 'صيانة', 'فواتير', 'أخرى'];
  categories.forEach(cat => {
    db.prepare("INSERT OR IGNORE INTO expense_categories (name) VALUES (?)").run(cat);
  });
});

initDb();

export default db;
