import express from "express";
import generateRoute from "./routes/generate.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/generate", generateRoute);

app.listen(3000, () => {
  console.log("🚀 AI Music Server running on port 3000");
});