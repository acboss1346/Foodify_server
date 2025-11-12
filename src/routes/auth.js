import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signToken } from "../utils/jwt.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hash },
      select: { id: true, username: true, email: true },
    });

    const token = signToken({ id: user.id, username: user.username });

    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "none", // ✅ cross-domain
      secure: true,     // ✅ required for HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

// ✅ Login route
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

    const token = signToken({ id: user.id, username: user.username });

    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "none", // ✅ cross-domain
      secure: true,     // ✅ required for HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("access_token", {
    sameSite: "none", // ✅ match cookie options
    secure: true,
  });
  res.json({ message: "Logged out" });
});

// ✅ Get current user
router.get("/me", (req, res) => {
  try {
    const token = req.cookies.access_token;
    if (!token) return res.json({ user: null });

    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    res.json({ user: decoded });
  } catch {
    res.json({ user: null });
  }
});

export default router;
