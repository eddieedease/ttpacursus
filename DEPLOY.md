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
- optionally **"Voorbeeldgegevens laden"** — fictitious organisations, course
  dates (always in the future), registrations in every status and three
  trainers, for demos. All addresses are `@example.com`, so nobody is mailed.
  The trainers' password is shown **once** on the success screen. To start
  clean later: empty the data tables in phpMyAdmin, or reinstall on a fresh database.
- optionally the **mail settings** (sender address + SMTP). You can also fill
  these in later under Beheer → Instellingen. The SMTP details are in your
  hosting control panel, with the mailbox you want to send from.

The installer creates all tables, creates the admin account, stores the mail
settings, and writes the database credentials to `api/config.local.php` on the server.

After installing, the site is **under construction**: visitors see a
"binnenkort online" page and need the preview password (default `goudvis`).
Turn this off under Beheer → Instellingen when the site goes live. `/admin`
and `/trainer` always stay reachable.

### 5. Delete the installer

Delete `api/install.php` from the server. The installer locks itself once an
admin account exists, but removing the file entirely is the safe end state.

### 6. Verify

- `https://uw-domein.nl/api/health.php` should return
  `{"status":"ok","php":"8.x.x","database":"connected"}`
- `https://uw-domein.nl/` shows the "binnenkort online" page; after entering
  the preview password the site and `/aanmelden` with live course dates appear
- `https://uw-domein.nl/admin` — log in with the admin account from step 4
- Beheer → Instellingen → "Testmail versturen" — check that mail arrives
  (also check the spam folder; see "Mail deliverability" below)

## Updating an existing installation

1. `npm run build`
2. Upload the contents of `dist/ttpacursus/browser/` over the existing files

That's it. Your database credentials are safe: they live in
`api/config.local.php` on the server, which is never part of a build, so the
upload cannot overwrite them. Database changes in a new version are applied
automatically on the first request after the upload (see `api/lib/schema.php`);
settings, mail templates and all data are kept. Delete `api/install.php` again after uploading
(each build ships a fresh copy).

## Users and roles

- **Beheerder (admin)** — full access to `/admin`.
- **Trainer** — logs in at `/trainer` (link in the footer) and marks per course
  date whether they are available. The admin assigns trainers per date under
  Cursusdata, and finds trainers quickly under the Trainers tab.

Accounts are managed under Beheer → Gebruikers.

## E-mail

Three mails are sent, all editable under Beheer → E-mails:

1. **Aanmelding ontvangen** — automatically, when the form is submitted.
2. **Inschrijving bevestigd** — when the admin clicks "Bevestigen & mailen" on a
   registration (or "Bevestig alle ingedeelden" on a course date). The
   registration then gets status *bevestigd*. Moving a confirmed registration
   to another date sets it back to *ingedeeld*, so it needs a new confirmation.
3. **Trainer ingepland** — to each trainer, when the admin clicks "Bevestig
   ingeplande trainers & mail" on a course date (Cursusdata). Several trainers
   can be scheduled per date; ticking a trainer is a draft until confirmed, and
   trainers only see a date as scheduled on `/trainer` after confirmation.
   Trainers need an e-mail address (Beheer → Gebruikers).

Every mail is logged (Beheer → E-mails, and per registration in its details).
An optional BCC address under Instellingen receives a copy of every mail.

**LMS (Inervo):** confirming calls `lms_provision()` in `api/lib/lms.php`
before the mail is sent. It is a placeholder for now; once implemented, the
login details it returns are put into the confirmation mail via the
`{{lms_gegevens}}` placeholder (empty until then).

**Mail deliverability:** send from an address on your own domain, via the SMTP
server of your host, and make sure SPF/DKIM are enabled for the domain in the
hosting panel. Otherwise confirmation mails are likely to land in spam.

## Admin password forgotten?

Another admin can set a new password under Beheer → Gebruikers. If there is no
other admin:

1. In phpMyAdmin (hosting panel), delete the admin accounts:
   `DELETE FROM users WHERE role = 'admin';`
   (trainers and all other data stay)
2. Upload `api/install.php` again (it's in every build)
3. Run the installer — it only creates the new admin account; existing data is
   untouched.
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
docker compose up -d   # PHP API :8080, MySQL :3306, phpMyAdmin :8082, Mailpit :8025
npm start              # Angular dev server :4200, proxies /api to :8080
```

- Dev admin: username `admin`, password `ttpa2026`
- Mail is caught by Mailpit: http://localhost:8025 (nothing leaves your machine)
- Fresh database (re-runs schema + seed): `docker compose down -v && docker compose up -d`
