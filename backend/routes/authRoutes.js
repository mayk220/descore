const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { jwtSecret, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

function userWithoutPassword(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar || "",
  };
}

function getToken(user) {
  return jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const { email, username, password } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !username.trim() ||
    password.length < 6
  ) {
    return res.status(400).json({
      message: "Email і username обов'язкові, пароль має містити щонайменше 6 символів",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();
  const [existingEmail] = await db.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [
    normalizedEmail,
  ]);
  if (existingEmail.length > 0) {
    return res.status(409).json({ message: "Цей email уже використовується" });
  }

  const [existingUsername] = await db.execute(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [normalizedUsername],
  );
  if (existingUsername.length > 0) {
    return res.status(409).json({ message: "Email або username уже використовується" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)",
      [normalizedEmail, normalizedUsername, passwordHash],
    );
    const [rows] = await db.execute(
      "SELECT id, email, username, avatar FROM users WHERE id = ?",
      [result.insertId],
    );
    const user = rows[0];
    return res.status(201).json({ ...userWithoutPassword(user), token: getToken(user) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email або username уже використовується" });
    }
    throw error;
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email і пароль обов'язкові" });
  }

  const [rows] = await db.execute(
    `SELECT id, email, username, password_hash AS passwordHash, avatar
     FROM users WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Неправильний email або пароль" });
  }

  return res.json({ ...userWithoutPassword(user), token: getToken(user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { username = "", email = "", avatar = "" } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof avatar !== "string"
  ) {
    return res.status(400).json({ message: "Username і email обов'язкові" });
  }

  const newUsername = username.trim();
  const newEmail = email.trim().toLowerCase();
  if (!newUsername || !newEmail) {
    return res.status(400).json({ message: "Username і email обов'язкові" });
  }
  if (avatar.length > 2_500_000) {
    return res.status(400).json({ message: "Фото завелике. Максимальний розмір — 2 МБ" });
  }

  const [currentUsers] = await db.execute(
    "SELECT id FROM users WHERE id = ? LIMIT 1",
    [req.user.userId],
  );
  if (currentUsers.length === 0) {
    return res.status(404).json({ message: "Користувача не знайдено" });
  }

  const [existingUsername] = await db.execute(
    "SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1",
    [newUsername, req.user.userId],
  );
  if (existingUsername.length > 0) {
    return res.status(409).json({ message: "Цей username уже використовується" });
  }
  const [existingEmail] = await db.execute(
    "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
    [newEmail, req.user.userId],
  );
  if (existingEmail.length > 0) {
    return res.status(409).json({ message: "Цей email уже використовується" });
  }

  try {
    await db.execute(
      "UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?",
      [newUsername, newEmail, avatar, req.user.userId],
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email або username уже використовується" });
    }
    throw error;
  }

  const [rows] = await db.execute(
    "SELECT id, email, username, avatar FROM users WHERE id = ?",
    [req.user.userId],
  );
  const user = rows[0];
  return res.json({ ...userWithoutPassword(user), token: getToken(user) });
});

module.exports = router;
