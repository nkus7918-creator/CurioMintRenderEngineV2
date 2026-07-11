import express from "express";
import cors from "cors";
import renderRouter from "./routes/render.js";
import jobRouter from "./routes/job";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/jobs", jobRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/render", renderRouter);

app.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});