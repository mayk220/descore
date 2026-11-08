const express = require("express");
const fs = require("fs");
const path = require("path");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const ratingsFile = path.join(__dirname, "..", "data", "ratings.json");

function readRatings() {
  return JSON.parse(fs.readFileSync(ratingsFile, "utf8"));
}

function writeRatings(ratings) {
  fs.writeFileSync(ratingsFile, JSON.stringify(ratings, null, 2));
}

function validRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

function average(values) {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

router.post("/", requireAuth, (req, res) => {
  const body = req.body || {};
  const gameId = Number(body.gameId);
  const rating = Number(body.rating);
  const aspects = {
    gameplay: Number(body.aspects?.gameplay),
    story: Number(body.aspects?.story),
    design: Number(body.aspects?.design),
    music: Number(body.aspects?.music),
  };

  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }

  if (!validRating(rating)) {
    return res.status(400).json({ message: "rating має бути цілим числом від 1 до 10" });
  }

  if (Object.values(aspects).some((aspectRating) => !validRating(aspectRating))) {
    return res.status(400).json({
      message: "Кожна оцінка аспекту має бути цілим числом від 1 до 10",
    });
  }

  const ratings = readRatings();
  const existingRatingIndex = ratings.findIndex(
    (item) => item.userId === req.user.userId && item.gameId === gameId,
  );
  const nextRating = { userId: req.user.userId, gameId, rating, aspects };

  if (existingRatingIndex === -1) {
    ratings.push(nextRating);
  } else {
    ratings[existingRatingIndex] = nextRating;
  }

  writeRatings(ratings);
  return res.json({ message: "Оцінку збережено", rating: nextRating });
});

router.get("/me/:gameId", requireAuth, (req, res) => {
  const gameId = Number(req.params.gameId);

  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }

  const rating = readRatings().find(
    (item) => item.userId === req.user.userId && item.gameId === gameId,
  );

  return res.json({ gameId, rating: rating?.rating ?? null });
});

router.get("/me", requireAuth, (req, res) => {
  const ratings = readRatings().filter((item) => item.userId === req.user.userId);
  return res.json({ ratings });
});

router.get("/:gameId", (req, res) => {
  const gameId = Number(req.params.gameId);

  if (!Number.isInteger(gameId) || gameId < 1) {
    return res.status(400).json({ message: "gameId має бути додатним цілим числом" });
  }

  const gameRatings = readRatings().filter((item) => item.gameId === gameId);
  const votesCount = gameRatings.length;
  const averageRating = average(gameRatings.map((item) => item.rating));
  const aspectAverages = {};
  for (const aspect of ["gameplay", "story", "design", "music"]) {
    const aspectRatings = gameRatings
      .map((item) => item.aspects?.[aspect] ?? item.rating)
      .filter((value) => Number.isInteger(value));
    aspectAverages[aspect] = average(aspectRatings);
  }

  return res.json({ gameId, averageRating, votesCount, aspectAverages });
});

module.exports = router;
