import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET All food items
router.get("/", async (req, res) => {
  const foods = await prisma.foodItem.findMany();
  res.json(foods);
});

// GET single food item
router.get("/:id", async (req, res) => {
  const food = await prisma.foodItem.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!food) return res.status(404).json({ message: "Not found" });
  res.json(food);
});

// ADD food (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, price, imageUrl, category } = req.body;

  const item = await prisma.foodItem.create({
    data: { name, price, imageUrl, category },
  });

  res.status(201).json(item);
});

// UPDATE food (Admin)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, price, imageUrl, category } = req.body;

  const updated = await prisma.foodItem.update({
    where: { id: Number(req.params.id) },
    data: { name, price, imageUrl, category },
  });

  res.json(updated);
});

// DELETE food (Admin)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await prisma.foodItem.delete({
    where: { id: Number(req.params.id) },
  });

  res.json({ message: "Food item deleted" });
});

export default router;
