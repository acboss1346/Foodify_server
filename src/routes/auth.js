import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"; // <-- ADDED direct import for JWT

const router = express.Router();
const prisma = new PrismaClient();

// Use environment variable for secret key
const jwtSecret = process.env.JWT_SECRET || 'a_very_strong_default_secret_key'; 


router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    // Ensure the model selection is consistent (email, username, or both)
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hash, role },
      // Important: Use select to retrieve the required fields, including role and id
      select: { id: true, username: true, email: true, role: true, createdAt: true }, 
    });

    // 1. Generate JWT token using jwt.sign directly (Fix)
    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
      expiresIn: "1d", // Set expiration
    });

    // 2. Set cookie
    res.cookie("token", token, { // Renamed from access_token for consistency
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Changed from "none" to "Lax" unless you have a specific reason for cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 3. Respond with user info (without password hash)
    res.status(201).json({ user });
  } catch (err) {
    console.error("Signup failed:", err);
    // If the error is P2022 (schema mismatch), the server will crash before this point
    res.status(500).json({ message: "Signup failed (Internal Server Error)" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    // 1. Generate JWT token using jwt.sign directly (Fix)
    // IMPORTANT: Include role in the payload for protected routes
    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { 
        expiresIn: "1d",
    });

    // 2. Set cookie
    res.cookie("token", token, { // Renamed from access_token for consistency
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Changed from "none" to "Lax"
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 3. Respond with user info
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch(err) {
    console.error("Login failed:", err);
    res.status(500).json({ message: "Login failed (Internal Server Error)" });
  }
});


router.post("/logout", (req, res) => {
  // Clear the token cookie (using 'token' name for consistency)
  res.clearCookie("token", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });
  res.json({ message: "Logged out" });
});

// Removed the /me route to simplify state management and rely on token decoding client-side
// or a dedicated /verify-auth route with middleware, which is safer.

export default router;