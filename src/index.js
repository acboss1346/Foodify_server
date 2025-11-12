import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import 'dotenv/config';
import helmet from "helmet";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

// Security middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://foodify-ochre.vercel.app", // optional test frontend
      "https://foodify-365xtxk1q-acboss1346s-projects.vercel.app", // production frontend
      process.env.FRONTEND_URL, // optional env variable
    ],
    credentials: true, // required for cookies
  })
);

// Auth routes
app.use("/api/auth", authRoutes);

// Test routes
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

app.get("/ping", (req, res) => {
  res.send("Server is running .. SUCCESSFULLY");
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
