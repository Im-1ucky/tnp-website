import { Router } from "express";
import {
  getInstagramProfile,
  getInstagramMedia,
  getInstagramLikes,
  getInstagramViews,
  getInstagramStatsController,
} from "../controllers/instagramController.js";

const router = Router();

router.get("/profile", getInstagramProfile);
router.get("/media", getInstagramMedia);
router.get("/likes", getInstagramLikes);
router.get("/views", getInstagramViews);
router.get("/stats", getInstagramStatsController);

export default router;
