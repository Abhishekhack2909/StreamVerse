import { Router } from "express";
import {
  logoutuser,
  registeruser,
  loginuser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  watchhistory

} from "../controllers/user.controllers.js";

import { upload } from "../middlewares/multer.middleware.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import { verify } from "crypto";
const router = Router();


//router for register
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

router.route("/refreshAccessToken").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changePassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-details").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvatar);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"), updateUserCover )

router.route("/c/:username").get(verifyJWT,getUserChannelProfile );

router.route("/history").get(verifyJWT, watchhistory)

export default router;
