<?php

declare(strict_types=1);

/**
 * TTPA cursus — web installer.
 *
 * Run this once after uploading the site to the shared host:
 *   https://uw-domein.nl/api/install.php
 *
 * It creates the database tables, the first admin account, and writes the
 * database credentials to config.local.php. It locks itself once an admin
 * account exists — but DELETE THIS FILE from the server after installing.
 */

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

const SCHEMA = [
    "CREATE TABLE IF NOT EXISTS admins (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(80) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    "CREATE TABLE IF NOT EXISTS organisations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255) NULL,
      contact_email VARCHAR(255) NULL,
      contact_phone VARCHAR(50) NULL,
      address VARCHAR(255) NULL,
      postcode VARCHAR(20) NULL,
      city VARCHAR(120) NULL,
      invoice_address VARCHAR(255) NULL,
      invoice_postcode VARCHAR(20) NULL,
      invoice_city VARCHAR(120) NULL,
      invoice_email VARCHAR(255) NULL,
      invoice_reference VARCHAR(120) NULL,
      notes TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    "CREATE TABLE IF NOT EXISTS events (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event_date DATE NOT NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      location VARCHAR(255) NULL,
      capacity INT UNSIGNED NOT NULL DEFAULT 12,
      status ENUM('open','gesloten','geannuleerd') NOT NULL DEFAULT 'open',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    "CREATE TABLE IF NOT EXISTS registrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      achternaam VARCHAR(120) NOT NULL,
      voorvoegsels VARCHAR(40) NULL,
      voorletters VARCHAR(20) NOT NULL,
      voornaam VARCHAR(120) NOT NULL,
      titel VARCHAR(60) NOT NULL,
      geslacht ENUM('man','vrouw') NOT NULL,
      geboortedatum DATE NOT NULL,
      geboorteplaats VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefoon_werk VARCHAR(50) NOT NULL,
      mobiel VARCHAR(50) NOT NULL,
      mobiel_extra VARCHAR(50) NULL,
      adres VARCHAR(255) NOT NULL,
      postcode VARCHAR(20) NOT NULL,
      woonplaats VARCHAR(120) NOT NULL,
      big_nummer VARCHAR(20) NOT NULL,
      functie VARCHAR(120) NOT NULL,
      specialisme VARCHAR(120) NOT NULL,
      afdeling VARCHAR(120) NOT NULL,
      in_opleiding TINYINT(1) NOT NULL DEFAULT 0,
      werkervaring TEXT NULL,
      organisation_id INT UNSIGNED NULL,
      org_anders_naam VARCHAR(255) NULL,
      org_anders_contactpersoon VARCHAR(255) NULL,
      org_anders_email VARCHAR(255) NULL,
      org_anders_adres VARCHAR(255) NULL,
      org_anders_factuuradres VARCHAR(255) NULL,
      preferred_event_id INT UNSIGNED NULL,
      assigned_event_id INT UNSIGNED NULL,
      status ENUM('nieuw','ingedeeld','geannuleerd') NOT NULL DEFAULT 'nieuw',
      dieetwensen VARCHAR(255) NULL,
      opmerkingen TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_reg_organisation FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE RESTRICT,
      CONSTRAINT fk_reg_preferred_event FOREIGN KEY (preferred_event_id) REFERENCES events (id) ON DELETE SET NULL,
      CONSTRAINT fk_reg_assigned_event FOREIGN KEY (assigned_event_id) REFERENCES events (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    "CREATE TABLE IF NOT EXISTS invoices (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(30) NOT NULL UNIQUE,
      event_id INT UNSIGNED NULL,
      organisation_id INT UNSIGNED NULL,
      event_date DATE NOT NULL,
      org_name VARCHAR(255) NOT NULL,
      org_invoice_address TEXT NULL,
      org_invoice_email VARCHAR(255) NULL,
      org_invoice_reference VARCHAR(120) NULL,
      participant_count INT UNSIGNED NOT NULL,
      participants TEXT NOT NULL,
      unit_price DECIMAL(8,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status ENUM('open','verwerkt') NOT NULL DEFAULT 'open',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_inv_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL,
      CONSTRAINT fk_inv_org FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    // MySQL has no CREATE INDEX IF NOT EXISTS; duplicates are caught and ignored below.
    'CREATE INDEX idx_reg_status ON registrations (status)',
    'CREATE INDEX idx_reg_assigned ON registrations (assigned_event_id)',
    'CREATE INDEX idx_events_date ON events (event_date)',
];

$config = require __DIR__ . '/config.php';

// Lock: once an admin account exists the installer refuses to run.
$installed = false;
try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']),
        $config['db_user'],
        $config['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $installed = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn() > 0;
} catch (Throwable $e) {
    // No connection or no tables yet: not installed.
}

$errors = [];
$done = false;
$configWriteFailed = false;

if (!$installed && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbHost = trim((string) ($_POST['db_host'] ?? ''));
    $dbName = trim((string) ($_POST['db_name'] ?? ''));
    $dbUser = trim((string) ($_POST['db_user'] ?? ''));
    $dbPass = (string) ($_POST['db_pass'] ?? '');
    $adminUser = trim((string) ($_POST['admin_user'] ?? ''));
    $adminPass = (string) ($_POST['admin_pass'] ?? '');
    $adminPass2 = (string) ($_POST['admin_pass2'] ?? '');

    if ($dbHost === '' || $dbName === '' || $dbUser === '') {
        $errors[] = 'Vul de databasegegevens volledig in.';
    }
    if ($adminUser === '') {
        $errors[] = 'Vul een gebruikersnaam voor de beheerder in.';
    }
    if (strlen($adminPass) < 8) {
        $errors[] = 'Het beheerderswachtwoord moet minimaal 8 tekens zijn.';
    }
    if ($adminPass !== $adminPass2) {
        $errors[] = 'De wachtwoorden komen niet overeen.';
    }

    $pdo = null;
    if ($errors === []) {
        try {
            $pdo = new PDO(
                sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbName),
                $dbUser,
                $dbPass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            $errors[] = 'Kan geen verbinding maken met de database: ' . $e->getMessage();
        }
    }

    if ($errors === [] && $pdo !== null) {
        try {
            foreach (SCHEMA as $sql) {
                try {
                    $pdo->exec($sql);
                } catch (PDOException $e) {
                    // 1061 = duplicate index name; harmless on a re-run.
                    if (($e->errorInfo[1] ?? 0) !== 1061) {
                        throw $e;
                    }
                }
            }

            $existing = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
            if ($existing === 0) {
                $stmt = $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
                $stmt->execute([$adminUser, password_hash($adminPass, PASSWORD_DEFAULT)]);
            }

            $configCode = "<?php\n\n// Written by install.php — do not commit or upload this file.\nreturn "
                . var_export(['db_host' => $dbHost, 'db_name' => $dbName, 'db_user' => $dbUser, 'db_pass' => $dbPass], true)
                . ";\n";
            if (@file_put_contents(__DIR__ . '/config.local.php', $configCode) === false) {
                $configWriteFailed = true;
            }

            $done = true;
        } catch (Throwable $e) {
            $errors[] = 'Installatie mislukt: ' . $e->getMessage();
        }
    }
}

$prefill = [
    'db_host' => $_POST['db_host'] ?? ($config['db_host'] === 'localhost' ? 'localhost' : $config['db_host']),
    'db_name' => $_POST['db_name'] ?? (str_starts_with($config['db_name'], 'CHANGE_ME') ? '' : $config['db_name']),
    'db_user' => $_POST['db_user'] ?? (str_starts_with($config['db_user'], 'CHANGE_ME') ? '' : $config['db_user']),
];

?><!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TTPA cursus — installatie</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; background: #f1f5f9; color: #1e293b; margin: 0; padding: 2rem 1rem; }
  .card { max-width: 480px; margin: 2rem auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
  p.sub { color: #64748b; font-size: 0.875rem; margin-top: 0; }
  h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem; margin: 1.5rem 0 0.75rem; }
  label { display: block; font-size: 0.875rem; font-weight: 500; margin: 0.75rem 0 0.25rem; }
  input { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.75rem; font-size: 0.9rem; }
  input:focus { outline: 2px solid #0d9488; border-color: #0d9488; }
  button { margin-top: 1.5rem; width: 100%; background: #0d9488; color: #fff; font-weight: 600; border: 0; border-radius: 8px; padding: 0.75rem; font-size: 0.95rem; cursor: pointer; }
  button:hover { background: #0f766e; }
  .error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.875rem; margin-top: 1rem; }
  .ok { background: #f0fdfa; border: 1px solid #99f6e4; color: #115e59; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.9rem; margin-top: 1rem; }
  .warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.875rem; margin-top: 1rem; }
  code { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.85em; }
  a { color: #0d9488; }
</style>
</head>
<body>
<div class="card">
  <h1>TTPA cursus — installatie</h1>

<?php if ($installed): ?>
  <p class="sub">De applicatie is al geïnstalleerd.</p>
  <div class="warn">
    <strong>Verwijder dit bestand</strong> (<code>api/install.php</code>) van de server.
    Wachtwoord vergeten? Leeg de tabel <code>admins</code> via phpMyAdmin en draai de installatie opnieuw.
  </div>
  <p><a href="../">Naar de website</a> · <a href="../admin">Naar het beheer</a></p>

<?php elseif ($done): ?>
  <p class="sub">Installatie voltooid.</p>
  <div class="ok">
    De database is aangemaakt en het beheerdersaccount staat klaar.
    U kunt nu <a href="../admin">inloggen op het beheer</a>.
  </div>
  <?php if ($configWriteFailed): ?>
    <div class="warn">
      <code>config.local.php</code> kon niet worden geschreven (geen schrijfrechten).
      Vul de databasegegevens handmatig in in <code>api/config.php</code>.
    </div>
  <?php endif; ?>
  <div class="warn"><strong>Belangrijk:</strong> verwijder nu <code>api/install.php</code> van de server.</div>

<?php else: ?>
  <p class="sub">Vul de gegevens in om de database en het beheerdersaccount aan te maken.</p>

  <?php foreach ($errors as $error): ?>
    <div class="error"><?= esc($error) ?></div>
  <?php endforeach; ?>

  <form method="post" novalidate>
    <h2>Database (van uw hostingprovider)</h2>
    <label for="db_host">Databaseserver (host)</label>
    <input id="db_host" name="db_host" value="<?= esc((string) $prefill['db_host']) ?>" required>
    <label for="db_name">Databasenaam</label>
    <input id="db_name" name="db_name" value="<?= esc((string) $prefill['db_name']) ?>" required>
    <label for="db_user">Databasegebruiker</label>
    <input id="db_user" name="db_user" value="<?= esc((string) $prefill['db_user']) ?>" required>
    <label for="db_pass">Databasewachtwoord</label>
    <input id="db_pass" name="db_pass" type="password" autocomplete="new-password">

    <h2>Beheerdersaccount</h2>
    <label for="admin_user">Gebruikersnaam</label>
    <input id="admin_user" name="admin_user" value="<?= esc((string) ($_POST['admin_user'] ?? '')) ?>" required>
    <label for="admin_pass">Wachtwoord (minimaal 8 tekens)</label>
    <input id="admin_pass" name="admin_pass" type="password" autocomplete="new-password" required>
    <label for="admin_pass2">Wachtwoord bevestigen</label>
    <input id="admin_pass2" name="admin_pass2" type="password" autocomplete="new-password" required>

    <button type="submit">Installeren</button>
  </form>
<?php endif; ?>
</div>
</body>
</html>
