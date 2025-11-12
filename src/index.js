import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import 'dotenv/config';
import helmet from "helmet";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://foodify-ochre.vercel.app",
      "https://foodify-365xtxk1q-acboss1346s-projects.vercel.app",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  })
);


app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

app.get("/ping", (req, res) => {
  res.send("Sever is running .. SUCCESFULLY");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
