import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
const prisma = new PrismaClient();

// 1. Place Order (Users)
router.post("/", requireAuth, async (req, res) => {
  const cart = await prisma.cart.findMany({
    where: { userId: req.user.id },
    include: { food: true },
  });

  if (!cart.length) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // Calculate total price and prepare order items creation data
  const total = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

  // 1A. Create the main Order record
  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      total,
      // Status defaults to PENDING
    },
  });
  
  // 1B. Prepare data to move cart items to OrderItem table
  const orderItemsData = cart.map(item => ({
    orderId: order.id,
    foodId: item.foodId,
    quantity: item.quantity,
    price: item.food.price, // Snapshot of price at time of order
  }));
  
  // 1C. Bulk create the OrderItem records
  await prisma.orderItem.createMany({
      data: orderItemsData,
  });

  // 1D. Clear the user's cart
  await prisma.cart.deleteMany({
    where: { userId: req.user.id },
  });

  res.status(201).json(order);
});

// 2. Get User Orders (Users)
router.get("/user", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    // Include the items in the order for the user to see details
    include: {
      orderItems: {
        include: { food: true },
      },
    },
  });

  res.json(orders);
});

// 3. Get ALL Orders (Admin Only) - REQUIRED FOR ADMIN PANEL
router.get("/all", requireAuth, requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" }, // Show newest orders first
    include: {
      user: { select: { username: true, email: true } }, // Include basic user info
      orderItems: {
        include: { food: true }, // Include food details for each item
      },
    },
  });

  res.json(orders);
});


// 4. Update Order Status (Admin Only)
router.put("/status/:id", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  
  // Basic validation for allowed statuses
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