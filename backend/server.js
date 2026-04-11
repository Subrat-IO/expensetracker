const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || "discipline-tracker-dev-secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "12h";
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  "mongodb://127.0.0.1:27017/expense_tracker";
const databaseName =
  process.env.MONGODB_DB_NAME ||
  (() => {
    try {
      const parsed = new URL(mongoUri);
      return parsed.pathname.replace(/^\//, "") || "expense_tracker";
    } catch (_error) {
      return "expense_tracker";
    }
  })();

if (
  process.env.NODE_ENV === "production" &&
  jwtSecret === "discipline-tracker-dev-secret"
) {
  throw new Error("JWT_SECRET must be set in production.");
}

const SETTINGS_ID = "app_settings";

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

let client;
let db;
let usersCollection;
let settingsCollection;
let expensesCollection;
let gymLogsCollection;
let databaseReady = false;
let databaseErrorMessage = "Database connection has not been established yet.";
let isConnectingToDatabase = false;

function formatDatabaseHelp(error) {
  const lines = [
    "MongoDB connection failed.",
    `Target database: '${databaseName}'.`,
    "Create backend/.env with your real MongoDB connection string, for example:",
    "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker?retryWrites=true&w=majority",
    "MONGODB_DB_NAME=expense_tracker",
  ];

  if (error?.code === 18) {
    lines.push("The username or password was rejected by MongoDB Atlas.");
  }

  return lines.join("\n");
}

function createAuthToken(user) {
  const sessionId = crypto.randomUUID();

  return {
    sessionId,
    token: jwt.sign(
      {
        sub: String(user._id),
        username: user.username,
        name: user.name,
        sid: sessionId,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn },
    ),
  };
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (!ObjectId.isValid(payload.sub)) {
      return res
        .status(401)
        .json({ message: "Invalid or expired session token" });
    }

    const user = await usersCollection.findOne(
      { _id: new ObjectId(payload.sub) },
      {
        projection: { username: 1, name: 1, sessionTokenId: 1, profileImage: 1 },
      },
    );

    if (!user || !user.sessionTokenId || user.sessionTokenId !== payload.sid) {
      return res.status(401).json({
        message:
          "Your session expired because you logged in on another device.",
      });
    }

    req.auth = {
      user: {
        id: String(user._id),
        username: user.username,
        name: user.name,
        profileImage: user.profileImage || "",
      },
      tokenId: payload.sid,
    };

    return next();
  } catch (_error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired session token" });
  }
}

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

function mapExpense(doc) {
  return {
    id: String(doc._id),
    amount: toNumber(doc.amount),
    note: doc.note || "",
    category: doc.category || "general",
    date: normalizeDateValue(doc.date),
    createdAt: doc.createdAt,
  };
}

function mapGymLog(doc) {
  return {
    id: String(doc._id),
    date: normalizeDateValue(doc.date),
    completed: Boolean(doc.completed),
    sessionLabel: doc.sessionLabel || "6-7 AM Gym",
    notes: doc.notes || "",
    createdAt: doc.createdAt,
  };
}

async function ensureDefaultData() {
  await settingsCollection.updateOne(
    { _id: SETTINGS_ID },
    {
      $setOnInsert: {
        dailyBudget: 120,
        currencyCode: "INR",
        createdAt: new Date(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  await usersCollection.updateOne(
    { username: "admin" },
    {
      $set: {
        password: "1234",
        name: "Subrat",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function initDatabase() {
  client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  await client.connect();
  db = client.db(databaseName);
  usersCollection = db.collection("users");
  settingsCollection = db.collection("settings");
  expensesCollection = db.collection("expenses");
  gymLogsCollection = db.collection("gym_logs");

  await usersCollection.createIndex({ username: 1 }, { unique: true });
  await expensesCollection.createIndex({ date: 1, createdAt: -1 });
  await gymLogsCollection.createIndex({ date: 1 }, { unique: true });

  await ensureDefaultData();
  databaseReady = true;
  databaseErrorMessage = "";
}

async function getSettings() {
  const settings = await settingsCollection.findOne({ _id: SETTINGS_ID });

  return {
    dailyBudget: toNumber(settings?.dailyBudget || 120),
    currencyCode: settings?.currencyCode || "INR",
  };
}

function isPublicApiPath(path) {
  return (
    path === "/auth/login" ||
    path === "/auth/session" ||
    path === "/auth/logout" ||
    path === "/health"
  );
}

function requireDatabaseConnection(req, res, next) {
  if (databaseReady) {
    return next();
  }

  if (req.path === "/health") {
    return next();
  }

  return res.status(503).json({
    ok: false,
    message: "Backend is starting. Database is not connected yet.",
    databaseReady,
    error: databaseErrorMessage,
  });
}

async function connectDatabaseWithRetry() {
  if (databaseReady || isConnectingToDatabase) {
    return;
  }

  isConnectingToDatabase = true;

  try {
    await initDatabase();
    console.log(`MongoDB database ready: ${databaseName}`);
  } catch (error) {
    databaseReady = false;
    databaseErrorMessage = error.message || "Unknown MongoDB connection error";
    console.error(formatDatabaseHelp(error));
    console.error(`Original MongoDB error: ${databaseErrorMessage}`);

    setTimeout(() => {
      connectDatabaseWithRetry().catch(() => null);
    }, 10000);
  } finally {
    isConnectingToDatabase = false;
  }
}

app.use(cors());
app.use(express.json());

// Setup multer for file uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "helloworld",
    service: "expense-tracker-backend",
    databaseReady,
  });
});

app.use("/api", requireDatabaseConnection);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password are required" });
    }

    const user = await usersCollection.findOne(
      { username },
      { projection: { username: 1, password: 1, name: 1, profileImage: 1 } },
    );

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { sessionId, token } = createAuthToken(user);

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { sessionTokenId: sessionId, updatedAt: new Date() } },
    );

    return res.json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
        name: user.name,
        profileImage: user.profileImage || "",
      },
    });
  }),
);

app.get(
  "/api/auth/session",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      user: req.auth.user,
    });
  }),
);

app.post(
  "/api/auth/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await usersCollection.updateOne(
      { _id: new ObjectId(req.auth.user.id) },
      { $set: { sessionTokenId: null, updatedAt: new Date() } },
    );

    res.json({ ok: true });
  }),
);

app.get(
  "/api/auth/users",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const users = await usersCollection
      .find({}, { projection: { username: 1, name: 1, createdAt: 1 } })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();

    res.json(
      users.map((user) => ({
        id: String(user._id),
        username: user.username,
        name: user.name,
        created_at: user.createdAt,
      })),
    );
  }),
);

// Upload profile picture
app.post(
  "/api/upload/profile",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Optionally store the image path in the user document
    await usersCollection.updateOne(
      { _id: new ObjectId(req.auth.user.id) },
      { $set: { profileImage: imageUrl, updatedAt: new Date() } },
    );

    res.json({
      ok: true,
      imageUrl,
      message: "Profile picture uploaded successfully",
    });
  }),
);

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    if (!databaseReady || !db) {
      return res.status(503).json({
        ok: false,
        message: "MongoDB not connected yet",
        database: databaseName,
        error: databaseErrorMessage,
      });
    }

    await db.command({ ping: 1 });

    return res.json({
      ok: true,
      message: "MongoDB connected",
      database: databaseName,
    });
  }),
);

app.use("/api", (req, res, next) => {
  if (isPublicApiPath(req.path)) {
    return next();
  }

  return requireAuth(req, res, next);
});

app.get(
  "/api/settings",
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  }),
);

app.put(
  "/api/settings",
  asyncHandler(async (req, res) => {
    const dailyBudget = toNumber(req.body.dailyBudget || 120);
    const currencyCode = req.body.currencyCode || "INR";

    await settingsCollection.updateOne(
      { _id: SETTINGS_ID },
      {
        $set: {
          dailyBudget,
          currencyCode,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    res.json({ dailyBudget, currencyCode });
  }),
);

app.post(
  "/api/expenses",
  asyncHandler(async (req, res) => {
    const amount = toNumber(req.body.amount);
    const date = req.body.date || todayDate();
    const note = req.body.note || "";
    const category = req.body.category || "general";

    if (!amount || !date) {
      return res.status(400).json({ message: "amount and date are required" });
    }

    const result = await expensesCollection.insertOne({
      amount,
      note,
      category,
      date,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      id: String(result.insertedId),
      amount,
      note,
      category,
      date,
    });
  }),
);

app.put(
  "/api/expenses/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const amount = toNumber(req.body.amount);
    const note = req.body.note || "";
    const category = req.body.category || "general";
    const date = req.body.date || todayDate();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    if (!amount || !date) {
      return res.status(400).json({ message: "amount and date are required" });
    }

    const existing = await expensesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await expensesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          amount,
          note,
          category,
          date,
          updatedAt: new Date(),
        },
      },
    );

    res.json(
      mapExpense({
        ...existing,
        amount,
        note,
        category,
        date,
        updatedAt: new Date(),
      }),
    );
  }),
);

app.delete(
  "/api/expenses/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const result = await expensesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ ok: true });
  }),
);

app.get(
  "/api/expenses/daily",
  asyncHandler(async (req, res) => {
    const date = req.query.date || todayDate();
    const expenses = await expensesCollection
      .find({ date })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    res.json(expenses.map(mapExpense));
  }),
);

app.get(
  "/api/dashboard/today",
  asyncHandler(async (_req, res) => {
    const date = todayDate();
    const settings = await getSettings();
    const expenses = await expensesCollection
      .find({ date })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    const normalizedExpenses = expenses.map(mapExpense);
    const spent = normalizedExpenses.reduce(
      (sum, row) => sum + toNumber(row.amount),
      0,
    );

    res.json({
      date,
      ...settings,
      spent,
      remaining: settings.dailyBudget - spent,
      expenses: normalizedExpenses,
    });
  }),
);

app.get(
  "/api/stats/summary",
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    const weeklyExpenses = await expensesCollection
      .find(
        { date: { $gte: startOfWeekDate() } },
        { projection: { amount: 1 } },
      )
      .toArray();
    const monthlyExpenses = await expensesCollection
      .find(
        { date: { $regex: `^${monthPrefix()}` } },
        { projection: { amount: 1 } },
      )
      .toArray();

    const weeklySpent = weeklyExpenses.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0,
    );
    const monthlySpent = monthlyExpenses.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0,
    );
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
  }),
);

app.get(
  "/api/stats/weekly",
  asyncHandler(async (_req, res) => {
    const rows = await expensesCollection
      .aggregate([
        { $match: { date: { $gte: startOfWeekDate() } } },
        { $group: { _id: "$date", total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json(
      rows.map((row) => ({
        date: normalizeDateValue(row._id),
        total: toNumber(row.total),
      })),
    );
  }),
);

app.get(
  "/api/stats/monthly",
  asyncHandler(async (_req, res) => {
    const rows = await expensesCollection
      .aggregate([
        { $match: { date: { $regex: `^${monthPrefix()}` } } },
        { $group: { _id: "$date", total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json(
      rows.map((row) => ({
        date: normalizeDateValue(row._id),
        total: toNumber(row.total),
      })),
    );
  }),
);

app.post(
  "/api/gym",
  asyncHandler(async (req, res) => {
    const date = req.body.date || todayDate();
    const completed = Boolean(req.body.completed);
    const sessionLabel = req.body.sessionLabel || "6-7 AM Gym";
    const notes = req.body.notes || "";

    if (!date || typeof req.body.completed !== "boolean") {
      return res
        .status(400)
        .json({ message: "date and completed are required" });
    }

    await gymLogsCollection.updateOne(
      { date },
      {
        $set: {
          completed,
          sessionLabel,
          notes,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    res.json({
      date,
      completed,
      sessionLabel,
      notes,
    });
  }),
);

app.get(
  "/api/gym",
  asyncHandler(async (_req, res) => {
    const gymLogs = await gymLogsCollection
      .find({})
      .sort({ date: -1, _id: -1 })
      .toArray();

    res.json(gymLogs.map(mapGymLog));
  }),
);

app.get(
  "/api/gym/summary",
  asyncHandler(async (_req, res) => {
    const logs = await gymLogsCollection
      .find({ date: { $gte: startOfWeekDate() } })
      .sort({ date: 1, _id: 1 })
      .toArray();

    const normalized = logs.map(mapGymLog);
    const completedDays = normalized.filter((row) => row.completed).length;

    res.json({
      completedDays,
      weeklyConsistency: Math.round((completedDays / 7) * 100),
      logs: normalized,
    });
  }),
);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message:
      error.message || "Something went wrong while processing the request.",
  });
});

app.listen(port, () => {
  console.log(`Discipline Tracker API running on port ${port}`);
  connectDatabaseWithRetry().catch(() => null);
});
