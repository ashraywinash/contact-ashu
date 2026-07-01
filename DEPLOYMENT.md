# Deploy WhisperNet On `ashutact.duckdns.org`

This guide deploys the current prototype on a Linux server or home machine using
Docker Compose and Caddy.

Your public URL will be:

```text
https://ashutact.duckdns.org
```

## Important Before Sharing

The current username/password flow is a frontend prototype. It stores demo users
in the browser. It is useful for showing the interface to friends, but it is not
production authentication yet.

Before real public use, implement backend auth, database writes, real sessions,
password hashing, and client-side E2EE.

## Server Requirements

- A machine that stays online
- Docker Engine and Docker Compose plugin
- DuckDNS record `ashutact.duckdns.org` pointing to your public IP
- Router port forwarding:
  - external `80` to server `80`
  - external `443` to server `443`
- Firewall open for ports `80` and `443`

Caddy will automatically request and renew HTTPS certificates when the domain
points to your server and ports `80`/`443` are reachable.

## First Deploy

On your local machine:

```bash
git add .
git commit -m "Prepare DuckDNS deployment"
git remote add origin <your-git-remote-url>
git push -u origin main
```

On your server:

```bash
git clone <your-git-remote-url> whispernet
cd whispernet
cp .env.example .env
```

Edit `.env`:

```bash
nano .env
```

Set at least:

```bash
PUBLIC_APP_ORIGIN=https://ashutact.duckdns.org
AUTH_SESSION_SECRET=<generate-a-32-byte-secret>
PASSWORD_PEPPER=<generate-another-secret>
SESSION_COOKIE_NAME=whispernet_session
D1_BINDING=DB
R2_BINDING=MEDIA
```

For quick random secrets:

```bash
openssl rand -base64 32
```

Start it:

```bash
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f app
docker compose logs -f caddy
```

Open:

```text
https://ashutact.duckdns.org
```

## Updating Later

On your local machine:

```bash
git add .
git commit -m "Update chat app"
git push
```

On your server:

```bash
cd whispernet
git pull
docker compose up -d --build
```

## DuckDNS Update

If your ISP changes your public IP, configure DuckDNS on your router or server
so `ashutact.duckdns.org` stays pointed at the right address.

DuckDNS update URL format:

```text
https://www.duckdns.org/update?domains=ashutact&token=<your-duckdns-token>&ip=
```

Keep the DuckDNS token private.

## Sharing With Friends

Send them:

```text
https://ashutact.duckdns.org
```

For a small private test, tell them:

- create a unique username
- choose a password
- open `/chat` after signup
- search a visible username and start a chat

Do not promise real private messaging until backend auth, encrypted storage, and
client-side E2EE are implemented.

## Troubleshooting

If HTTPS does not work:

- Confirm `ashutact.duckdns.org` resolves to your public IP.
- Confirm your router forwards `80` and `443` to the server.
- Confirm no other service is already using ports `80` or `443`.
- Run `docker compose logs -f caddy`.

If the app does not load:

- Run `docker compose ps`.
- Run `docker compose logs -f app`.
- Rebuild with `docker compose up -d --build`.
