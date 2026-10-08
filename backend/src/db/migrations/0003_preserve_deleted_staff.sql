-- Migration: preserve deleted staff identity
-- Audit logs survive staff deletion.
-- News survives staff deletion while preserving creator/updater identity.

PRAGMA foreign_keys = OFF;


-- =========================================================
-- 1. REBUILD NEWS TABLE
-- =========================================================

CREATE TABLE news_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,

    pinned INTEGER NOT NULL DEFAULT 0,
    pinned_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,

    -- These can become NULL after the user is deleted.
    created_by INTEGER,
    updated_by INTEGER,

    -- Permanent identity snapshots.
    created_by_name TEXT,
    created_by_email TEXT,

    updated_by_name TEXT,
    updated_by_email TEXT,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


INSERT INTO news_new (
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
)
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

    creator.name,
    creator.email,

    updater.name,
    updater.email

FROM news n

LEFT JOIN users creator
    ON creator.id = n.created_by

LEFT JOIN users updater
    ON updater.id = n.updated_by;


DROP TABLE news;

ALTER TABLE news_new
RENAME TO news;


-- =========================================================
-- 2. REBUILD AUDIT LOGS TABLE
-- =========================================================

CREATE TABLE audit_logs_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Becomes NULL when the user is deleted.
    user_id INTEGER,

    -- Permanent snapshot of who performed the action.
    user_name TEXT,
    user_email TEXT,

    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,

    details TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


INSERT INTO audit_logs_new (
    id,
    user_id,
    user_name,
    user_email,
    action,
    entity_type,
    entity_id,
    details,
    created_at
)
SELECT
    a.id,
    a.user_id,

    u.name,
    u.email,

    a.action,
    a.entity_type,
    a.entity_id,
    a.details,
    a.created_at

FROM audit_logs a

LEFT JOIN users u
    ON u.id = a.user_id;


DROP TABLE audit_logs;

ALTER TABLE audit_logs_new
RENAME TO audit_logs;


PRAGMA foreign_keys = ON;
