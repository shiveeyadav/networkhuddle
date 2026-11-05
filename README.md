# NetworkHuddle

UK business-networking membership site for **networkhuddle.com**. Members and visitors book online themed
meetings, online speed networking and face-to-face breakfast/evening meetings, keep a public profile, and
request 1-1s. Visitors can book up to 3 meetings free before joining.

- Next.js 14 (pages router), plain JavaScript, plain CSS
- PostgreSQL via `pg`, passwords with `bcryptjs`
- httpOnly `nh_session` cookie backed by the `sessions` table, SameSite=Lax; all mutations are JSON `POST`s
  with an Origin check and server-side validation
- Email via Resend or SMTP (falls back to logging emails to the console)

## Pages

| Path | What |
| --- | --- |
| `/` | Home: hero, upcoming meetings, how it works, join CTA |
| `/events`, `/events/[slug]` | Meetings list with filters (format, theme, region, from/to date); meeting page with booking. `/events/<id>` redirects to the slug URL |
| `/members`, `/m/[slug]` | Member directory and public profiles (1-1 request form) |
| `/membership` | Plans + "Online payments coming soon" placeholder |
| `/signup`, `/login`, `/forgot-password`, `/reset-password` | Auth |
| `/dashboard`, `/profile/edit`, `/one-to-ones`, `/settings` | Signed-in area (settings: change password, delete account) |
| `/admin`, `/admin/events/new`, `/admin/events/[id]`, `/admin/members` | Admin (role `admin`) |
| `/privacy`, `/cookies`, `/terms` | Legal |
| `/sitemap.xml`, `/robots.txt`, `/api/health` | SEO and health check |

## Run locally

Needs Node 18.17+ (20 recommended) and PostgreSQL 14+.

```bash
cp .env.example .env            # edit values; for local dev set SITE_URL=http://localhost:3000
npm install
export $(grep -v '^#' .env | xargs)   # or use your own env loader
export DATABASE_URL=postgres://networkhuddle:networkhuddle@localhost:5432/networkhuddle
npm run db:init                 # schema + demo events + admin user (safe to re-run)
npm run dev                     # http://localhost:3000
```

Production build: `npm run build && npm start`.

`scripts/init-db.js` is idempotent: it applies `db/schema.sql` (all `CREATE ... IF NOT EXISTS`), runs
`db/seed.sql` once (tracked in `app_meta`, skipped if `SEED_DEMO_EVENTS=false`), and creates the admin from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` (or promotes that user if the email already exists; it never changes an
existing password). The Docker image runs it on every start before `next start`.

Demo events have fictional venues and `meet.example.com` links. Cancel or edit them in `/admin` before launch,
or set `SEED_DEMO_EVENTS=false` before the first start.

## Deploy on a Linux VPS (Docker + nginx + certbot)

### 1. DNS

At your DNS provider create two records (if using Cloudflare, set them to **DNS only / grey cloud** until the
certificate has been issued):

| Type | Name | Value |
| --- | --- | --- |
| A | `networkhuddle.com` (`@`) | `194.163.174.242` |
| A | `www` | `194.163.174.242` |

Check with `dig +short networkhuddle.com` and `dig +short www.networkhuddle.com`.

### 2. Server packages (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git
curl -fsSL https://get.docker.com | sudo sh     # Docker Engine + compose plugin
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable   # if you use ufw
```

> If this server already runs Coolify (or anything else) on ports 80/443, nginx can't bind to them. Either
> deploy this repo as a Docker Compose app inside Coolify and point the domain there, or add the domain to the
> existing proxy and forward it to `127.0.0.1:3010`. Skip steps 4 and 5 in that case.

### 3. App

```bash
sudo mkdir -p /opt/networkhuddle && sudo chown $USER /opt/networkhuddle
git clone <your-repo-url> /opt/networkhuddle     # or rsync/scp this folder
cd /opt/networkhuddle
cp .env.example .env
nano .env
```

In `.env` set at least:

- `POSTGRES_PASSWORD`: letters and digits only, e.g. the output of `openssl rand -hex 24`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (8+ characters)
- `SITE_URL=https://networkhuddle.com`
- `CONTACT_EMAIL`, `LEGAL_NAME`, `MAIL_FROM` and either `RESEND_API_KEY` or the `SMTP_*` settings
- `APP_PORT` (default `3010`; the container is published on `127.0.0.1` only)

Then:

```bash
docker compose up -d --build
docker compose logs -f app        # wait for "[init-db] done" and "Ready"
curl -s http://127.0.0.1:3010/api/health    # {"ok":true}
```

### 4. nginx

Create `/etc/nginx/sites-available/networkhuddle.com`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name networkhuddle.com www.networkhuddle.com;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

`X-Forwarded-For` is set to `$remote_addr` (not appended) so clients can't spoof the IP used for rate limiting.

```bash
sudo ln -s /etc/nginx/sites-available/networkhuddle.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. HTTPS with certbot

```bash
sudo certbot --nginx -d networkhuddle.com -d www.networkhuddle.com --redirect -m you@example.com --agree-tos
sudo certbot renew --dry-run
```

certbot adds the 443 server block and the HTTP to HTTPS redirect. Optionally redirect `www` to the bare
domain by adding this to the 443 server block certbot created:

```nginx
if ($host = www.networkhuddle.com) { return 301 https://networkhuddle.com$request_uri; }
```

Then:

1. Log in at `https://networkhuddle.com/login` with `ADMIN_EMAIL`.
2. Visit `/admin` and replace the demo meetings.
3. Submit `https://networkhuddle.com/sitemap.xml` in Google Search Console.

### Updating

```bash
cd /opt/networkhuddle && git pull && docker compose up -d --build
```

### Backups

```bash
docker compose exec -T db pg_dump -U networkhuddle networkhuddle | gzip > ~/networkhuddle-$(date +%F).sql.gz
```

Schedule that daily with cron and copy the files off the server. The privacy notice says backups are
overwritten within 30 days, so keep that retention or change the notice.

### Before testing over plain HTTP

If you test by IP before the certificate exists, set `COOKIE_SECURE=false` temporarily (browsers drop `Secure`
cookies over http), then remove it once HTTPS works.

## Environment variables

See `.env.example`. Every variable has a fallback except `POSTGRES_PASSWORD`, which docker compose requires.

## Notes

- Membership is granted by an admin (`/admin/members`, then **Mark member**). There are no online payments yet.
- Visitors' free visits = active bookings on meetings that weren't cancelled by an admin. Cancelling before
  the start gives the visit back.
- Online meeting links are only sent to the browser for booked attendees and admins.
- Rate limiting is in memory, per process, which suits the single-container setup.
