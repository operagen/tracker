# tracker

Goals and daily tracker. View-only web UI; an agent (Claude) writes through MCP.

- UI: Today, Goals, Activity. Supabase Auth, single user.
- MCP: Streamable HTTP at `/mcp`, `Authorization: Bearer $MCP_TOKEN`.
- Stack: Next.js (App Router), Supabase Postgres, Drizzle.
- Tables live in their own Postgres schema, `tracker`, because the database is shared with another app.

## Setup
Copy `.env.example` to `.env.local` and fill it in, then:

    npm install
    npm run db:migrate   # applies drizzle/ (uses POSTGRES_URL_NON_POOLING)
    npm run dev

Shared logic lives in `lib/service.ts`; the UI and MCP both call it.
"Today" is Asia/Kolkata. Deploys on merge to `main` (Vercel).

## Connecting from claude.ai (OAuth)
`/mcp` accepts either the static `MCP_TOKEN` (Claude Code) or a Supabase OAuth token (claude.ai connectors).
Setup: Supabase dashboard → Authentication → OAuth Server → enable it, enable dynamic client registration, set the authorization path to `/oauth/consent`.
Set `ALLOWED_EMAILS` (comma-separated) in Vercel; only those accounts can approve a connection. Empty means nobody.
