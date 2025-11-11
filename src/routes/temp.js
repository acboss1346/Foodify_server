import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js"; // adjust path if needed
import cors from "cors";

const app = express();

// Middleware
app.use(cors({
  origin: "*", // or your frontend URL (Render/localhost)
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("✅ Server is running fine on Render!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
