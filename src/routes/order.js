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
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {

      const searchId = parseInt(search);
      if (!isNaN(searchId)) {
        where.id = searchId;
      } else {

        where.user = {
          username: { contains: search, mode: "insensitive" }
        };
      }
    }

    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { username: true, email: true } },
        orderItems: {
          include: { food: true },
        },
      },
    });

    res.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
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