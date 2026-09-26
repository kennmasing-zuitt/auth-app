# Auth App — Next.js + Node/TypeScript + MongoDB

Minimal login/logout app with two roles (Admin, User).

```
Browser ──HTTPS──> Nginx (host, :443)
                     ├── /api/*  ─> server  (Express + TS, 127.0.0.1:4000)
                     └── /*      ─> client  (Next.js,      127.0.0.1:3000)
                                     server ─> mongo (Docker network only)
```

## How auth works

- Passwords are hashed with **bcrypt** (cost 12) — only hashes are stored; the hash field is excluded from queries by default.
- On login the server issues a **JWT in an httpOnly, SameSite=Lax cookie** (JavaScript can't read it; `Secure` when `COOKIE_SECURE=true`).
- Login is **rate-limited** (10 tries / 15 min / IP) and returns the same error for a wrong email or password.
- `helmet` sets security headers; MongoDB has auth enabled and is not exposed outside Docker.
- Logout clears the cookie.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | `{ email, password }` → sets cookie |
| `POST /api/auth/logout` | clears cookie |
| `GET /api/auth/me` | current user (401 if not logged in) |
| `GET /api/auth/admin-check` | admin-only example (403 for users) |
| `GET /api/health` | health check |

There's no sign-up page. Accounts are created by the seed script from `.env`.

---

## Run locally (Docker)

```bash
cp .env.example .env          # edit the values
docker compose up -d --build
docker compose exec server npm run seed
```

Open http://localhost:3000 and log in with `ADMIN_EMAIL` / `USER_EMAIL` from `.env`. The Next.js container forwards `/api` to the server, so this works without Nginx.

## Run locally (without Docker)

Needs a local MongoDB.

```bash
# terminal 1
cd server && npm install
export MONGO_URI=mongodb://localhost:27017/authapp JWT_SECRET=dev-secret \
       ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin123 \
       USER_EMAIL=user@example.com USER_PASSWORD=user123
npm run seed:dev && npm run dev

# terminal 2
cd client && npm install && npm run dev    # http://localhost:3000
```

---

## Deploy to a DigitalOcean droplet (Ubuntu 24.04)

### 1. DNS
At your domain registrar (or DO Networking), add **A records** for `example.com` and `www.example.com` pointing to the droplet's IP.

### 2. Install Docker, Nginx, Certbot
```bash
sudo apt update
sudo apt install -y ca-certificates curl nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
```

### 3. Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
Ports 3000/4000 are bound to `127.0.0.1` only, so they aren't reachable from the internet.

### 4. Start the app
```bash
git clone <your-repo> auth-app && cd auth-app   # or scp the folder up
cp .env.example .env && nano .env               # set strong passwords + JWT_SECRET
docker compose up -d --build
docker compose exec server npm run seed
docker compose ps                               # all three should be "running"
curl http://127.0.0.1:4000/api/health           # {"status":"ok"}
```
> If `MONGO_ROOT_PASSWORD` contains `@ : / ? # %`, stick to letters/numbers/`-_` or URL-encode it — it's placed inside the Mongo connection string.

### 5. Nginx reverse proxy
```bash
sudo cp nginx/authapp.conf /etc/nginx/sites-available/authapp
sudo sed -i 's/example.com/YOURDOMAIN.com/g' /etc/nginx/sites-available/authapp
sudo ln -s /etc/nginx/sites-available/authapp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Visit `http://YOURDOMAIN.com` — login should work over HTTP now.

### 6. HTTPS
```bash
sudo certbot --nginx -d YOURDOMAIN.com -d www.YOURDOMAIN.com --redirect
```
Then set `COOKIE_SECURE=true` in `.env` and apply it:
```bash
docker compose up -d
```

### Updating
```bash
git pull && docker compose up -d --build
```

## Troubleshooting

- **Login succeeds but you bounce back to /login** — you're on plain HTTP with `COOKIE_SECURE=true`. Use HTTPS or set it to `false`.
- **Server keeps restarting** — `docker compose logs server`. Usually a missing env var or Mongo still starting (it retries automatically).
- **"Too many login attempts"** — wait 15 minutes or `docker compose restart server`.
