import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
const prisma = new PrismaClient();

// Place order
router.post("/", requireAuth, async (req, res) => {
  const cart = await prisma.cart.findMany({
    where: { userId: req.user.id },
    include: { food: true },
  });

  if (!cart.length) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const total = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      total,
    },
  });

  await prisma.cart.deleteMany({
    where: { userId: req.user.id },
  });

  res.status(201).json(order);
});

// Get user orders
router.get("/user", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
});

// Update order status (Admin)
router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const updated = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { status: req.body.status },
  });

  res.json(updated);
});

export default router;
