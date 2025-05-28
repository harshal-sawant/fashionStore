import { Router } from "express";
import {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrders
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// User routes (protected)
router.use(verifyJWT); // Apply verifyJWT middleware to all routes

router.route("/create").post(createOrder);
router.route("/user-orders").get(getUserOrders);
router.route("/order/:orderId").get(getOrderById);

// Admin routes (protected + admin only)
router.route("/all").get(getAllOrders);
router.route("/status/:orderId").patch(updateOrderStatus);
router.route("/payment-status/:orderId").patch(updatePaymentStatus);

export default router;