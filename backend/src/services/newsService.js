async function deleteNewsImage(env, imageUrl) {
  if (!imageUrl) {
    return {
      attempted: false,
      deleted: false,
      reason: "No image",
    };
  }

  try {
    const url = new URL(imageUrl);

    const publicPrefix =
      "/storage/v1/object/public/tnp-images/";

    if (!url.pathname.startsWith(publicPrefix)) {
      console.warn(
        "Skipping unknown image URL:",
        imageUrl
      );

      return {
        attempted: false,
        deleted: false,
        reason: "Unknown image URL",
      };
    }

    const filePath = decodeURIComponent(
      url.pathname.slice(publicPrefix.length)
    );

    if (!filePath) {
      return {
        attempted: false,
        deleted: false,
        reason: "Invalid image path",
      };
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/tnp-images/${filePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey: env.SUPABASE_SECRET_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Failed to delete Supabase image:",
        filePath,
        errorText
      );

      return {
        attempted: true,
        deleted: false,
        filePath,
        reason: "Supabase deletion failed",
      };
    }

    return {
      attempted: true,
      deleted: true,
      filePath,
    };
  } catch (error) {
    console.error(
      "Supabase image deletion error:",
      error
    );

    return {
      attempted: true,
      deleted: false,
      reason: "Supabase deletion error",
    };
  }
}


/* =========================================================
   GET ALL NEWS
   ========================================================= */

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

        COALESCE(
          creator.name,
          n.created_by_name
        ) AS created_by_name,

        COALESCE(
          creator.email,
          n.created_by_email
        ) AS created_by_email,

        COALESCE(
          updater.name,
          n.updated_by_name
        ) AS updated_by_name,

        COALESCE(
          updater.email,
          n.updated_by_email
        ) AS updated_by_email

      FROM news n

      LEFT JOIN users creator
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


/* =========================================================
   GET NEWS BY ID
   ========================================================= */

export async function getNewsById(
  env,
  newsId
) {
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

        COALESCE(
          creator.name,
          n.created_by_name
        ) AS created_by_name,

        COALESCE(
          creator.email,
          n.created_by_email
        ) AS created_by_email,

        COALESCE(
          updater.name,
          n.updated_by_name
        ) AS updated_by_name,

        COALESCE(
          updater.email,
          n.updated_by_email
        ) AS updated_by_email

      FROM news n

      LEFT JOIN users creator
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


/* =========================================================
   CLEANUP OLD NON-PINNED NEWS
   ========================================================= */

async function cleanupNonPinnedNews(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT
        id,
        title,
        image
      FROM news
      WHERE pinned = 0
      ORDER BY
        created_at DESC,
        id DESC
      LIMIT -1 OFFSET 30
      `
    )
    .all();

  const oldNews = result.results;

  if (oldNews.length === 0) {
    return {
      deletedIds: [],
      imageDeletionResults: [],
    };
  }

  const deletedIds = [];
  const imageDeletionResults = [];

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

    const imageDeletion =
      await deleteNewsImage(
        env,
        news.image
      );

    deletedIds.push(news.id);

    imageDeletionResults.push({
      newsId: news.id,
      title: news.title,
      ...imageDeletion,
    });
  }

  return {
    deletedIds,
    imageDeletionResults,
  };
}


/* =========================================================
   CREATE NEWS
   ========================================================= */

export async function createNews(
  env,
  {
    title,
    content,
    image,
    createdBy,
  }
) {
  /*
   * Get the creator's identity now.
   *
   * This snapshot remains even if the user
   * is deleted later.
   */

  const creator = await env.DB
    .prepare(
      `
      SELECT
        name,
        email
      FROM users
      WHERE id = ?
      `
    )
    .bind(createdBy)
    .first();

  if (!creator) {
    return {
      error: "Creator account not found",
      status: 404,
    };
  }

  const news = await env.DB
    .prepare(
      `
      INSERT INTO news (
        title,
        content,
        image,
        created_by,
        created_by_name,
        created_by_email
      )
      VALUES (?, ?, ?, ?, ?, ?)

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
        updated_by,
        created_by_name,
        created_by_email,
        updated_by_name,
        updated_by_email
      `
    )
    .bind(
      title,
      content,
      image ?? null,
      createdBy,
      creator.name,
      creator.email
    )
    .first();

  const cleanupResult =
    await cleanupNonPinnedNews(env);

  return {
    news,
    deletedIds:
      cleanupResult.deletedIds,
    imageDeletionResults:
      cleanupResult.imageDeletionResults,
  };
}


/* =========================================================
   UPDATE NEWS
   ========================================================= */

export async function updateNews(
  env,
  newsId,
  {
    title,
    content,
    image,
    updatedBy,
  }
) {
  const existing =
    await getNewsById(
      env,
      newsId
    );

  if (!existing) {
    return null;
  }

  /*
   * Get the editor's identity so we can
   * preserve it permanently.
   */

  const updater = await env.DB
    .prepare(
      `
      SELECT
        name,
        email
      FROM users
      WHERE id = ?
      `
    )
    .bind(updatedBy)
    .first();

  if (!updater) {
    return {
      error: "Updater account not found",
      status: 404,
    };
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
        updated_by = ?,
        updated_by_name = ?,
        updated_by_email = ?

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
        updated_by,
        created_by_name,
        created_by_email,
        updated_by_name,
        updated_by_email
      `
    )
    .bind(
      title,
      content,
      image ?? null,
      updatedBy,
      updater.name,
      updater.email,
      newsId
    )
    .first();

  /*
   * Delete the old Supabase image if it
   * was replaced or removed.
   */

  let imageDeletion = null;

  if (
    existing.image &&
    existing.image !== news.image
  ) {
    imageDeletion =
      await deleteNewsImage(
        env,
        existing.image
      );
  }

  return {
    news,
    imageDeletion,
  };
}


/* =========================================================
   DELETE NEWS
   ========================================================= */

export async function deleteNews(
  env,
  newsId
) {
  const existing =
    await getNewsById(
      env,
      newsId
    );

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

  const imageDeletion =
    await deleteNewsImage(
      env,
      existing.image
    );

  return {
    ...existing,
    imageDeletion,
  };
}


/* =========================================================
   TOGGLE NEWS PIN
   ========================================================= */

export async function toggleNewsPin(
  env,
  newsId
) {
  const existing =
    await getNewsById(
      env,
      newsId
    );

  if (!existing) {
    return null;
  }

  const newPinnedState =
    existing.pinned ? 0 : 1;

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
        updated_by,
        created_by_name,
        created_by_email,
        updated_by_name,
        updated_by_email
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

  /*
   * If a pinned article was unpinned,
   * enforce the 30 non-pinned limit.
   */

  const cleanupResult =
    newPinnedState === 0
      ? await cleanupNonPinnedNews(env)
      : {
          deletedIds: [],
          imageDeletionResults: [],
        };

  return {
    news,
    previousPinned:
      existing.pinned,
    pinned:
      newPinnedState,
    deletedIds:
      cleanupResult.deletedIds,
    imageDeletionResults:
      cleanupResult.imageDeletionResults,
  };
}
