const express = require("express");
const db = require("../db");

const router = express.Router();
const allowedStatuses = ["Pending", "Completed"];
const taskFields = `
  id,
  title,
  description,
  CASE
    WHEN is_daily = 1 AND completed_on = CURRENT_DATE THEN 'Completed'
    WHEN is_daily = 1 THEN 'Pending'
    ELSE status
  END AS status,
  is_daily,
  created_at
`;

function validateTask(task) {
  task = task && typeof task === "object" ? task : {};
  const title = typeof task.title === "string" ? task.title.trim() : "";
  const description =
    typeof task.description === "string" ? task.description.trim() : "";
  const status = task.status || "Pending";
  const isDaily = task.is_daily === undefined ? null : task.is_daily;

  if (!title) {
    return { error: "A task title is required." };
  }

  if (title.length > 255) {
    return { error: "The task title must be 255 characters or fewer." };
  }

  if (!allowedStatuses.includes(status)) {
    return { error: "Status must be Pending or Completed." };
  }

  if (isDaily !== null && typeof isDaily !== "boolean") {
    return { error: "Daily repeat must be true or false." };
  }

  return { task: { title, description, status, isDaily } };
}

function isValidId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

// GET /api/tasks?search=words
router.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const [tasks] = search
      ? await db.execute(
          `SELECT ${taskFields} FROM tasks WHERE title LIKE ? ORDER BY created_at DESC, id DESC`,
          [`%${search}%`]
        )
      : await db.execute(
          `SELECT ${taskFields} FROM tasks ORDER BY created_at DESC, id DESC`
        );

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Task id must be a positive number." });
  }

  try {
    const [tasks] = await db.execute(
      `SELECT ${taskFields} FROM tasks WHERE id = ?`,
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json(tasks[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
router.post("/", async (req, res, next) => {
  const result = validateTask(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const { title, description, status, isDaily } = result.task;
    const [insertResult] = await db.execute(
      `INSERT INTO tasks (title, description, status, is_daily, completed_on)
       VALUES (?, ?, ?, ?, CASE WHEN ? = 1 AND ? = 'Completed' THEN CURRENT_DATE ELSE NULL END)`,
      [title, description, status, isDaily === true, isDaily === true, status]
    );
    const [tasks] = await db.execute(
      `SELECT ${taskFields} FROM tasks WHERE id = ?`,
      [insertResult.insertId]
    );

    res.status(201).json(tasks[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Task id must be a positive number." });
  }

  const result = validateTask(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const { title, description, status, isDaily } = result.task;
    const [updateResult] = await db.execute(
      `UPDATE tasks
       SET title = ?, description = ?, status = ?,
           is_daily = COALESCE(?, is_daily),
           completed_on = CASE
             WHEN COALESCE(?, is_daily) = 1 AND ? = 'Completed' THEN CURRENT_DATE
             ELSE NULL
           END
       WHERE id = ?`,
      [title, description, status, isDaily, isDaily, status, req.params.id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    const [tasks] = await db.execute(
      `SELECT ${taskFields} FROM tasks WHERE id = ?`,
      [req.params.id]
    );

    res.json(tasks[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Task id must be a positive number." });
  }

  try {
    const [result] = await db.execute("DELETE FROM tasks WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
