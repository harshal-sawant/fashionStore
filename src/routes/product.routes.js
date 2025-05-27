import { Router } from "express";

import {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
} from "../controllers/product.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/createProduct").post(verifyJWT, createProduct);
router.route("/getProducts").get(getAllProducts);
router.route("/getProductById/:productId").get(getProductById);
router.route("/updateProduct/:productId").put(verifyJWT, updateProduct);
router.route("/deleteProduct/:productId").delete(verifyJWT, deleteProduct);

export default router;
