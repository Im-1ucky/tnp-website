# T&P | GPREC

The official Training & Placement Club website for **G. Pulla Reddy Engineering College (GPREC), Kurnool**.

The platform brings placement-related updates, college news, events, team information together in one place.

## Features

- **Home and information pages:** About, Teams, Events, Contact, and News.
- **News management:** Backend powered news content and image storage.
- **Authentication and role-based access:** Protected administrative and editorial functionality.
- **Event and recruitment information:** A central place for relevant opportunities and updates.
- **Instagram statistics:** Integration with the Instagram Graph API.
- **Audit logging:** Records relevant administrative activity.
- **Automated maintenance:** Scheduled backend tasks.
- **Automated checks and deployment:** GitHub Actions workflows for tests, builds, and Cloudflare deployment.

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, Tailwind CSS |
| Backend | JavaScript, Bun, Cloudflare Workers |
| Database | Cloudflare D1 |
| Key-value storage | Cloudflare Workers KV |
| Image storage | Supabase Storage |
| External integration | Instagram Graph API |
| Testing | Bun Test |
| CI/CD | GitHub Actions, Cloudflare Wrangler |

## Project Structure

```text
tnp-website/
├── .github/
│   └── workflows/       # Tests and deployment workflows
├── frontend/            # React + Vite application
└── backend/             # Cloudflare Worker API
```

## Getting Started

### Prerequisites

- Git
- Bun
- A Cloudflare account for backend development and deployment
- Required service credentials for features that depend on external services

### 1. Clone the repository

```bash
git clone https://github.com/tnp-website/tnp-website.git
cd tnp-website
```

### 2. Install frontend dependencies

```bash
cd frontend
bun install
```

Start the frontend development server:

```bash
bun run dev
```

### 3. Install backend dependencies

In a separate terminal, from the repository root:

```bash
cd backend
bun install
```

Configure the local environment using the project's `.dev.vars.example` file, if available. Keep actual credentials in local, ignored environment files rather than committing them.

Start the backend locally using the project's Wrangler configuration and development scripts.

## Testing and Build

Run backend tests:

```bash
cd backend
bun run test
```

Build the frontend for production:

```bash
cd frontend
bun run build
```

The GitHub Actions workflows run the configured checks and handle deployment to Cloudflare.

## Environment Variables and Secrets

Some features require credentials configured locally or in the appropriate hosting platform.

Examples of secret/configuration names used by the backend include:

- `INSTAGRAM_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Configure required values in your local development environment and in Cloudflare for deployed services.

**Never commit actual tokens, API keys, passwords, or `.dev.vars` files to GitHub.** Use placeholder values in example configuration files.

## Deployment

The project uses Cloudflare Workers for hosting and GitHub Actions for automated checks and deployment.

- Frontend: Cloudflare Worker serving the web application.
- Backend: Cloudflare Worker providing API functionality.
- Database: Cloudflare D1.
- Statistics cache: Cloudflare Workers KV.
- News images: Supabase Storage.

Deployment requires the appropriate Cloudflare configuration and repository secrets. Only authorized maintainers should have deployment access.

## Contributing

1. Clone the repository.
2. Create a branch for your changes when appropriate.
3. Make and test your changes locally.
4. Commit and push your work.
5. Follow the repository's contribution and deployment procedures.

Never share production credentials in source code, commits, issue reports, or public messages.

## Maintained by

Training & Placement Club  
G. Pulla Reddy Engineering College (GPREC), Kurnool

Official repository: https://github.com/tnp-website/tnp-website
