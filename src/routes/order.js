import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
const prisma = new PrismaClient();

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
  

  const orderItemsData = cart.map(item => ({
    orderId: order.id,
    foodId: item.foodId,
    quantity: item.quantity,
    price: item.food.price, 
  }));
  
  await prisma.orderItem.createMany({
      data: orderItemsData,
  });

  await prisma.cart.deleteMany({
    where: { userId: req.user.id },
  });

  res.status(201).json(order);
});

router.get("/user", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: { food: true },
      },
    },
  });

  res.json(orders);
});

router.get("/all", requireAuth, requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" }, 
    include: {
      user: { select: { username: true, email: true } },
      orderItems: {
        include: { food: true }, 
      },
    },
  });

  res.json(orders);
});

router.put("/status/:id", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  
  if (!["PENDING", "CONFIRMED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const updated = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: status },
    });
    res.json(updated);
  } catch (error) {
    res.status(404).json({ message: "Order not found or update failed." });
  }
});

export default router;