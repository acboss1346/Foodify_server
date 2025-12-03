import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
const prisma = new PrismaClient();


router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "id";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const category = req.query.category || "";

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const total = await prisma.foodItem.count({ where });
    const foods = await prisma.foodItem.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      data: foods,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching foods:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  const food = await prisma.foodItem.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!food) return res.status(404).json({ message: "Not found" });
  res.json(food);
});


router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, price, imageUrl, category } = req.body;

  const item = await prisma.foodItem.create({
    data: { name, price, imageUrl, category },
  });

  res.status(201).json(item);
});


router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, price, imageUrl, category } = req.body;

  const updated = await prisma.foodItem.update({
    where: { id: Number(req.params.id) },
    data: { name, price, imageUrl, category },
  });

  res.json(updated);
});


router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);


    await prisma.cart.deleteMany({ where: { foodId: id } });


    await prisma.orderItem.deleteMany({ where: { foodId: id } });


    await prisma.foodItem.delete({
      where: { id },
    });

    res.json({ message: "Food item deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

export default router;