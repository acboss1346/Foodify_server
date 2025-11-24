import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/food.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";

// Load environment variables
dotenv.config();
const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser()); // Required for handling authentication cookies

// --- CORS Configuration (Fixes the recurring issue) ---

// Define allowed base origins (filter(Boolean) removes undefined/falsy values)
const allowedOrigins = [
  "http://localhost:5173", // Local client dev environment
  process.env.FRONTEND_URL, // Used if set in Render environment
  "https://foodify-final.vercel.app" // Explicit Vercel production URL
].filter(Boolean);

// CORS middleware setup
app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow requests with no origin (e.g., cURL, server-side requests)
      if (!origin) return callback(null, true);

      // 2. Check if the origin is in our explicitly allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. CRITICAL FIX: Allow all Vercel preview domains for your project.
      // Checks if the domain ends with your Vercel project's suffix.
      const projectSpecificRegex = /-acboss1346s-projects\.vercel\.app$/; 

      if (projectSpecificRegex.test(origin)) {
          return callback(null, true);
      }

      // Block all others and log the blocked origin
      console.log(`CORS Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // CRITICAL: Allows cookies/auth tokens to be sent/received
  })
);

// --- Routes ---
// Note: These routes all start with '/api' which means the client's BASE_URL 
// must end with '/api' (e.g., https://foodify-server-1.onrender.com/api)
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => res.send("Backend running"));
app.get("/ping", (req, res) => res.send("OK"));

// Server start
// Use process.env.PORT (set by Render) or fallback to 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));