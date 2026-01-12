import { Router } from "express";
import {
  startStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamByKey,
  updateStream,
  getMyStreams,
  deleteStream,
  createRoom,
  getRoomById,
} from "../controllers/stream.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes - specific routes MUST come before parameterized routes
router.route("/live").get(getLiveStreams);
router.route("/key/:streamKey").get(getStreamByKey);
router.route("/room/:roomId").get(getRoomById);

// Protected routes
router.use(verifyJWT);

router.route("/").post(startStream);
router.route("/room").post(createRoom);
router.route("/my-streams").get(getMyStreams);
router.route("/:streamId/end").post(endStream);
router.route("/:streamId").get(getStreamById).patch(updateStream).delete(deleteStream);

export default router;
