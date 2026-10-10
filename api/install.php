<?php

declare(strict_types=1);

/**
 * TTPA cursus — web installer.
 *
 * Run this once after uploading the site to the shared host:
 *   https://uw-domein.nl/api/install.php
 *
 * It creates the database tables, the first admin account, stores the mail
 * settings, and writes the database credentials to config.local.php. It locks itself once an admin
 * account exists — but DELETE THIS FILE from the server after installing.
 */

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

require __DIR__ . '/lib/schema.php';
require __DIR__ . '/lib/demo.php';

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
    // Installed = at least one admin account. Trainers alone do not count, so
    // deleting all admins (password forgotten) re-opens the installer.
    $countSql = table_exists($pdo, 'users')
        ? "SELECT COUNT(*) FROM users WHERE role = 'admin'"
        : 'SELECT COUNT(*) FROM admins';
    $installed = (int) $pdo->query($countSql)->fetchColumn() > 0;
} catch (Throwable $e) {
    // No connection or no tables yet: not installed.
}

$errors = [];
$done = false;
$configWriteFailed = false;
$demo = null;

if (!$installed && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbHost = trim((string) ($_POST['db_host'] ?? ''));
    $dbName = trim((string) ($_POST['db_name'] ?? ''));
    $dbUser = trim((string) ($_POST['db_user'] ?? ''));
    $dbPass = (string) ($_POST['db_pass'] ?? '');
    $adminUser = trim((string) ($_POST['admin_user'] ?? ''));
    $adminPass = (string) ($_POST['admin_pass'] ?? '');
    $adminPass2 = (string) ($_POST['admin_pass2'] ?? '');
    $mail = [
        'mail_transport' => ($_POST['mail_transport'] ?? 'smtp') === 'mail' ? 'mail' : 'smtp',
        'smtp_host' => trim((string) ($_POST['smtp_host'] ?? '')),
        'smtp_port' => trim((string) ($_POST['smtp_port'] ?? '587')),
        'smtp_secure' => in_array($_POST['smtp_secure'] ?? '', ['ssl', 'tls', 'none'], true) ? $_POST['smtp_secure'] : 'tls',
        'smtp_user' => trim((string) ($_POST['smtp_user'] ?? '')),
        'smtp_pass' => (string) ($_POST['smtp_pass'] ?? ''),
        'mail_from_address' => trim((string) ($_POST['mail_from_address'] ?? '')),
        'mail_from_name' => trim((string) ($_POST['mail_from_name'] ?? '')) ?: 'TTPA cursus',
    ];

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
    if ($mail['mail_from_address'] !== '' && !filter_var($mail['mail_from_address'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Het afzenderadres is geen geldig e-mailadres.';
    }
    if ($mail['mail_transport'] === 'smtp' && $mail['mail_from_address'] !== '' && $mail['smtp_host'] === '') {
        $errors[] = 'Vul de SMTP-server in, of kies "PHP mail()".';
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
            if (!table_exists($pdo, 'users')) {
                run_statements($pdo, BASE_SCHEMA);
            }
            migrate($pdo);

            $existing = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($existing === 0) {
                // Replaces a leftover account with the same username (e.g. a trainer).
                $pdo->prepare('DELETE FROM users WHERE username = ?')->execute([$adminUser]);
                $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')");
                $stmt->execute([$adminUser, password_hash($adminPass, PASSWORD_DEFAULT)]);
            }

            if (!empty($_POST['demo_data'])) {
                $demo = load_demo_data($pdo);
            }

            if ($mail['mail_from_address'] !== '') {
                $stmt = $pdo->prepare('REPLACE INTO settings (k, v) VALUES (?, ?)');
                foreach ($mail as $k => $v) {
                    $stmt->execute([$k, $v]);
                }
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
  label.check { display: flex; gap: 0.6rem; align-items: flex-start; font-weight: 400; line-height: 1.4; }
  label.check input { width: auto; margin-top: 0.2rem; }
  p.hint { color: #64748b; font-size: 0.8rem; margin: 0 0 0.5rem; }
  select { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.75rem; font-size: 0.9rem; background: #fff; }
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
    Wachtwoord vergeten? Een andere beheerder kan het resetten via Beheer → Gebruikers. Lukt dat niet:
    verwijder de beheerders via phpMyAdmin (<code>DELETE FROM users WHERE role = 'admin'</code>) en draai de installatie opnieuw.
    Trainers en alle overige gegevens blijven behouden.
  </div>
  <p><a href="../">Naar de website</a> · <a href="../admin">Naar het beheer</a></p>

<?php elseif ($done): ?>
  <p class="sub">Installatie voltooid.</p>
  <div class="ok">
    De database is aangemaakt en het beheerdersaccount staat klaar.
    U kunt nu <a href="../admin">inloggen op het beheer</a>.
  </div>
  <?php if ($demo): ?>
    <div class="ok">
      <strong>Demodata geladen</strong>: organisaties, vier cursusdata, twaalf aanmeldingen en drie trainers.
      Trainers loggen in op <a href="../trainer">/trainer</a> met gebruikersnaam
      <?= implode(', ', array_map(fn(string $u): string => '<code>' . esc($u) . '</code>', $demo['trainers'])) ?>
      en wachtwoord <code><?= esc($demo['password']) ?></code>.
      <br><strong>Noteer dit wachtwoord nu</strong>; het wordt niet nog eens getoond
      (u kunt het later wijzigen via Beheer → Gebruikers).
    </div>
  <?php endif; ?>
  <div class="warn">
    De site staat <strong>in aanbouw</strong>: bezoekers zien een wachtwoordpagina
    (wachtwoord <code>goudvis</code>). Zet dit uit via Beheer → Instellingen zodra de site live gaat.
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

    <h2>E-mail (optioneel, kan later via Beheer → Instellingen)</h2>
    <p class="hint">De SMTP-gegevens vindt u in het controlepaneel van uw hostingprovider, bij de instellingen van het e-mailaccount.</p>
    <label for="mail_from_address">Afzenderadres</label>
    <input id="mail_from_address" name="mail_from_address" type="email" value="<?= esc((string) ($_POST['mail_from_address'] ?? '')) ?>" placeholder="info@uw-domein.nl">
    <label for="mail_from_name">Afzendernaam</label>
    <input id="mail_from_name" name="mail_from_name" value="<?= esc((string) ($_POST['mail_from_name'] ?? 'TTPA cursus')) ?>">
    <label for="mail_transport">Verzendmethode</label>
    <select id="mail_transport" name="mail_transport">
      <option value="smtp" <?= ($_POST['mail_transport'] ?? 'smtp') === 'smtp' ? 'selected' : '' ?>>SMTP (aanbevolen)</option>
      <option value="mail" <?= ($_POST['mail_transport'] ?? '') === 'mail' ? 'selected' : '' ?>>PHP mail()</option>
    </select>
    <label for="smtp_host">SMTP-server</label>
    <input id="smtp_host" name="smtp_host" value="<?= esc((string) ($_POST['smtp_host'] ?? '')) ?>" placeholder="mail.uw-domein.nl">
    <label for="smtp_port">Poort</label>
    <input id="smtp_port" name="smtp_port" inputmode="numeric" value="<?= esc((string) ($_POST['smtp_port'] ?? '587')) ?>">
    <label for="smtp_secure">Beveiliging</label>
    <select id="smtp_secure" name="smtp_secure">
      <option value="tls" <?= ($_POST['smtp_secure'] ?? 'tls') === 'tls' ? 'selected' : '' ?>>STARTTLS (meestal poort 587)</option>
      <option value="ssl" <?= ($_POST['smtp_secure'] ?? '') === 'ssl' ? 'selected' : '' ?>>SSL/TLS (meestal poort 465)</option>
      <option value="none" <?= ($_POST['smtp_secure'] ?? '') === 'none' ? 'selected' : '' ?>>Geen</option>
    </select>
    <label for="smtp_user">SMTP-gebruikersnaam</label>
    <input id="smtp_user" name="smtp_user" value="<?= esc((string) ($_POST['smtp_user'] ?? '')) ?>" autocomplete="off">
    <label for="smtp_pass">SMTP-wachtwoord</label>
    <input id="smtp_pass" name="smtp_pass" type="password" autocomplete="new-password">

    <h2>Demo</h2>
    <label class="check">
      <input type="checkbox" name="demo_data" value="1" <?= !empty($_POST['demo_data']) ? 'checked' : '' ?>>
      Voorbeeldgegevens laden: fictieve organisaties, cursusdata, aanmeldingen en trainers om de site te kunnen laten zien.
      Alle e-mailadressen eindigen op <code>@example.com</code>, er wordt dus niemand echt gemaild.
    </label>

    <button type="submit">Installeren</button>
  </form>
<?php endif; ?>
</div>
</body>
</html>
