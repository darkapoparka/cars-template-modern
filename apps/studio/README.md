# Prisma Studio

This workspace is an operator-only database tool. It has no `dev` script, so
`pnpm dev` and Turbo's default development graph cannot start it.

Run it intentionally from the repository root:

```powershell
$env:DATABASE_URL = "postgresql://automarket:password@127.0.0.1:5432/automarket"
pnpm db:studio
```

The launcher always binds Prisma Studio to `127.0.0.1:3005`, disables automatic
browser opening, rejects Vercel Preview/Production and production runtime
environments, and fails closed when `DATABASE_URL` is absent or invalid.

For a remote non-production database, the operator must confirm the exact
non-secret `host:port/database` identity:

```powershell
$env:DATABASE_URL = "postgresql://automarket:password@ep-preview.neon.tech/automarket_preview"
$env:AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY = "ep-preview.neon.tech:5432/automarket_preview"
$env:AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION = "true"
pnpm db:studio
```

Never use this tool against production. The confirmation variables are a local
safety interlock, not authorization or a substitute for least-privilege database
credentials.
