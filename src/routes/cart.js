import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get user cart
router.get("/", requireAuth, async (req, res) => {
  const cart = await prisma.cart.findMany({
    where: { userId: req.user.id },
    include: { food: true },
  });

  res.json(cart);
});

// Add to cart
router.post("/add", requireAuth, async (req, res) => {
  const { foodId, quantity } = req.body;

  const existing = await prisma.cart.findFirst({
    where: { userId: req.user.id, foodId },
  });

  if (existing) {
    const updated = await prisma.cart.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });

    return res.json(updated);
  }

  const cartItem = await prisma.cart.create({
    data: {
      userId: req.user.id,
      foodId,
      quantity,
    },
  });

  res.status(201).json(cartItem);
});

// Update cart quantity
router.put("/update/:id", requireAuth, async (req, res) => {
  const updated = await prisma.cart.update({
    where: { id: Number(req.params.id) },
    data: { quantity: req.body.quantity },
  });

  res.json(updated);
});

// Remove cart item
router.delete("/remove/:id", requireAuth, async (req, res) => {
  await prisma.cart.delete({
    where: { id: Number(req.params.id) },
  });

  res.json({ message: "Item removed" });
});

export default router;