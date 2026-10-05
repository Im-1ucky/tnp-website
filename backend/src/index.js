import express from "express";
import "./config/env.js";
import instagramRoutes from "./routes/instagramRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "TnP backend is running",
  });
});

app.use("/api/instagram", instagramRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
