// =========================
// RECORD VISIT
// =========================

export async function recordVisit(env) {
  await env.DB
    .prepare(
      `
      INSERT INTO visits (visited_at)
      VALUES (CURRENT_TIMESTAMP)
      `
    )
    .run();
}


// =========================
// GET VISIT STATS
// =========================

export async function getVisitStats(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT
        COUNT(
          CASE
            WHEN date(visited_at) = date('now')
            THEN 1
          END
        ) AS today,

        COUNT(
          CASE
            WHEN date(visited_at) >= date('now', 'weekday 0', '-6 days')
            THEN 1
          END
        ) AS week,

        COUNT(
          CASE
            WHEN strftime('%Y-%m', visited_at) =
                 strftime('%Y-%m', 'now')
            THEN 1
          END
        ) AS month

      FROM visits
      `
    )
    .first();

  return {
    today: result?.today ?? 0,
    week: result?.week ?? 0,
    month: result?.month ?? 0,
  };
}


// =========================
// GET DAILY VISITS
// =========================

export async function getDailyVisits(env, days) {
  const safeDays = Math.min(
    Math.max(Number(days) || 7, 1),
    365
  );

  const result = await env.DB
    .prepare(
      `
      SELECT
        date(visited_at) AS date,
        COUNT(*) AS visits
      FROM visits
      WHERE visited_at >= datetime(
        'now',
        ?
      )
      GROUP BY date(visited_at)
      ORDER BY date(visited_at) ASC
      `
    )
    .bind(`-${safeDays - 1} days`)
    .all();

  return result.results;
}
