const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "3mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Descore API працює" });
});

app.use("/auth", authRoutes);
app.use("/ratings", ratingRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Некоректний JSON" });
  }

  if (error.status && error.status < 500) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Внутрішня помилка сервера" });
});

async function start() {
  await db.query("SELECT 1");
  app.listen(port, () => {
    console.log(`Descore backend запущено: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Не вдалося запустити Descore backend", error);
  db.end().finally(() => {
    process.exitCode = 1;
  });
});
