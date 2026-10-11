# T&P | GPREC — Backend

The backend API for the official **Training & Placement Club** website of **G. Pulla Reddy Engineering College (Autonomous), Kurnool**.

The backend runs on **Cloudflare Workers** and handles authentication, news management, staff administration, audit logs, analytics, and Instagram statistics.

**Live website:** https://tnp-website.tnpwebsite2026.workers.dev/

## Tech Stack

- **Cloudflare Workers** — Serverless backend API
- **Cloudflare D1** — Relational database for application data
- **Cloudflare Workers KV** — Key-value storage for Instagram statistics
- **Supabase Storage** — Storage for dynamically uploaded news images
- **Bun** — Package management, scripts, and testing
- **Wrangler** — Local development and Cloudflare deployment

## Prerequisites

- [Bun](https://bun.sh/)
- A Cloudflare account with access to the project's Workers, D1 database, and KV namespace
- Supabase project credentials for image-storage operations
- Instagram Graph API credentials for refreshing Instagram statistics

## Getting Started

Clone the repository and navigate to the backend directory:

```bash
git clone https://github.com/tnp-website/tnp-website.git
cd tnp-website/backend
```

Install dependencies:

```bash
bun install
```

### Local Development

Start the Worker using Wrangler:

```bash
bunx wrangler dev
```

Wrangler reads the configuration from `wrangler.jsonc`.

Configure the required local bindings and credentials before testing integrations. Some features may require access to the configured Cloudflare resources or valid third-party credentials.

## Available Commands

Run these commands from the `backend/` directory.

| Command | Description |
|---|---|
| `bunx wrangler dev` | Start the local Cloudflare Worker |
| `bun run test` | Run the configured test script |
| `bun test` | Run Bun's test runner directly |
| `bunx wrangler deploy` | Deploy the Worker to Cloudflare |

The test commands use the existing project test setup. Run tests before deploying backend changes.

## Architecture and Responsibilities

### Authentication and Authorization

- Handles login and logout.
- Manages authenticated sessions using cookies.
- Protects administrative endpoints.
- Restricts administrative operations according to user roles.

### News Management

- Retrieves news for public display.
- Allows authorized Admin and Editor users to create, update, and delete news.
- Supports pinned news functionality.
- Stores news records in Cloudflare D1.
- Uses Supabase Storage for uploaded news images.

### Staff Management

- Allows Admin users to manage staff accounts and roles.
- Applies authorization checks to staff-management operations.

### Audit Logs and Analytics

- Records relevant administrative actions.
- Provides audit-log access to authorized administrators.
- Supports website analytics and visit records.

### Instagram Statistics

- Retrieves Instagram statistics through the Instagram Graph API.
- Stores the latest successful statistics in Cloudflare Workers KV.
- Uses a scheduled Worker task to refresh the statistics.

## Database and Migrations

Database migrations are maintained in:

```text
src/db/migrations/
```

Use Wrangler to inspect and apply migrations as appropriate for your environment.

Before applying migrations, verify the target database and environment. Avoid running local-development commands against production resources unintentionally.

## Scheduled Tasks

Cron Triggers are configured in `wrangler.jsonc`.

The configured schedule is intended to support:

- **Hourly:** Refresh Instagram statistics.
- **Daily:** Delete audit-log records older than 90 days.

Scheduled tasks run in the deployed Worker according to its configured Cron Triggers. Ensure the updated Worker and cron configuration have been deployed before relying on these tasks in production.

## Environment Variables and Secrets

The backend integrates with services that require sensitive credentials, including Instagram and Supabase.

Configure secrets through Cloudflare Worker secrets and use appropriate local configuration for development.

Never commit secrets, access tokens, passwords, or private credentials to Git. Do not expose them through frontend code or logs.

GitHub Actions deployment also requires the appropriate Cloudflare account and API-token configuration.

## Testing

Run the existing backend test suite:

```bash
bun run test
```

Alternatively, run Bun's test runner directly:

```bash
bun test
```

Confirm that tests pass before deploying changes.

## Deployment

Deploy the backend Worker using Wrangler:

```bash
bunx wrangler deploy
```

The repository may also deploy through GitHub Actions, depending on the configured workflow.

Before deployment, verify:

- Cloudflare account and deployment credentials
- Worker configuration in `wrangler.jsonc`
- D1 database and KV namespace bindings
- Required Worker secrets
- Cron Trigger configuration
- Successful test execution
