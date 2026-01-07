import {Router} from 'express';
import {createSubscription, getSubscriptions, cancelSubscription} from '../controllers/subscription.controller.js';
import {verifyJWT} from '../middlewares/verifyJWT.middleware.js';

const router=Router();
router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router
