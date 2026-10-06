import {
  getProfile,
  getAllMedia,
  getMediaViews,
  getInstagramStats,
} from "../services/instagramService.js";

import { INSTAGRAM_ACCESS_TOKEN } from "../config/env.js";

export async function getInstagramStatsController(req, res) {
  try {
    const stats = await getInstagramStats(INSTAGRAM_ACCESS_TOKEN);

    res.json(stats);
  } catch (error) {
    console.error("Instagram stats error:", error);

    res.status(500).json({
      error: "Failed to fetch Instagram stats",
    });
  }
}

export async function getInstagramProfile(req, res) {
  try {
    const profile = await getProfile(INSTAGRAM_ACCESS_TOKEN);

    res.json(profile);
  } catch (error) {
    console.error("Instagram profile error:", error);

    res.status(500).json({
      error: "Failed to fetch Instagram profile",
    });
  }
}

export async function getInstagramMedia(req, res) {
  try {
    const media = await getAllMedia(INSTAGRAM_ACCESS_TOKEN);

    res.json({
      count: media.length,
      media,
    });
  } catch (error) {
    console.error("Instagram media error:", error);

    res.status(500).json({
      error: "Failed to fetch Instagram media",
    });
  }
}

export async function getInstagramViews(req, res) {
  try {
    const media = await getAllMedia(INSTAGRAM_ACCESS_TOKEN);

    const result = await getMediaViews(
      media,
      INSTAGRAM_ACCESS_TOKEN
    );

    res.json({
      mediaCount: media.length,
      ...result,
    });
  } catch (error) {
    console.error("Instagram views error:", error);

    res.status(500).json({
      error: "Failed to calculate Instagram views",
    });
  }
}

export async function getInstagramLikes(req, res) {
  try {
    const media = await getAllMedia(INSTAGRAM_ACCESS_TOKEN);

    const totalLikes = media.reduce(
      (total, item) => total + (item.like_count ?? 0),
      0
    );

    res.json({
      mediaCount: media.length,
      totalLikes,
    });
  } catch (error) {
    console.error("Instagram likes error:", error);

    res.status(500).json({
      error: "Failed to calculate Instagram likes",
    });
  }
}
