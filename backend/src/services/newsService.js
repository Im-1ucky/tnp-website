export async function getAllNews(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT
        n.id,
        n.title,
        n.content,
        n.image,
        n.pinned,
        n.pinned_at,
        n.created_at,
        n.updated_at,
        n.created_by,
        n.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM news n
      JOIN users creator
        ON creator.id = n.created_by
      LEFT JOIN users updater
        ON updater.id = n.updated_by
      ORDER BY
        n.pinned DESC,
        n.pinned_at DESC,
        n.created_at DESC
      `
    )
    .all();

  return result.results;
}

export async function getNewsById(env, newsId) {
  const news = await env.DB
    .prepare(
      `
      SELECT
        n.id,
        n.title,
        n.content,
        n.image,
        n.pinned,
        n.pinned_at,
        n.created_at,
        n.updated_at,
        n.created_by,
        n.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM news n
      JOIN users creator
        ON creator.id = n.created_by
      LEFT JOIN users updater
        ON updater.id = n.updated_by
      WHERE n.id = ?
      `
    )
    .bind(newsId)
    .first();

  return news;
}

async function cleanupNonPinnedNews(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT id
      FROM news
      WHERE pinned = 0
      ORDER BY created_at DESC, id DESC
      LIMIT -1 OFFSET 30
      `
    )
    .all();

  const oldNews = result.results;

  if (oldNews.length === 0) {
    return [];
  }

  const deletedIds = [];

  for (const news of oldNews) {
    await env.DB
      .prepare(
        `
        DELETE FROM news
        WHERE id = ?
        `
      )
      .bind(news.id)
      .run();

    deletedIds.push(news.id);
  }

  return deletedIds;
}

export async function createNews(
  env,
  { title, content, image, createdBy }
) {
  const news = await env.DB
    .prepare(
      `
      INSERT INTO news (
        title,
        content,
        image,
        created_by
      )
      VALUES (?, ?, ?, ?)
      RETURNING
        id,
        title,
        content,
        image,
        pinned,
        pinned_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
    )
    .bind(
      title,
      content,
      image ?? null,
      createdBy
    )
    .first();

  const deletedIds = await cleanupNonPinnedNews(env);

  return {
    news,
    deletedIds,
  };
}

export async function updateNews(
  env,
  newsId,
  { title, content, image, updatedBy }
) {
  const existing = await getNewsById(env, newsId);

  if (!existing) {
    return null;
  }

  const news = await env.DB
    .prepare(
      `
      UPDATE news
      SET
        title = ?,
        content = ?,
        image = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
      RETURNING
        id,
        title,
        content,
        image,
        pinned,
        pinned_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
    )
    .bind(
      title,
      content,
      image ?? null,
      updatedBy,
      newsId
    )
    .first();

  return {
    news,
  };
}

export async function deleteNews(env, newsId) {
  const existing = await getNewsById(env, newsId);

  if (!existing) {
    return null;
  }

  await env.DB
    .prepare(
      `
      DELETE FROM news
      WHERE id = ?
      `
    )
    .bind(newsId)
    .run();

  return existing;
}

export async function toggleNewsPin(
  env,
  newsId
) {
  const existing = await getNewsById(env, newsId);

  if (!existing) {
    return null;
  }

  const newPinnedState = existing.pinned ? 0 : 1;

  const news = await env.DB
    .prepare(
      `
      UPDATE news
      SET
        pinned = ?,
        pinned_at = ?
      WHERE id = ?
      RETURNING
        id,
        title,
        content,
        image,
        pinned,
        pinned_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
    )
    .bind(
      newPinnedState,
      newPinnedState
        ? new Date().toISOString()
        : null,
      newsId
    )
    .first();

  // If a pinned article was unpinned, make sure
  // the non-pinned limit is still respected.
  const deletedIds = newPinnedState === 0
    ? await cleanupNonPinnedNews(env)
    : [];

  return {
    news,
    previousPinned: existing.pinned,
    pinned: newPinnedState,
    deletedIds,
  };
}
