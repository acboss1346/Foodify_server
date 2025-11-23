import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signToken, verifyToken } from "../utils/jwt.js"; 
// The import 'verify' from "jsonwebtoken" is redundant if using verifyToken, so I'll remove it below for cleanliness.

const router = express.Router();
const prisma = new PrismaClient();

// Helper for setting cookie max age (7 days in milliseconds)
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;


router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hash, role },
      // FIX: Simplifies the select block to prevent the P2009 error on deployment
      select: { id: true, username: true, email: true, role: true }, 
    });

    // Uses the signToken utility function
    const token = signToken({ userId: user.id, role: user.role });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", 
      maxAge: SEVEN_DAYS_MS, 
    });

    res.status(201).json({ user });
  } catch (err) {
    console.error("Signup failed:", err);
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

    // Uses the signToken utility function
    const token = signToken({ userId: user.id, role: user.role });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: SEVEN_DAYS_MS, 
    });

    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch(err) {
    console.error("Login failed:", err);
    res.status(500).json({ message: "Login failed (Internal Server Error)" });
  }
});


router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });
  res.json({ message: "Logged out" });
});


router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(200).json({ user: null });

  try {
    // Uses the verifyToken utility function
    const decoded = verifyToken(token);

    // Responds with the token payload (user ID and role)
    res.status(200).json({ user: { id: decoded.userId, role: decoded.role } });
  } catch (err) {
    // Token is expired or invalid
    res.clearCookie("token", { secure: process.env.NODE_ENV === "production", sameSite: "Lax" });
    res.status(200).json({ user: null });
  }
});

export default router;