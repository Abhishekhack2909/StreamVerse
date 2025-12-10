import { Router } from "express";
import { registeruser } from "../controllers/user.controllers.js";

const router = Router();
router.route("/register").post(registeruser)
//here get req of register from app .js and apply method



export default router;