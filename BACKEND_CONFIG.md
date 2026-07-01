# WhisperNet Backend Configuration

This app should treat the backend as a relay and storage layer. The server must
never receive plaintext messages, raw media, private keys, or unencrypted
reaction emoji if you want real end-to-end encryption.

## Recommended Stack

For this Sites build:

- Cloudflare Worker or another edge/API service for authenticated API routes
- Cloudflare D1 binding `DB` for structured records
- Cloudflare R2 binding `MEDIA` for encrypted photo, video, GIF, and file bytes
- WebSocket, Durable Object, Supabase Realtime, Firebase listener, or another
  realtime fanout layer for delivery events
- Web Push / FCM / APNs for push notifications

The included `.openai/hosting.json` declares:

```json
{
  "d1": "DB",
  "r2": "MEDIA"
}
```

## Critical E2EE Rules

Use an audited messaging protocol. For a serious WhatsApp-like app, start with
Signal Protocol concepts for 1:1 chats and Signal Sender Keys or MLS for
groups. Do not invent custom cryptography.

Required client-side behavior:

- Generate identity keys on the device.
- Upload only public identity keys, signed prekeys, and one-time prekeys.
- Keep private keys device-local, ideally in secure enclave / keychain storage.
- Encrypt every message before calling the backend.
- Encrypt media locally with a random file key before upload.
- Encrypt file keys to conversation members, not to the server.
- Encrypt reaction emoji if reactions should not leak to the server.
- Verify safety numbers or equivalent identity fingerprints.
- Rotate keys on device change, compromise, and membership changes.

Required server-side behavior:

- Store ciphertext, nonces, associated data, sender key ids, delivery state, and
  timestamps only.
- Store encrypted media object keys and encrypted file keys only.
- Never log request bodies containing ciphertext or key material.
- Apply strict rate limits to global search, registration, message send, and
  media upload.
- Add abuse controls because a worldwide public directory can attract spam.

## API Keys And Secrets

For local frontend development you do not need external API keys. Run the app
with the demo auth flow and local browser storage.

For production, get these:

- `AUTH_SESSION_SECRET`: create this yourself; use at least 32 random bytes for
  signing/encrypting sessions.
- `PASSWORD_PEPPER`: create this yourself; keep it server-side only. Passwords
  should be hashed with Argon2id or scrypt plus this pepper.
- Cloudflare account access for deployment and resources: D1 database `DB` and
  R2 bucket `MEDIA`. Worker-bound D1/R2 access should use bindings, not public
  access keys.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: Cloudflare
  Turnstile keys for signup, login, global search, and message-send abuse
  protection.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: Web Push keys for browser push
  notifications.
- Optional `GIF_PROVIDER_API_KEY`: only needed if you proxy Tenor, Giphy, or a
  similar GIF search provider through your backend.

If you choose Supabase instead of Cloudflare D1/R2, collect:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, server-side only
- Supabase Storage bucket name for encrypted media

If you choose Firebase, collect:

- Firebase web app config for the frontend
- Firebase Admin service account for trusted backend tasks
- FCM / Web Push keys for notifications

If you choose MongoDB Atlas, collect:

- `MONGODB_URI`
- object storage credentials from R2, S3, Supabase Storage, or Firebase Storage

## Data Model

`db/schema.ts` defines these tables:

- `users`: unique public username, password hash, visibility flag, profile color
- `device_key_bundles`: public key bundles for device-to-device session setup
- `conversations`: direct/group records with encrypted title fields
- `conversation_members`: membership plus encrypted conversation key per member
- `messages`: content type, ciphertext, nonce, sender key id, delivery state
- `media_assets`: R2 object key plus encrypted file metadata
- `message_reactions`: encrypted reaction payload per user and message

Generate migrations after schema edits:

```bash
npm run db:generate
```

## API Routes To Implement

Use these as the backend contract:

- `POST /api/auth/signup`: create unique username, password hash, session, and
  first device public key bundle
- `POST /api/auth/login`: verify password hash and create session
- `POST /api/auth/logout`: destroy session
- `GET /api/auth/session`: return the current user session
- `GET /api/users?query=`: search visible usernames with rate limiting
- `GET /api/key-bundles/:userId`: fetch public key material for session setup
- `POST /api/conversations`: create direct or group conversation metadata
- `POST /api/conversations/:id/members`: add members and encrypted keys
- `POST /api/messages`: store ciphertext and fan out delivery event
- `GET /api/conversations/:id/messages?after=`: fetch ciphertext page
- `POST /api/media/init`: create an upload object key and size policy
- `PUT /api/media/:objectKey`: upload encrypted bytes to object storage
- `POST /api/reactions`: store encrypted reaction payload
- `POST /api/devices/rotate`: rotate device public keys

Do not expose raw R2 objects publicly. Serve encrypted objects through signed,
short-lived download URLs or authenticated Worker routes.

## Environment Variables

Recommended runtime keys:

```bash
PUBLIC_APP_ORIGIN=https://your-domain.example
AUTH_SESSION_SECRET=...
PASSWORD_PEPPER=...
SESSION_COOKIE_NAME=whispernet_session
D1_BINDING=DB
R2_BINDING=MEDIA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
MAX_TEXT_BYTES=65536
MAX_MEDIA_BYTES=104857600
MAX_GROUP_MEMBERS=512
GIF_PROVIDER_API_KEY=...
```

Store production secrets in your hosting provider secret manager, not in Git.

## Storage Options With Free Tiers

Free tiers change, so verify before launch.

- Supabase: good all-in-one starter if you want Postgres, auth, realtime, and
  storage together. Supabase docs list Free Plan limits including two free
  projects, 500 MB database size per project, 1 GB storage, and 2 million
  realtime messages. Sources:
  [billing](https://supabase.com/docs/guides/platform/billing-on-supabase),
  [storage](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size),
  [realtime](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages).
- Cloudflare D1 + R2: best fit for this Sites project. D1 free Workers limits
  include 5 million rows read per day, 100,000 rows written per day, and 5 GB
  total storage. R2 includes 10 GB-month storage, 1 million Class A operations,
  10 million Class B operations, and free internet egress on the standard tier.
  Sources:
  [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
  [R2 pricing](https://developers.cloudflare.com/r2/pricing/).
- Firebase: strong for realtime clients, push, and mobile apps. Firebase Spark
  includes Firestore no-cost quotas such as 1 GiB stored data, 20K writes/day,
  50K reads/day, and Cloud Storage no-cost limits such as 5 GB for legacy
  buckets or 5 GB-months for supported `firebasestorage.app` buckets. Source:
  [Firebase pricing](https://firebase.google.com/pricing).
- MongoDB Atlas: good for document metadata and flexible search. Atlas pricing
  lists the free M0 cluster with 512 MB storage. Pair it with R2, S3, Firebase
  Storage, or Supabase Storage for encrypted media. Source:
  [MongoDB pricing](https://www.mongodb.com/pricing).

My default pick for this app is Cloudflare D1 + R2 for the current codebase, or
Supabase if you prefer managed Postgres plus realtime channels with less custom
infrastructure.

## Production Hardening

- Add passkeys or anonymous device credentials; do not rely on pseudonym text as
  authentication.
- Require CAPTCHA or proof-of-work for registration and global search at scale.
- Rate-limit message sends, media uploads, group creation, and key-bundle fetches.
- Add block/report flows and server-enforced deny lists.
- Keep directory search prefix-limited or paginated to avoid user scraping.
- Store delivery receipts separately from message ciphertext.
- Use content scanning only on optional user reports, after the reporting client
  intentionally decrypts and submits the reported plaintext.
- Add backups, migration review, observability, and alerting.
- Run a professional security review before any public release.
