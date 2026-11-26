const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const aspectNames = ["gameplay", "story", "design", "music"];
const reviewColumn = {
  gameplay: "gameplay_review",
  story: "story_review",
  design: "design_review",
  music: "music_review",
};

function validRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

function average(value) {
  return value == null ? 0 : Number(Number(value).toFixed(2));
}

function formatRating(row) {
  const aspects = {};
  const reviews = {};
  for (const aspect of aspectNames) {
    aspects[aspect] = row[aspect];
    reviews[aspect] = row[reviewColumn[aspect]] || "";
  }
  return {
    userId: row.user_id,
    gameId: row.game_id,
    rating: row.rating,
    aspects,
    reviews,
  };
}

router.post("/", requireAuth, async (req, res) => {
  const body = req.body || {};
  const gameId = Number(body.gameId);
  const rating = Number(body.rating);
  const aspects = {};
  const reviews = {};

  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }
  if (!validRating(rating)) {
    return res.status(400).json({ message: "rating має бути цілим числом від 1 до 10" });
  }

  for (const aspect of aspectNames) {
    const aspectRating = Number(body.aspects?.[aspect]);
    if (!validRating(aspectRating)) {
      return res.status(400).json({
        message: "Кожна оцінка аспекту має бути цілим числом від 1 до 10",
      });
    }

    const review = body.reviews?.[aspect] ?? "";
    if (typeof review !== "string" || review.length > 10000) {
      return res.status(400).json({ message: "Текст відгуку має бути рядком до 10000 символів" });
    }
    aspects[aspect] = aspectRating;
    reviews[aspect] = review.trim();
  }

  await db.execute(
    `INSERT INTO ratings (
       user_id, game_id, rating, gameplay, story, design, music,
       gameplay_review, story_review, design_review, music_review
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) AS incoming
     ON DUPLICATE KEY UPDATE
       rating = incoming.rating,
       gameplay = incoming.gameplay,
       story = incoming.story,
       design = incoming.design,
       music = incoming.music,
       gameplay_review = incoming.gameplay_review,
       story_review = incoming.story_review,
       design_review = incoming.design_review,
       music_review = incoming.music_review`,
    [
      req.user.userId,
      gameId,
      rating,
      aspects.gameplay,
      aspects.story,
      aspects.design,
      aspects.music,
      reviews.gameplay,
      reviews.story,
      reviews.design,
      reviews.music,
    ],
  );

  const [rows] = await db.execute(
    "SELECT * FROM ratings WHERE user_id = ? AND game_id = ? LIMIT 1",
    [req.user.userId, gameId],
  );
  return res.json({ message: "Оцінку збережено", rating: formatRating(rows[0]) });
});

router.get("/me/:gameId", requireAuth, async (req, res) => {
  const gameId = Number(req.params.gameId);
  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }

  const [rows] = await db.execute(
    "SELECT * FROM ratings WHERE user_id = ? AND game_id = ? LIMIT 1",
    [req.user.userId, gameId],
  );
  return res.json(rows[0] ? formatRating(rows[0]) : { gameId, rating: null });
});

router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await db.execute(
    "SELECT * FROM ratings WHERE user_id = ? ORDER BY updated_at DESC",
    [req.user.userId],
  );
  return res.json({ ratings: rows.map(formatRating) });
});

router.delete("/:gameId", requireAuth, async (req, res) => {
  const gameId = Number(req.params.gameId);
  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }

  await db.execute("DELETE FROM ratings WHERE user_id = ? AND game_id = ?", [
    req.user.userId,
    gameId,
  ]);
  return res.json({ message: "Оцінку видалено" });
});

router.get("/:gameId", async (req, res) => {
  const gameId = Number(req.params.gameId);
  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }

  const [rows] = await db.execute(
    `SELECT
       COUNT(*) AS votesCount,
       AVG(rating) AS averageRating,
       AVG(COALESCE(gameplay, rating)) AS gameplay,
       AVG(COALESCE(story, rating)) AS story,
       AVG(COALESCE(design, rating)) AS design,
       AVG(COALESCE(music, rating)) AS music
     FROM ratings WHERE game_id = ?`,
    [gameId],
  );
  const stats = rows[0];
  return res.json({
    gameId,
    averageRating: average(stats.averageRating),
    votesCount: Number(stats.votesCount),
    aspectAverages: {
      gameplay: average(stats.gameplay),
      story: average(stats.story),
      design: average(stats.design),
      music: average(stats.music),
    },
  });
});

module.exports = router;
