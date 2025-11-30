# Shrinx

A modern, minimalistic URL shortener that transforms long, complex links into clean, concise URLs. Shrinx is built with Next.js & Tailwind CSS for a fast, responsive UI, and powered by a lightweight SQLite database.

---

## Features

- **Instant URL Shortening**
  Create custom short URLs in seconds.
- **Multi-Domain Support**
  Manage multiple domains from a single instance with database-stored configuration.
- **Admin Dashboard**
  Secure, session-based admin area to add, list, and delete redirects with a modern UI.
- **Settings Management**
  Configure Turnstile keys, admin credentials, and domains directly from the admin panel.
- **Captcha Protection**
  Cloudflare Turnstile integration to block bots.
- **Catch-all Redirects**
  `/url/[path]` dynamic routing for seamless redirects.
- **API-First**
  RESTful API under `/api/` for integrations or automation.

### Demo
Live at [shortenno.de](https://shortenno.de)

Test URL: [123415.xyz/url/test](https://123415.xyz/url/test)


---

## Tech Stack

- **Framework**: Next.js 15 (Pages Router) with TypeScript
- **Styling**: Tailwind CSS 4 (via PostCSS)
- **UI Components**: Radix UI + shadcn/ui (Dialog, Dropdown, Alert, etc.)
- **Database**: SQLite (file `db.sqlite`)
- **Session**: iron-session (cookie-based admin auth)
- **Captcha**: Cloudflare Turnstile (`@marsidev/react-turnstile`)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React + Heroicons  

---

## Project Structure

```
shrinx/
├── example.env.local      # Example environment variables
├── next.config.ts         # Next.js configuration (TypeScript)
├── package.json
├── postcss.config.mjs
├── tsconfig.json          # TypeScript configuration
├── db.sqlite              # SQLite database file
├── public/                # Static assets (favicon, etc.)
└── src/
    ├── components/
    │   ├── layout/
    │   │   └── AdminLayout.tsx  # Admin page layout wrapper
    │   └── ui/                  # shadcn/ui components
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── table.tsx
    │       └── ...
    ├── lib/
    │   ├── db.js              # SQLite helper
    │   ├── session.js         # iron-session setup
    │   ├── domainMiddleware.js # Domain validation
    │   └── utils.ts           # Utility functions
    ├── pages/
    │   ├── _app.js
    │   ├── _document.js
    │   ├── index.js           # Home & URL create form
    │   ├── success.js         # Display created URL
    │   ├── error.js           # 404 page
    │   ├── login.js           # Admin login
    │   ├── admin.js           # Admin dashboard home
    │   ├── admin/
    │   │   ├── redirects.js   # Manage redirects
    │   │   └── settings.js    # Admin settings
    │   ├── url/
    │   │   └── [path].js      # Dynamic redirect page
    │   └── api/
    │       ├── domains.js
    │       ├── save.js
    │       ├── url/[path].js
    │       └── admin/
    │           ├── login.js
    │           ├── logout.js
    │           ├── redirects.js
    │           ├── add.js
    │           ├── delete.js
    │           ├── domains.js
    │           ├── settings.js
    │           └── change-password.js
    └── styles/
        └── globals.css        # Tailwind import
```

---
## Run by script (One Click Install)

```bash
curl -sSL https://github.com/isawebapp/Shrinx/releases/latest/download/shrinx.sh -o shrinx.sh && chmod +x shrinx.sh && bash shrinx.sh
```

## Getting Started (Run by manual setup)

### 1. Clone & Install

```bash
git clone https://github.com/isawebapp/Shrinx.git
```
```bash
cd Shrinx
```
```bash
npm install
````

### 2. Environment Variables

Rename `example.env.local` to `.env.local` in the project root:

```bash
mv example.env.local .env.local
```

```ini
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

SESSION_PASSWORD=complex_password_at_least_32_chars

DOMAINS=localhost
```

**Note:** After initial setup, Turnstile keys, admin credentials, and domains can be managed directly from the admin settings panel. These values are stored in the database and take precedence over environment variables.

### 3. Run in Development

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`.

### 4. Build & Production

```bash
npm run build
```
```bash
npm start
```

---

## API Endpoints

| Method | Endpoint                       | Description                                      |
| ------ | ------------------------------ | ------------------------------------------------ |
| GET    | `/api/domains`                 | Fetch list of allowed domains                    |
| POST   | `/api/save`                    | Create a new redirect (requires Turnstile token) |
| GET    | `/api/url/[path]`              | Get redirect info by path                        |
| POST   | `/api/admin/login`             | Admin login (sets session cookie)                |
| POST   | `/api/admin/logout`            | Admin logout (destroys session)                  |
| GET    | `/api/admin/redirects`         | List all redirects (admin only)                  |
| POST   | `/api/admin/add`               | Add a redirect (admin only)                      |
| DELETE | `/api/admin/delete?id=<id>`    | Delete a redirect by ID (admin only)             |
| GET    | `/api/admin/domains`           | Get all domains (admin only)                     |
| POST   | `/api/admin/domains`           | Add/update domains (admin only)                  |
| DELETE | `/api/admin/domains?id=<id>`   | Delete a domain (admin only)                     |
| GET    | `/api/admin/settings`          | Get settings (admin only)                        |
| POST   | `/api/admin/settings`          | Update settings (admin only)                     |
| POST   | `/api/admin/change-password`   | Change admin password (admin only)               |
| GET    | `/url/[path]`                  | Redirect to the original URL                     |

---

## Usage

1. **Shorten a URL:**
   Fill in the long URL, choose a domain & alias, solve the captcha, and click **Shorten URL**.
2. **Admin Dashboard:**
   Log in to `/login` to access the admin panel with the following features:
   - **Redirects Management** (`/admin/redirects`): Add, view, and delete URL redirects
   - **Settings** (`/admin/settings`): Configure Turnstile keys, manage domains, and change admin password
3. **Visit a Short Link:**
   Open `https://your-domain.com/url/<alias>` to be redirected.

---

## License

This project is open-source under the [MIT License](LICENSE).

---

## Contribute

Contributions are welcome! Feel free to open issues or submit pull requests. Let’s make Shrinx even better!
