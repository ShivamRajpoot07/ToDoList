require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const db = require("./db");
const taskRoutes = require("./routes/tasks");

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendDirectory = [
  path.join(__dirname, "..", "frontend"),
  path.join(__dirname, "frontend"),
].find((directory) => fs.existsSync(path.join(directory, "index.html")));

async function ensureTaskSchema() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
      is_daily TINYINT(1) NOT NULL DEFAULT 0,
      completed_on DATE NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  const [columns] = await db.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'tasks'
       AND COLUMN_NAME IN ('is_daily', 'completed_on')`
  );
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existingColumns.has("is_daily")) {
    await db.query(
      "ALTER TABLE tasks ADD COLUMN is_daily TINYINT(1) NOT NULL DEFAULT 0"
    );
  }

  if (!existingColumns.has("completed_on")) {
    await db.query("ALTER TABLE tasks ADD COLUMN completed_on DATE NULL");
  }
}

app.use(express.json());
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/tasks", taskRoutes);
if (frontendDirectory) {
  app.use(express.static(frontendDirectory));
}

// Keep API errors in JSON so the frontend can show a useful message.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }

  console.error("Request failed:", error);
  res.status(500).json({ error: "Something went wrong on the server." });
});

async function startServer() {
  if (!frontendDirectory) {
    console.error(
      "Could not find frontend/index.html. Include the frontend folder in the deployment."
    );
    process.exitCode = 1;
    return;
  }

  const missingSettings = ["DB_HOST", "DB_USER", "DB_NAME"].filter(
    (setting) => !process.env[setting]?.trim()
  );

  if (missingSettings.length > 0) {
    console.error(
      `Missing ${missingSettings.join(", ")}. Create backend/.env from backend/.env.example and fill in your MySQL settings.`
    );
    process.exitCode = 1;
    return;
  }

  try {
    await db.query("SELECT 1");
  } catch (error) {
    console.error(
      "Could not connect to MySQL. Check your credentials in backend/.env and make sure MySQL is running."
    );
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  try {
    await ensureTaskSchema();
  } catch (error) {
    console.error(
      "Could not update the task database schema. Make sure backend/database.sql has been run and the database user can alter the tasks table."
    );
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`My Workspace is running at http://localhost:${port}`);
  });

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Stop the other server or set PORT to an available port in backend/.env.`
      );
    } else {
      console.error("Could not start the HTTP server:", error);
    }

    try {
      await db.end();
    } catch (shutdownError) {
      console.error("Could not close the MySQL connection pool:", shutdownError);
    }

    process.exitCode = 1;
  });
}

startServer();
