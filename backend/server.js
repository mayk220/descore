const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

const app = express();
const port = process.env.PORT || 3000;
const dataDirectory = path.join(__dirname, "data");

fs.mkdirSync(dataDirectory, { recursive: true });
["users.json", "ratings.json"].forEach((fileName) => {
  const file = path.join(dataDirectory, fileName);
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Descore API працює" });
});

app.use("/auth", authRoutes);
app.use("/ratings", ratingRoutes);

app.use((error, req, res) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Некоректний JSON" });
  }

  console.error(error);
  return res.status(500).json({ message: "Внутрішня помилка сервера" });
});

app.listen(port, () => {
  console.log(`Descore backend запущено: http://localhost:${port}`);
});
