const GRAPH_URL = "https://graph.instagram.com";

async function instagramRequest(endpoint, accessToken) {
  const url = new URL(`${GRAPH_URL}${endpoint}`);

  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Instagram API request failed"
    );
  }

  return data;
}

export async function getProfile(accessToken) {
  return instagramRequest(
    "/me?fields=id,username,account_type,media_count,followers_count",
    accessToken
  );
}

export async function getAllMedia(accessToken) {
  const fields = [
    "id",
    "media_type",
    "username",
    "timestamp",
    "like_count",
    "comments_count",
    "permalink",
  ].join(",");

  let url = new URL(`${GRAPH_URL}/me/media`);

  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", accessToken);

  const media = [];

  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Instagram media request failed"
      );
    }

    media.push(...(data.data ?? []));

    url = data.paging?.next
      ? new URL(data.paging.next)
      : null;
  }

  return media;
}

export async function getMediaViews(media, accessToken) {
  let totalViews = 0;
  let processed = 0;
  let failed = 0;

  for (const item of media) {
    if (item.media_type !== "VIDEO") {
      continue;
    }

    try {
      const data = await instagramRequest(
        `/${item.id}/insights?metric=views`,
        accessToken
      );

      const views = data.data?.find(
        (metric) => metric.name === "views"
      );

      if (views) {
        totalViews += views.values?.[0]?.value ?? 0;
      }

      processed++;
    } catch (error) {
      console.error(
        `Failed to fetch views for media ${item.id}:`,
        error.message
      );

      failed++;
    }
  }

  return {
    totalViews,
    processed,
    failed,
  };
}

export async function getInstagramStats(accessToken) {
  const profile = await getProfile(accessToken);
  const media = await getAllMedia(accessToken);

  const totalLikes = media.reduce(
    (total, item) => total + (item.like_count ?? 0),
    0
  );

  const videoMedia = media.filter(
    (item) => item.media_type === "VIDEO"
  );

  const { totalViews, processed, failed } =
    await getMediaViews(videoMedia, accessToken);

  return {
    followers: profile.followers_count,
    likes: totalLikes,
    views: totalViews,
    mediaCount: media.length,
    videoCount: videoMedia.length,
    viewsProcessed: processed,
    viewsFailed: failed,
  };
}
