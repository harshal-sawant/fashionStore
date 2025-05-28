import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getSubCategories
} from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:categoryId", getCategoryById);
router.get("/:categoryId/subcategories", getSubCategories);

// Protected routes (admin only)
router.use(verifyJWT);
router.post("/", createCategory);
router.patch("/:categoryId", updateCategory);
router.delete("/:categoryId", deleteCategory);

export default router;