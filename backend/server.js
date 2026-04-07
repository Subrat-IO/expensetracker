const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "expense_tracker",
  dateStrings: true,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
};

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

let pool;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date.toISOString().slice(0, 10);
}

function monthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

function toNumber(value) {
  return Number(value || 0);
}

function normalizeDateValue(value) {
  if (!value) {
    return value;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

async function initDatabase() {
  const bootstrap = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true,
  });

  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await bootstrap.end();

  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(80) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(120) NOT NULL DEFAULT 'Subrat',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      daily_budget DECIMAL(10, 2) NOT NULL DEFAULT 120,
      currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      amount DECIMAL(10, 2) NOT NULL,
      note VARCHAR(255) DEFAULT '',
      category VARCHAR(60) NOT NULL DEFAULT 'general',
      date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_expenses_date (date),
      INDEX idx_expenses_created_at (created_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gym_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      date DATE NOT NULL UNIQUE,
      completed TINYINT(1) NOT NULL DEFAULT 0,
      session_label VARCHAR(80) NOT NULL DEFAULT '6-7 AM Gym',
      notes VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_gym_logs_date (date)
    )
  `);

  await pool.query(`
    INSERT INTO settings (id, daily_budget, currency_code)
    VALUES (1, 120, 'INR')
    ON DUPLICATE KEY UPDATE
      daily_budget = VALUES(daily_budget),
      currency_code = VALUES(currency_code)
  `);

  await pool.query(`
    INSERT INTO users (username, password, name)
    VALUES ('admin', '1234', 'Subrat')
    ON DUPLICATE KEY UPDATE
      password = VALUES(password),
      name = VALUES(name)
  `);
}

async function getSettings() {
  const [rows] = await pool.query(
    "SELECT daily_budget, currency_code FROM settings WHERE id = 1 LIMIT 1",
  );

  return {
    dailyBudget: toNumber(rows[0]?.daily_budget || 120),
    currencyCode: rows[0]?.currency_code || "INR",
  };
}

app.use(cors());
app.use(express.json());

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const [rows] = await pool.query(
    "SELECT id, username, password, name FROM users WHERE username = ? LIMIT 1",
    [username],
  );

  const user = rows[0];

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
  });
}));

app.get("/api/auth/users", asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, username, name, created_at FROM users ORDER BY id ASC",
  );

  res.json(rows);
}));

app.get("/api/health", asyncHandler(async (_req, res) => {
  await pool.query("SELECT 1");

  res.json({
    ok: true,
    message: "MySQL connected",
    database: dbConfig.database,
  });
}));

app.get("/api/settings", asyncHandler(async (_req, res) => {
  res.json(await getSettings());
}));

app.put("/api/settings", asyncHandler(async (req, res) => {
  const dailyBudget = toNumber(req.body.dailyBudget || 120);
  const currencyCode = req.body.currencyCode || "INR";

  await pool.query(
    `INSERT INTO settings (id, daily_budget, currency_code)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE
       daily_budget = VALUES(daily_budget),
       currency_code = VALUES(currency_code)`,
    [dailyBudget, currencyCode],
  );

  res.json({ dailyBudget, currencyCode });
}));

app.post("/api/expenses", asyncHandler(async (req, res) => {
  const amount = toNumber(req.body.amount);
  const date = req.body.date || todayDate();
  const note = req.body.note || "";
  const category = req.body.category || "general";

  if (!amount || !date) {
    return res.status(400).json({ message: "amount and date are required" });
  }

  const [result] = await pool.query(
    "INSERT INTO expenses (amount, note, category, date) VALUES (?, ?, ?, ?)",
    [amount, note, category, date],
  );

  res.status(201).json({
    id: result.insertId,
    amount,
    note,
    category,
    date,
  });
}));

app.get("/api/expenses/daily", asyncHandler(async (req, res) => {
  const date = req.query.date || todayDate();
  const [rows] = await pool.query(
    `SELECT id, amount, note, category, date, created_at AS createdAt
     FROM expenses
     WHERE date = ?
     ORDER BY created_at DESC`,
    [date],
  );

  res.json(rows);
}));

app.get("/api/dashboard/today", asyncHandler(async (_req, res) => {
  const date = todayDate();
  const settings = await getSettings();
  const [rows] = await pool.query(
    `SELECT id, amount, note, category, date, created_at AS createdAt
     FROM expenses
     WHERE date = ?
     ORDER BY created_at DESC`,
    [date],
  );
  const spent = rows.reduce((sum, row) => sum + toNumber(row.amount), 0);

  res.json({
    date,
    ...settings,
    spent,
    remaining: settings.dailyBudget - spent,
    expenses: rows,
  });
}));

app.get("/api/stats/summary", asyncHandler(async (_req, res) => {
  const settings = await getSettings();

  const [weeklyRows] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE date >= ?",
    [startOfWeekDate()],
  );

  const [monthlyRows] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE DATE_FORMAT(date, '%Y-%m') = ?",
    [monthPrefix()],
  );

  const weeklySpent = toNumber(weeklyRows[0]?.total);
  const monthlySpent = toNumber(monthlyRows[0]?.total);
  const weeklyBudget = settings.dailyBudget * 7;
  const monthlyBudget = settings.dailyBudget * new Date().getDate();

  res.json({
    ...settings,
    weeklyBudget,
    weeklySpent,
    weeklySaved: Math.max(weeklyBudget - weeklySpent, 0),
    monthlyBudget,
    monthlySpent,
    monthlySaved: Math.max(monthlyBudget - monthlySpent, 0),
  });
}));

app.get("/api/stats/weekly", asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT date, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE date >= ?
     GROUP BY date
     ORDER BY date ASC`,
    [startOfWeekDate()],
  );

  res.json(rows.map((row) => ({
    date: normalizeDateValue(row.date),
    total: toNumber(row.total),
  })));
}));

app.get("/api/stats/monthly", asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT date, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE DATE_FORMAT(date, '%Y-%m') = ?
     GROUP BY date
     ORDER BY date ASC`,
    [monthPrefix()],
  );

  res.json(rows.map((row) => ({
    date: normalizeDateValue(row.date),
    total: toNumber(row.total),
  })));
}));

app.post("/api/gym", asyncHandler(async (req, res) => {
  const date = req.body.date || todayDate();
  const completed = req.body.completed ? 1 : 0;
  const sessionLabel = req.body.sessionLabel || "6-7 AM Gym";
  const notes = req.body.notes || "";

  if (!date || typeof req.body.completed !== "boolean") {
    return res.status(400).json({ message: "date and completed are required" });
  }

  await pool.query(
    `INSERT INTO gym_logs (date, completed, session_label, notes)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       completed = VALUES(completed),
       session_label = VALUES(session_label),
       notes = VALUES(notes)`,
    [date, completed, sessionLabel, notes],
  );

  res.json({
    date,
    completed: Boolean(completed),
    sessionLabel,
    notes,
  });
}));

app.get("/api/gym", asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id, date, completed, session_label AS sessionLabel, notes, created_at AS createdAt
     FROM gym_logs
     ORDER BY date DESC`,
  );

  res.json(rows.map((row) => ({
    ...row,
    date: normalizeDateValue(row.date),
    completed: Boolean(row.completed),
  })));
}));

app.get("/api/gym/summary", asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT date, completed, session_label AS sessionLabel, notes
     FROM gym_logs
     WHERE date >= ?
     ORDER BY date ASC`,
    [startOfWeekDate()],
  );

  const normalized = rows.map((row) => ({
    ...row,
    date: normalizeDateValue(row.date),
    completed: Boolean(row.completed),
  }));
  const completedDays = normalized.filter((row) => row.completed).length;

  res.json({
    completedDays,
    weeklyConsistency: Math.round((completedDays / 7) * 100),
    logs: normalized,
  });
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: error.message || "Something went wrong while processing the request.",
  });
});

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Discipline Tracker API running on port ${port}`);
      console.log(`MySQL database ready: ${dbConfig.database}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MySQL:", error.message);
    process.exit(1);
  });
