import { Router } from "express";
import { registeruser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router();
router.route("/register").post(
    upload.fields([
        {name: "avatar", 
            maxCount: 1
        }, {
          name: "coverImage",
          maxCount: 1
        }
    ]),
    registeruser)
//here get req of register from app .js and apply method



export default router;