-- Migration number: 0001    2026-10-06T15:02:29.848Z

-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK (role IN ('admin', 'editor')),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);


-- =========================
-- SESSIONS
-- =========================

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,

    user_id INTEGER NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================
-- NEWS
-- =========================

CREATE TABLE news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,

    pinned INTEGER NOT NULL DEFAULT 0,
    pinned_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,

    created_by INTEGER NOT NULL,
    updated_by INTEGER,

    FOREIGN KEY (created_by)
        REFERENCES users(id),

    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);


-- =========================
-- AUDIT LOGS
-- =========================

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,

    details TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);
