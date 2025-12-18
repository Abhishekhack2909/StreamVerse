import { Router } from "express";
import {
  logoutuser,
  registeruser,
  loginuser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registeruser
);
//here get req of register from app .js and apply method

//router for login
router.route("/login").post(loginuser);

router.route("/logout").post(verifyJWT, logoutuser);

export default router;
