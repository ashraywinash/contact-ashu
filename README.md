# WhisperNet

WhisperNet is a responsive WhatsApp-style chat prototype built with Next, React,
vinext, and Cloudflare-compatible Sites output.

The UI models the product journey:

- create a unique username with a password
- sign in and redirect to `/chat`
- search public usernames and start direct chats
- create encrypted groups with multiple members
- send text, emoji reactions, GIF capsules, photos, and videos
- show the server-side record as ciphertext instead of plaintext

This repository includes the frontend prototype plus the backend storage shape
for encrypted messages and encrypted media metadata. Real production E2EE must
be implemented in client crypto code and audited before launch.

## Quick Start

```bash
npm ci
npm run dev
```

Open `http://localhost:3000/`, create a username and password, then the app
redirects to `http://localhost:3000/chat`.

Before shipping, run:

```bash
npm run lint
npm run build
```

## Backend Bindings

`.openai/hosting.json` declares:

```json
{
  "d1": "DB",
  "r2": "MEDIA"
}
```

- `DB` stores usernames, password hashes, public key bundles, conversation membership, message
  ciphertext, encrypted media object metadata, and encrypted reactions.
- `MEDIA` stores only encrypted photo, video, GIF, and file bytes.

After editing `db/schema.ts`, generate migrations:

```bash
npm run db:generate
```

See [BACKEND_CONFIG.md](./BACKEND_CONFIG.md) for the full backend checklist,
API routes, security settings, and free storage options.

## Deploy

If you are using Cloudflare D1 and R2, deploy fully on Cloudflare with
[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md).

The Docker/Caddy guide in [DEPLOYMENT.md](./DEPLOYMENT.md) is only for a
self-hosted DuckDNS server path.
