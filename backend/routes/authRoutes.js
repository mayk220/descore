const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { jwtSecret, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const usersFile = path.join(__dirname, "..", "data", "users.json");

function readUsers() {
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function userWithoutPassword(user) {
  return { id: user.id, email: user.email, username: user.username };
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

  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ message: "Цей email уже використовується" });
  }
  if (users.some((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase())) {
    return res.status(409).json({ message: "Email або username уже використовується" });
  }

  const user = {
    id: users.reduce((maxId, currentUser) => Math.max(maxId, currentUser.id), 0) + 1,
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash: await bcrypt.hash(password, 10),
  };

  users.push(user);
  writeUsers(users);

  return res.status(201).json({ ...userWithoutPassword(user), token: getToken(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email і пароль обов'язкові" });
  }

  const user = readUsers().find((candidate) => candidate.email === email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Неправильний email або пароль" });
  }

  return res.json({ ...userWithoutPassword(user), token: getToken(user) });
});

router.patch("/me", requireAuth, (req, res) => {
  const { username = "", email = "" } = req.body || {};
  if (typeof username !== "string" || typeof email !== "string") {
    return res.status(400).json({ message: "Username і email обов'язкові" });
  }
  const newUsername = username.trim();
  const newEmail = email.trim().toLowerCase();

  if (!newUsername || !newEmail) {
    return res.status(400).json({ message: "Username і email обов'язкові" });
  }

  const users = readUsers();
  const currentUser = users.find((user) => user.id === req.user.userId);
  if (!currentUser) {
    return res.status(404).json({ message: "Користувача не знайдено" });
  }

  const usernameTaken = users.some(
    (user) =>
      user.id !== currentUser.id && user.username.toLowerCase() === newUsername.toLowerCase(),
  );
  if (usernameTaken) {
    return res.status(409).json({ message: "Цей username уже використовується" });
  }

  const emailTaken = users.some((user) => user.id !== currentUser.id && user.email === newEmail);
  if (emailTaken) {
    return res.status(409).json({ message: "Цей email уже використовується" });
  }

  currentUser.username = newUsername;
  currentUser.email = newEmail;
  writeUsers(users);

  return res.json({ ...userWithoutPassword(currentUser), token: getToken(currentUser) });
});

module.exports = router;
