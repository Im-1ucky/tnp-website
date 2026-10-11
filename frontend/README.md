# T&P | GPREC — Frontend

The frontend for the official **Training & Placement Club** website of **G. Pulla Reddy Engineering College (Autonomous), Kurnool**.

The application provides information about the club, its team, events, news, alumni, and contact details, along with an administrative interface for authorized staff.

**Live website:** https://tnp-website.tnpwebsite2026.workers.dev/

## Tech Stack

- **React** — UI components and application interface
- **Vite** — Development server and production build tooling
- **CSS** — Styling and responsive layouts
- **Lucide React** — Icons
- **Embla Carousel** — Carousel interactions
- **Bun** — Package management and script execution
- **Cloudflare Workers** — Frontend hosting and asset delivery

## Prerequisites

- Bun
- Git

## Getting Started

Clone the repository and navigate to the frontend directory:

```bash
git clone https://github.com/tnp-website/tnp-website.git
cd tnp-website/frontend
```

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Vite will display the local development URL in the terminal.

## Available Commands

Run these commands from the `frontend/` directory.

| Command | Description |
|---|---|
| `bun run dev` | Start the Vite development server |
| `bun run build` | Build the production application |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint checks, if configured |

### Production Build

Before submitting frontend changes, verify that the application builds successfully:

```bash
bun run build
```

The production output is generated in the `dist/` directory.

### Testing

The production build checks compilation, but it does not verify every feature or user interaction.

Manually test relevant pages and functionality in the browser, including:

- Navigation and responsive layouts
- News cards, descriptions, and image-loading failures
- Events, team information, and contact sections
- Login, logout, and protected administrative pages
- Admin dashboard features and API interactions

Automated frontend tests can be added using Vitest and React Testing Library. A `bun run test` command should only be used after a test script has been configured in `package.json`.

## Configuration

The frontend is deployed using Cloudflare Workers.

- `wrangler.jsonc` contains the frontend Worker configuration.
- API requests are routed to the backend Worker using the configured Cloudflare service binding.
- Dynamically uploaded news images are served from Supabase Storage.
- Public frontend code must never contain private API keys, access tokens, or database credentials.

Keep deployment configuration consistent with the backend and the repository's GitHub Actions workflows.

## Deployment

Deployment is managed through the configured Cloudflare Workers and GitHub Actions setup.

Before deploying, build the application:

```bash
bun run build
```

Ensure the required Cloudflare configuration and deployment credentials are correctly configured in the appropriate environment.
