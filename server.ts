import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static('uploads'));

  // WebSocket connections map
  const clients = new Map<number, WebSocket>();

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;

    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === 'auth') {
        userId = data.userId;
        if (userId) clients.set(userId, ws);
      }
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });
  });

  // Helper to broadcast message
  const broadcastToUser = (userId: number, message: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  };

  // Logging Helper
  const logAction = (userId: number | null, action: string, details: string, req: express.Request) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    db.prepare('INSERT INTO logs (user_id, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?)').run(
      userId,
      action,
      details,
      ip?.toString(),
      new Date().toISOString()
    );
  };

  // Auth Middleware
  const requireRole = (roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const userId = req.headers['x-user-id'];
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      
      const user = db.prepare(`
        SELECT roles.role_name 
        FROM users 
        JOIN roles ON users.role_id = roles.id 
        WHERE users.id = ?
      `).get(userId) as any;
      
      if (!user || !roles.includes(user.role_name)) {
        return res.status(403).json({ status: 'error', message: 'Forbidden' });
      }
      next();
    };
  };

  // API Routes
  app.get('/api/workers', (req, res) => {
    const workers = db.prepare('SELECT * FROM workers').all();
    res.json(workers);
  });

  app.post('/api/workers', (req, res) => {
    const { name, job, sponsor } = req.body;
    const info = db.prepare('INSERT INTO workers (name, job, sponsor) VALUES (?, ?, ?)').run(name, job, sponsor);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.get('/api/sales', (req, res) => {
    const sales = db.prepare('SELECT * FROM sales').all();
    res.json(sales);
  });

  app.post('/api/sales', (req, res) => {
    const { service, price, client, date } = req.body;
    const userId = req.headers['x-user-id'];
    const saleDate = date || new Date().toISOString().split('T')[0];
    const info = db.prepare('INSERT INTO sales (service, price, client, date) VALUES (?, ?, ?, ?)').run(service, price, client, saleDate);
    logAction(userId ? parseInt(userId as string) : null, 'SALE_ADD', `Added sale: ${service} for ${client}`, req);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.get('/api/expenses', (req, res) => {
    const expenses = db.prepare(`
      SELECT expenses.*, expense_categories.name as category_name 
      FROM expenses 
      LEFT JOIN expense_categories ON expenses.category_id = expense_categories.id
    `).all();
    res.json(expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const { title, amount, category_id, date } = req.body;
    const userId = req.headers['x-user-id'];
    const expenseDate = date || new Date().toISOString().split('T')[0];
    const info = db.prepare('INSERT INTO expenses (title, amount, category_id, date) VALUES (?, ?, ?, ?)').run(title, amount, category_id, expenseDate);
    logAction(userId ? parseInt(userId as string) : null, 'EXPENSE_ADD', `Added expense: ${title}`, req);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.get('/api/expense-categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM expense_categories').all();
    res.json(categories);
  });

  app.get('/api/stats', (req, res) => {
    const totalSales = db.prepare('SELECT SUM(price) as total FROM sales').get() as any;
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as any;
    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get() as any;
    const workersCount = db.prepare('SELECT COUNT(*) as count FROM workers').get() as any;
    
    // Super Admin stats
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const logsCount = db.prepare('SELECT COUNT(*) as count FROM logs').get() as any;
    
    // New stats for messaging and debts
    const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_read = 0').get() as any;
    const upcomingDebts = db.prepare('SELECT COUNT(*) as count FROM debts WHERE status != "paid" AND due_date <= date("now", "+3 days")').get() as any;

    // Get last 7 days of sales and expenses
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ar-SA', { weekday: 'short' });
      
      const daySales = db.prepare('SELECT SUM(price) as total FROM sales WHERE date = ?').get(dateStr) as any;
      const dayExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses WHERE date = ?').get(dateStr) as any;
      
      history.push({
        name: dayName,
        sales: daySales?.total || 0,
        expenses: dayExpenses?.total || 0
      });
    }

    res.json({
      totalSales: totalSales?.total || 0,
      totalExpenses: totalExpenses?.total || 0,
      salesCount: salesCount?.count || 0,
      workersCount: workersCount?.count || 0,
      usersCount: usersCount?.count || 0,
      logsCount: logsCount?.count || 0,
      unreadMessages: unreadMessages?.count || 0,
      upcomingDebts: upcomingDebts?.count || 0,
      history
    });
  });

  // Sponsors API
  app.get('/api/sponsors', (req, res) => {
    const sponsors = db.prepare('SELECT * FROM sponsors').all();
    res.json(sponsors);
  });

  app.post('/api/sponsors', (req, res) => {
    const { name, nid, phone, broker } = req.body;
    const userId = req.headers['x-user-id'];
    const date = new Date().toISOString().split('T')[0];
    try {
      const info = db.prepare(`
        INSERT INTO sponsors (sponsor_name, national_id, phone, broker_name, created_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, nid, phone, broker, date);
      logAction(userId ? parseInt(userId as string) : null, 'SPONSOR_ADD', `Added sponsor: ${name}`, req);
      res.json({ id: info.lastInsertRowid, status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  });

  app.put('/api/sponsors/:id', (req, res) => {
    const { sponsor_name, national_id, phone, broker_name } = req.body;
    try {
      db.prepare(`
        UPDATE sponsors 
        SET sponsor_name = ?, national_id = ?, phone = ?, broker_name = ?
        WHERE id = ?
      `).run(sponsor_name, national_id, phone, broker_name, req.params.id);
      res.json({ status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  });

  app.delete('/api/sponsors/:id', (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
      db.prepare('DELETE FROM sponsored_workers WHERE sponsor_id = ?').run(req.params.id);
      db.prepare('DELETE FROM sponsors WHERE id = ?').run(req.params.id);
      logAction(userId ? parseInt(userId as string) : null, 'SPONSOR_DELETE', `Deleted sponsor ID: ${req.params.id}`, req);
      res.json({ status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  });

  app.get('/api/sponsors/:id/workers', (req, res) => {
    const workers = db.prepare('SELECT * FROM sponsored_workers WHERE sponsor_id = ?').all(req.params.id);
    res.json(workers);
  });

  app.post('/api/sponsored-workers', (req, res) => {
    const { name, sponsor_id } = req.body;
    const transaction = db.transaction(() => {
      const info = db.prepare('INSERT INTO sponsored_workers (worker_name, sponsor_id) VALUES (?, ?)').run(name, sponsor_id);
      db.prepare('UPDATE sponsors SET workers_count = workers_count + 1 WHERE id = ?').run(sponsor_id);
      return info.lastInsertRowid;
    });
    
    try {
      const id = transaction();
      res.json({ id, status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  });

  app.delete('/api/sponsored-workers/:id', (req, res) => {
    const worker = db.prepare('SELECT sponsor_id FROM sponsored_workers WHERE id = ?').get(req.params.id) as any;
    if (worker) {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM sponsored_workers WHERE id = ?').run(req.params.id);
        db.prepare('UPDATE sponsors SET workers_count = workers_count - 1 WHERE id = ?').run(worker.sponsor_id);
      });
      transaction();
    }
    res.json({ status: 'ok' });
  });

  // Workers API (General)
  app.get('/api/workers', (req, res) => {
    const workers = db.prepare('SELECT * FROM workers').all();
    res.json(workers);
  });

  app.post('/api/workers', (req, res) => {
    const { name, job, sponsor } = req.body;
    const userId = req.headers['x-user-id'];
    const info = db.prepare('INSERT INTO workers (name, job, sponsor) VALUES (?, ?, ?)').run(name, job, sponsor);
    logAction(userId ? parseInt(userId as string) : null, 'WORKER_ADD', `Added worker: ${name}`, req);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.put('/api/workers/:id', (req, res) => {
    const { name, job, sponsor } = req.body;
    db.prepare('UPDATE workers SET name = ?, job = ?, sponsor = ? WHERE id = ?').run(name, job, sponsor, req.params.id);
    res.json({ status: 'ok' });
  });

  app.delete('/api/workers/:id', (req, res) => {
    db.prepare('DELETE FROM workers WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
  });

  // Sales API
  app.get('/api/sales', (req, res) => {
    const sales = db.prepare('SELECT * FROM sales').all();
    res.json(sales);
  });

  app.post('/api/sales', (req, res) => {
    const { service, price, client } = req.body;
    const info = db.prepare('INSERT INTO sales (service, price, client) VALUES (?, ?, ?)').run(service, price, client);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.put('/api/sales/:id', (req, res) => {
    const { service, price, client } = req.body;
    db.prepare('UPDATE sales SET service = ?, price = ?, client = ? WHERE id = ?').run(service, price, client, req.params.id);
    res.json({ status: 'ok' });
  });

  app.delete('/api/sales/:id', (req, res) => {
    db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
  });

  // Expenses API
  app.get('/api/expenses', (req, res) => {
    const expenses = db.prepare('SELECT * FROM expenses').all();
    res.json(expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const { title, amount } = req.body;
    const info = db.prepare('INSERT INTO expenses (title, amount) VALUES (?, ?)').run(title, amount);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.put('/api/expenses/:id', (req, res) => {
    const { title, amount } = req.body;
    db.prepare('UPDATE expenses SET title = ?, amount = ? WHERE id = ?').run(title, amount, req.params.id);
    res.json({ status: 'ok' });
  });

  app.delete('/api/expenses/:id', (req, res) => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
  });

  // Users API
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`
      SELECT users.*, roles.role_name 
      FROM users 
      JOIN roles ON users.role_id = roles.id 
      WHERE username = ? AND password = ?
    `).get(username, password) as any;
    
    if (user) {
      if (user.is_active === 0) {
        logAction(user.id, 'LOGIN_FAILED', 'Account is deactivated', req);
        return res.status(403).json({ status: 'error', message: 'هذا الحساب معطل' });
      }

      logAction(user.id, 'LOGIN_SUCCESS', 'User logged in', req);
      res.json({ 
        status: 'ok', 
        user: { 
          id: user.id, 
          username: user.username, 
          full_name: user.full_name, 
          role: user.role_name,
          role_id: user.role_id
        } 
      });
    } else {
      logAction(null, 'LOGIN_FAILED', `Failed attempt for username: ${username}`, req);
      res.status(401).json({ status: 'error', message: 'خطأ في اسم المستخدم أو كلمة المرور' });
    }
  });

  // Super Admin - User Management
  app.get('/api/admin/users', requireRole(['super_admin']), (req, res) => {
    const users = db.prepare(`
      SELECT users.*, roles.role_name 
      FROM users 
      JOIN roles ON users.role_id = roles.id
    `).all();
    res.json(users);
  });

  app.put('/api/admin/users/:id', requireRole(['super_admin']), (req, res) => {
    const { full_name, role_id, is_active, password } = req.body;
    if (password) {
      db.prepare('UPDATE users SET full_name = ?, role_id = ?, is_active = ?, password = ? WHERE id = ?').run(full_name, role_id, is_active, password, req.params.id);
    } else {
      db.prepare('UPDATE users SET full_name = ?, role_id = ?, is_active = ? WHERE id = ?').run(full_name, role_id, is_active, req.params.id);
    }
    logAction(null, 'USER_UPDATE', `Updated user ID: ${req.params.id}`, req);
    res.json({ status: 'ok' });
  });

  app.delete('/api/admin/users/:id', requireRole(['super_admin']), (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    logAction(null, 'USER_DELETE', `Deleted user ID: ${req.params.id}`, req);
    res.json({ status: 'ok' });
  });

  app.get('/api/admin/roles', requireRole(['super_admin']), (req, res) => {
    const roles = db.prepare('SELECT * FROM roles').all();
    res.json(roles);
  });

  // Super Admin - Settings
  app.get('/api/admin/settings', requireRole(['super_admin']), (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post('/api/admin/settings', requireRole(['super_admin']), (req, res) => {
    const updates = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, value);
    }
    logAction(null, 'SETTINGS_UPDATE', 'Updated system settings', req);
    res.json({ status: 'ok' });
  });

  // Super Admin - Logs
  app.get('/api/admin/logs', requireRole(['super_admin']), (req, res) => {
    const logs = db.prepare(`
      SELECT logs.*, users.full_name as user_name 
      FROM logs 
      LEFT JOIN users ON logs.user_id = users.id 
      ORDER BY logs.created_at DESC 
      LIMIT 500
    `).all();
    res.json(logs);
  });

  app.get('/api/users', (req, res) => {
    const users = db.prepare(`
      SELECT users.id, users.username, users.full_name, roles.role_name as role, users.role_id
      FROM users
      JOIN roles ON users.role_id = roles.id
    `).all();
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { username, password, full_name, role_id } = req.body;
    try {
      const info = db.prepare('INSERT INTO users (username, password, full_name, role_id) VALUES (?, ?, ?, ?)').run(username, password, full_name, role_id);
      res.json({ id: info.lastInsertRowid, status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: 'اسم المستخدم موجود مسبقاً' });
    }
  });

  app.delete('/api/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
  });

  // Messaging API
  app.get('/api/conversations/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const conversations = db.prepare(`
      SELECT c.*, 
             u.full_name as other_user_name,
             u.id as other_user_id,
             (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM conversations c
      JOIN users u ON (c.user1_id = u.id OR c.user2_id = u.id) AND u.id != ?
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC
    `).all(userId, userId, userId, userId);
    res.json(conversations);
  });

  app.get('/api/messages/:conversationId', (req, res) => {
    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.conversationId);
    // Mark as read
    db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(req.params.conversationId, req.query.userId);
    res.json(messages);
  });

  app.post('/api/messages', upload.single('file'), (req, res) => {
    const { conversation_id, sender_id, receiver_id, content, type } = req.body;
    const createdAt = new Date().toISOString();
    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    let convId = conversation_id;
    if (!convId) {
      // Find or create conversation
      const existing = db.prepare('SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)').get(sender_id, receiver_id, receiver_id, sender_id) as any;
      if (existing) {
        convId = existing.id;
      } else {
        const info = db.prepare('INSERT INTO conversations (user1_id, user2_id, last_message_at) VALUES (?, ?, ?)').run(sender_id, receiver_id, createdAt);
        convId = info.lastInsertRowid;
      }
    }

    const info = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, content, type, file_url, file_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(convId, sender_id, content, type || 'text', fileUrl, fileName, createdAt);

    db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(createdAt, convId);

    const newMessage = {
      id: info.lastInsertRowid,
      conversation_id: convId,
      sender_id,
      content,
      type: type || 'text',
      file_url: fileUrl,
      file_name: fileName,
      created_at: createdAt,
      is_read: 0
    };

    broadcastToUser(parseInt(receiver_id), { type: 'new_message', message: newMessage });

    res.json(newMessage);
  });

  // Debts API
  app.get('/api/debts', (req, res) => {
    const debts = db.prepare('SELECT * FROM debts ORDER BY due_date ASC').all();
    res.json(debts);
  });

  app.post('/api/debts', (req, res) => {
    const { type, person_name, amount, due_date, description } = req.body;
    const createdAt = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO debts (type, person_name, amount, due_date, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(type, person_name, amount, due_date, description, createdAt);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.put('/api/debts/:id', (req, res) => {
    const { status, amount, due_date, description } = req.body;
    db.prepare('UPDATE debts SET status = ?, amount = ?, due_date = ?, description = ? WHERE id = ?').run(status, amount, due_date, description, req.params.id);
    res.json({ status: 'ok' });
  });

  app.delete('/api/debts/:id', (req, res) => {
    db.prepare('DELETE FROM debts WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
  });

  // Inventory API
  app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all() as any[];
    const workersCount = db.prepare('SELECT COUNT(*) as count FROM workers').get() as any;
    const sponsoredWorkersCount = db.prepare('SELECT COUNT(*) as count FROM sponsored_workers').get() as any;
    const totalLabor = (workersCount?.count || 0) + (sponsoredWorkersCount?.count || 0);

    const processed = products.map(p => {
      if (p.type === 'establishment') {
        return { ...p, quantity: totalLabor };
      }
      return p;
    });
    res.json(processed);
  });

  app.post('/api/products', (req, res) => {
    const { name, quantity, price, type, moaqeb_name, service_name } = req.body;
    const createdAt = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO products (name, quantity, price, type, moaqeb_name, service_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, quantity, price, type || 'regular', moaqeb_name, service_name, createdAt);
    res.json({ id: info.lastInsertRowid, status: 'ok' });
  });

  app.put('/api/products/:id', (req, res) => {
    const { name, quantity, price, moaqeb_name, service_name } = req.body;
    db.prepare('UPDATE products SET name = ?, quantity = ?, price = ?, moaqeb_name = ?, service_name = ? WHERE id = ?').run(name, quantity, price, moaqeb_name, service_name, req.params.id);
    res.json({ status: 'ok' });
  });

  app.delete('/api/products/:id', (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
  });

  // Financial Reports API
  app.get('/api/reports/financial', (req, res) => {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params: any[] = [];
    if (startDate && endDate) {
      dateFilter = 'WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const sales = db.prepare(`SELECT SUM(price) as total FROM sales ${dateFilter}`).get(...params) as any;
    const expenses = db.prepare(`SELECT SUM(amount) as total FROM expenses ${dateFilter}`).get(...params) as any;
    const debts = db.prepare('SELECT SUM(amount) as total FROM debts WHERE status != "paid"').get() as any;

    const salesByCategory = db.prepare(`
      SELECT service as category, SUM(price) as total 
      FROM sales 
      ${dateFilter}
      GROUP BY service
    `).all(...params);

    const expensesByCategory = db.prepare(`
      SELECT ec.name as category, SUM(e.amount) as total 
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      ${dateFilter.replace('WHERE', 'AND')}
      GROUP BY ec.name
    `).all(...params);

    res.json({
      totalSales: sales?.total || 0,
      totalExpenses: expenses?.total || 0,
      totalDebts: debts?.total || 0,
      netProfit: (sales?.total || 0) - (expenses?.total || 0),
      salesByCategory,
      expensesByCategory
    });
  });

  // Roles API
  app.get('/api/roles', (req, res) => {
    const roles = db.prepare('SELECT * FROM roles').all();
    res.json(roles);
  });

  // Attendance API
  app.get('/api/attendance', (req, res) => {
    const rows = db.prepare(`
      SELECT users.full_name as username, attendance.date, attendance.check_in, attendance.check_out
      FROM attendance
      JOIN users ON attendance.user_id = users.id
      ORDER BY attendance.date DESC, attendance.check_in DESC
    `).all();
    res.json(rows);
  });

  app.post('/api/attendance/checkin', (req, res) => {
    const { user_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(user_id, today);
    if (!existing) {
      db.prepare('INSERT INTO attendance (user_id, date, check_in) VALUES (?, ?, ?)').run(user_id, today, time);
      res.json({ status: 'ok', time });
    } else {
      res.status(400).json({ status: 'error', message: 'تم تسجيل الحضور مسبقاً اليوم' });
    }
  });

  app.post('/api/attendance/checkout', (req, res) => {
    const { user_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const info = db.prepare('UPDATE attendance SET check_out = ? WHERE user_id = ? AND date = ?').run(time, user_id, today);
    if (info.changes > 0) {
      res.json({ status: 'ok', time });
    } else {
      res.status(400).json({ status: 'error', message: 'يجب تسجيل الحضور أولاً' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
