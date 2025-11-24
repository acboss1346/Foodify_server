import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/food.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";
// ... existing imports ...

dotenv.config();
const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Define allowed origins for the server
const allowedOrigins = [
  "http://localhost:5173", // Local client dev environment
  process.env.FRONTEND_URL, // Used by Render from your env variable
  "https://foodify-final.vercel.app" // Explicitly define the Vercel production URL (no trailing slash)
];

// ----------------------------------------------------------------
// NOTE: Use a function for 'origin' to handle undefined origins (like some mobile requests)
// and filter out the undefined environment variable if it's missing.
// This is the robust way to handle multiple origins and variables.
// ----------------------------------------------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., cURL, same-origin requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in our allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Log the blocked origin for debugging
        console.log(`CORS Blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ... rest of your code ...
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => res.send("Backend running"));
app.get("/ping", (req, res) => res.send("OK"));

// Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));