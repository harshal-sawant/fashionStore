import { Router } from "express";
import {
  registerUser,
  getUsers,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
} from "../controllers/user.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/getusers").get(verifyJWT, verifyAdmin, getUsers);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword); 

export default router;
