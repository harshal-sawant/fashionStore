import { Router } from "express";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    abandonCart
} from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All cart routes require authentication
router.use(verifyJWT);

// Cart management routes
router.route("/").get(getCart);
router.route("/add").post(addToCart);
router.route("/update").patch(updateCartItem);
router.route("/remove/:productId").delete(removeFromCart);
router.route("/clear").delete(clearCart);
router.route("/abandon").patch(abandonCart);

export default router;