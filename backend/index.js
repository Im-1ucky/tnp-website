import express from "express";
import "dotenv/config";

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.json({
    message: "TnP backend is running",
  });
});

app.get("/api/instagram/profile", async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;

    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count&access_token=${token}`
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch Instagram data",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
