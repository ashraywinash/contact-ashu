# Deploy WhisperNet Fully On Cloudflare

Use this path when Cloudflare is the whole stack:

- Cloudflare Workers hosts the app
- Cloudflare D1 stores structured app records
- Cloudflare R2 stores encrypted media files
- Cloudflare provides the public `*.workers.dev` URL or your custom domain

This is the cleanest path if you already created D1 and R2.

## Values You Need From Cloudflare

From your D1 database page:

```text
CLOUDFLARE_D1_DATABASE_NAME=your-d1-name
CLOUDFLARE_D1_DATABASE_ID=your-d1-id
```

From your R2 bucket page:

```text
CLOUDFLARE_R2_BUCKET_NAME=your-r2-bucket-name
```

From Cloudflare API Tokens:

```text
CLOUDFLARE_API_TOKEN=token-with-workers-d1-r2-deploy-permissions
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

The binding names used by the app are:

```text
DB
MEDIA
```

## Local Setup

Create `.env`:

```bash
cp .env.example .env
```

Edit it:

```bash
nano .env
```

Set:

```bash
PUBLIC_APP_ORIGIN=https://your-worker-or-domain
CLOUDFLARE_D1_DATABASE_NAME=your-d1-name
CLOUDFLARE_D1_DATABASE_ID=your-d1-id
CLOUDFLARE_R2_BUCKET_NAME=your-r2-bucket-name
```

## Validate

```bash
npm ci
npm run lint
npm run build
```

## Apply D1 Schema

The app has a generated SQL migration:

```text
drizzle/0000_purple_avengers.sql
```

Apply it to your remote D1 database:

```bash
npx wrangler d1 execute <your-d1-name> --remote --file=drizzle/0000_purple_avengers.sql
```

## Deploy From Local Machine

Log in:

```bash
npx wrangler login
```

Deploy:

```bash
npm run deploy:cloudflare
```

## Deploy From Cloudflare Dashboard

If using **Workers → Create Worker → Import repository**:

1. Select your GitHub repository.
2. Build command:

```bash
npm ci && npm run build
```

3. Add environment variables:

```text
CLOUDFLARE_D1_DATABASE_NAME
CLOUDFLARE_D1_DATABASE_ID
CLOUDFLARE_R2_BUCKET_NAME
PUBLIC_APP_ORIGIN
AUTH_SESSION_SECRET
PASSWORD_PEPPER
SESSION_COOKIE_NAME
```

4. Deploy.

## Custom Domain

You can use either:

- the generated `*.workers.dev` URL first
- a Cloudflare-managed custom domain later

If you want `ashutact.duckdns.org`, keep in mind DuckDNS is not managed inside
Cloudflare DNS. The easiest Cloudflare custom-domain path is usually to buy/use
a domain whose DNS is managed by Cloudflare.

## Current App Limitation

This deployment will host the app on Cloudflare, but the current UI still uses
browser-local demo auth and messages. The next backend step is implementing API
routes that write to D1 and R2 using the `DB` and `MEDIA` bindings.
