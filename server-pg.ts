// ==========================
// 🚀 FULL SYSTEM (ONE FILE)
// ==========================

import express, { Request, Response } from "express";
import pkg from "pg";
import cors from "cors";
import cron from "node-cron";

const { Pool } = pkg;

// ==========================
// ⚙️ CONFIG
// ==========================
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "service_system",
  password: process.env.PG_PASSWORD || "123456",
  port: Number(process.env.PG_PORT) || 5432,
});

// ==========================
// 🧱 CREATE TABLES
// ==========================
const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS workers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      sponsor_id INT REFERENCES sponsors(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agents (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      commission DECIMAL,
      payment_status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      worker_id INT REFERENCES workers(id),
      sponsor_id INT REFERENCES sponsors(id),
      type VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      worker_id INT REFERENCES workers(id),
      sponsor_id INT REFERENCES sponsors(id),
      transaction_id INT,
      agent_id INT,
      month VARCHAR(20),
      status VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounting (
      id SERIAL PRIMARY KEY,
      agent_id INT REFERENCES agents(id),
      amount DECIMAL,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Tables Ready");
};

// ==========================
// 🔄 CRON JOB (Monthly Tasks)
// ==========================
cron.schedule("0 0 1 * *", async () => {
  console.log("⏰ Generating Monthly Tasks...");

  try {
    const workers = await pool.query("SELECT * FROM workers");

    for (const worker of workers.rows) {
      await pool.query(
        `INSERT INTO tasks (worker_id, sponsor_id, month, status)
         VALUES ($1, $2, $3, $4)`,
        [
          worker.id,
          worker.sponsor_id,
          new Date().getMonth() + 1,
          "Due",
        ]
      );
    }

    console.log("✅ Monthly Tasks Created");
  } catch (err) {
    console.error("❌ Cron job failed:", err);
  }
});

// ==========================
// 📡 API ROUTES
// ==========================

// 🔹 Add Worker
app.post("/workers", async (req: Request, res: Response) => {
  const { name, sponsor_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO workers (name, sponsor_id) VALUES ($1,$2)",
      [name, sponsor_id]
    );
    res.json({ message: "Worker Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add worker" });
  }
});

// 🔹 Get Workers
app.get("/workers", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM workers");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get workers" });
  }
});

// 🔹 Add Sponsor
app.post("/sponsors", async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    await pool.query("INSERT INTO sponsors (name) VALUES ($1)", [name]);
    res.json({ message: "Sponsor Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add sponsor" });
  }
});

// 🔹 Add Agent
app.post("/agents", async (req: Request, res: Response) => {
  const { name, commission } = req.body;
  try {
    await pool.query(
      "INSERT INTO agents (name, commission, payment_status) VALUES ($1,$2,$3)",
      [name, commission, "Unpaid"]
    );
    res.json({ message: "Agent Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add agent" });
  }
});

// 🔹 Add Transaction
app.post("/transactions", async (req: Request, res: Response) => {
  const { worker_id, sponsor_id, type } = req.body;
  try {
    await pool.query(
      "INSERT INTO transactions (worker_id, sponsor_id, type) VALUES ($1,$2,$3)",
      [worker_id, sponsor_id, type]
    );
    res.json({ message: "Transaction Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

// 🔹 Get Tasks
app.get("/tasks", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM tasks");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

// 🔍 Search Tasks — must be defined before /tasks/:id to avoid route conflict
app.get("/tasks/search", async (req: Request, res: Response) => {
  const { status, worker_id } = req.query;

  try {
    let query = "SELECT * FROM tasks WHERE 1=1";
    const params: (string | number)[] = [];

    if (status) {
      params.push(String(status));
      query += ` AND status=$${params.length}`;
    }
    if (worker_id) {
      params.push(Number(worker_id));
      query += ` AND worker_id=$${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search tasks" });
  }
});

// 🔹 Update Task Status
app.put("/tasks/:id", async (req: Request, res: Response) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE tasks SET status=$1 WHERE id=$2", [
      status,
      req.params.id,
    ]);
    res.json({ message: "Task Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// 📊 Dashboard Stats
app.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const tasks = await pool.query("SELECT * FROM tasks");

    const stats = {
      completed: tasks.rows.filter((t) => t.status === "Completed").length,
      due: tasks.rows.filter((t) => t.status === "Due").length,
      overdue: tasks.rows.filter((t) => t.status === "Overdue").length,
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

// 💰 Accounting
app.post("/accounting", async (req: Request, res: Response) => {
  const { agent_id, amount } = req.body;
  try {
    await pool.query(
      "INSERT INTO accounting (agent_id, amount, status) VALUES ($1,$2,$3)",
      [agent_id, amount, "Pending"]
    );
    res.json({ message: "Accounting Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add accounting entry" });
  }
});

// ==========================
// 🚀 START SERVER
// ==========================
const start = async () => {
  await createTables();

  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();
