# TTPA cursus

Website voor de inschrijving van medisch specialisten op de TTPA cursus
(Tips, Tricks and Pitfall Avoidance).

- **Frontend:** Angular 21 (zoneless, signals) + Tailwind 4
- **Backend:** plain PHP 8 + MySQL in `api/` — geen framework, geen composer, draait op shared hosting
- **Deploy:** één build (`npm run build`) → upload `dist/ttpacursus/browser/` via FTP → web-installer.
  Zie [DEPLOY.md](DEPLOY.md).

## Functionaliteit

| Onderdeel | Waar |
|---|---|
| Landingspagina en aanmeldformulier | `/`, `/aanmelden` |
| "Binnenkort online"-pagina met preview-wachtwoord (site in aanbouw) | `/binnenkort` |
| Trainers geven hun beschikbaarheid per cursusdatum door | `/trainer` |
| Beheer: aanmeldingen indelen en bevestigen, cursusdata en trainers inplannen, organisaties, facturen, trainers, gebruikers, e-mailsjablonen, instellingen | `/admin` |

E-mails: automatisch bij een nieuwe aanmelding, en bij het bevestigen van een
aanmelding door de beheerder. Teksten zijn aan te passen in het beheer.
De koppeling met het LMS (Inervo) krijgt een plek in `api/lib/lms.php`.

## Lokaal ontwikkelen

```bash
docker compose up -d   # PHP API :8080, MySQL :3306, phpMyAdmin :8082, Mailpit :8025
npm start              # Angular dev server :4200, proxyt /api naar :8080
```

- Dev-beheerder: `admin` / `ttpa2026`
- Test-trainer: `trainer1` / `trainer2026` (Sanne Bakker). Handmatig aangemaakt in de lokale database,
  dus na `docker compose down -v` opnieuw aanmaken via Beheer → Gebruikers
- Preview-wachtwoord (site in aanbouw): `goudvis`
- Alle mail wordt lokaal opgevangen door Mailpit: http://localhost:8025
- Schone database: `docker compose down -v && docker compose up -d`

Databasewijzigingen gaan via migraties in `api/lib/schema.php`; die worden
automatisch uitgevoerd bij het eerste API-verzoek na een update.

## Bouwen

```bash
npm run build
```

De uploadbare site staat daarna in `dist/ttpacursus/browser/` (inclusief `api/` en `.htaccess`).
