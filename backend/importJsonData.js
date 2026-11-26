const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = require("./db");

function readJsonArray(fileName) {
  const filePath = path.join(__dirname, "data", fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`Файл ${fileName} відсутній — імпорт пропущено.`);
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(data)) {
    throw new Error(`${fileName} має містити JSON-масив`);
  }
  return data;
}

function validAspect(value) {
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : null;
}

function reviewFor(rating, aspect) {
  const review = rating.reviews?.[aspect];
  return typeof review === "string" ? review : null;
}

async function importJsonData() {
  const users = readJsonArray("users.json");
  const ratings = readJsonArray("ratings.json");
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    for (const user of users) {
      if (
        !Number.isInteger(user.id) ||
        user.id < 1 ||
        typeof user.email !== "string" ||
        typeof user.username !== "string" ||
        typeof user.passwordHash !== "string"
      ) {
        throw new Error("Знайдено некоректний запис користувача в users.json");
      }

      await connection.execute(
        `INSERT INTO users (id, email, username, password_hash, avatar)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [
          user.id,
          user.email.trim().toLowerCase(),
          user.username.trim(),
          user.passwordHash,
          typeof user.avatar === "string" ? user.avatar : null,
        ],
      );
    }

    for (const item of ratings) {
      if (
        !Number.isInteger(item.userId) ||
        !Number.isInteger(item.gameId) ||
        !Number.isInteger(item.rating) ||
        item.rating < 1 ||
        item.rating > 10
      ) {
        throw new Error("Знайдено некоректний запис оцінки в ratings.json");
      }

      const aspects = item.aspects || {};
      await connection.execute(
        `INSERT INTO ratings (
           user_id, game_id, rating, gameplay, story, design, music,
           gameplay_review, story_review, design_review, music_review
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = user_id`,
        [
          item.userId,
          item.gameId,
          item.rating,
          validAspect(aspects.gameplay),
          validAspect(aspects.story),
          validAspect(aspects.design),
          validAspect(aspects.music),
          reviewFor(item, "gameplay"),
          reviewFor(item, "story"),
          reviewFor(item, "design"),
          reviewFor(item, "music"),
        ],
      );
    }
    await connection.commit();
    console.log(`Імпортовано записи: користувачів — ${users.length}, оцінок — ${ratings.length}.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

importJsonData()
  .catch((error) => {
    console.error("Не вдалося імпортувати JSON-дані", error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
