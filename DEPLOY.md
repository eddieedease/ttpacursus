# Deploying TTPA cursus to shared hosting

The site is a static Angular frontend plus a plain PHP API in an `api/` folder.
One build produces everything; one upload deploys everything.

## Requirements on the host

- PHP **8.0 or newer** with the `pdo_mysql` extension (standard on almost every shared host)
- A MySQL database
- Apache with `.htaccess` support / `mod_rewrite` (used for the Angular routes; the API works without it)

## First-time installation

### 1. Build

```bash
npm run build
```

The deployable site is the **contents** of:

```
dist/ttpacursus/browser/
```

This includes `index.html`, the JS/CSS bundles, `.htaccess`, and the `api/` folder.

### 2. Create the database

In your hosting control panel (DirectAdmin, cPanel, Plesk…):

1. Create a MySQL **database**
2. Create a database **user** with a strong password and full rights on that database
3. Note the database **host** (often `localhost`, sometimes something like `mysql.provider.nl`)

Do not create any tables — the installer does that.

### 3. Upload

Upload everything **inside** `dist/ttpacursus/browser/` to the web root
(usually `public_html/` or `httpdocs/`). Make sure hidden files are included —
`.htaccess` is easy to miss in FTP clients.

### 4. Run the installer

Open in your browser:

```
https://uw-domein.nl/api/install.php
```

Fill in:

- the **database credentials** from step 2
- a **username and password** for the first admin account (this is what you use to log in at `/admin`)

The installer creates all tables, creates the admin account, and writes the
database credentials to `api/config.local.php` on the server.

### 5. Delete the installer

Delete `api/install.php` from the server. The installer locks itself once an
admin account exists, but removing the file entirely is the safe end state.

### 6. Verify

- `https://uw-domein.nl/api/health.php` should return
  `{"status":"ok","php":"8.x.x","database":"connected"}`
- `https://uw-domein.nl/` shows the site; `/aanmelden` shows live course dates
- `https://uw-domein.nl/admin` — log in with the admin account from step 4

## Updating an existing installation

1. `npm run build`
2. Upload the contents of `dist/ttpacursus/browser/` over the existing files

That's it. Your database credentials are safe: they live in
`api/config.local.php` on the server, which is never part of a build, so the
upload cannot overwrite them. Delete `api/install.php` again after uploading
(each build ships a fresh copy).

## Admin password forgotten?

1. In phpMyAdmin (hosting panel), empty the `admins` table:
   `DELETE FROM admins;`
2. Upload `api/install.php` again (it's in every build)
3. Run the installer — the database fields can stay as they are; it only needs
   to create the new admin account. Existing data is untouched (all tables are
   created with `IF NOT EXISTS`).
4. Delete `api/install.php` again

## Manual fallback (without the installer)

If the installer can't run for some reason, import
`docker/mysql/init/01-init.sql` via phpMyAdmin into your database, and fill in
the database credentials in `api/config.php` (the `CHANGE_ME` values) after
uploading. You will still need the installer once to create an admin account —
the password must be stored as a PHP `password_hash`, which you can't type in
by hand. The installer is idempotent, so running it after a manual import is
harmless.

## Local development (reference)

```bash
docker compose up -d   # PHP API :8080, MySQL :3306, phpMyAdmin :8082
npm start              # Angular dev server :4200, proxies /api to :8080
```

- Dev admin: username `admin`, password `ttpa2025`
- Fresh database (re-runs schema + seed): `docker compose down -v && docker compose up -d`
