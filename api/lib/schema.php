<?php

declare(strict_types=1);

/**
 * Database schema: the base tables (version 1) plus ordered migrations.
 *
 * The installer runs BASE_SCHEMA and then migrate(). Every API request also
 * calls migrate() (via db()), so uploading a new build to the shared host
 * upgrades an existing database automatically on the next page load —
 * no need to re-run the installer. The current version is stored in
 * settings.schema_version.
 *
 * Adding a change: append a new entry to migrations() with the next number.
 * Never edit a migration that has already shipped.
 */

const BASE_SCHEMA = [
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

    // MySQL has no CREATE INDEX IF NOT EXISTS; duplicates are caught and ignored.
    'CREATE INDEX idx_reg_status ON registrations (status)',
    'CREATE INDEX idx_reg_assigned ON registrations (assigned_event_id)',
    'CREATE INDEX idx_events_date ON events (event_date)',
];

const DEFAULT_MAIL_TEMPLATES = [
    'aanmelding_ontvangen' => [
        'subject' => 'Uw aanmelding voor de TTPA cursus is ontvangen',
        'body' => "Beste {{voornaam}},\n\n"
            . "Bedankt voor uw aanmelding voor de TTPA cursus (Tips, Tricks and Pitfall Avoidance).\n\n"
            . "Uw voorkeursdatum: {{voorkeursdatum}}\n\n"
            . "Wij nemen uw aanmelding in behandeling en nemen contact met u op om de definitieve cursusdatum af te stemmen. "
            . "U ontvangt daarna een bevestiging per e-mail.\n\n"
            . "Met vriendelijke groet,\n\nTTPA cursus",
    ],
    'inschrijving_bevestigd' => [
        'subject' => 'Bevestiging TTPA cursus op {{cursusdatum}}',
        'body' => "Beste {{voornaam}},\n\n"
            . "Hierbij bevestigen wij uw deelname aan de TTPA cursus.\n\n"
            . "Datum: {{cursusdatum}}\n"
            . "Tijd: {{tijd}}\n"
            . "Locatie: {{locatie}}\n\n"
            . "{{lms_gegevens}}"
            . "Wij zien u graag op de cursus.\n\n"
            . "Met vriendelijke groet,\n\nTTPA cursus",
    ],
    'trainer_ingepland' => [
        'subject' => 'U bent ingepland als trainer op {{cursusdatum}}',
        'body' => "Beste {{naam}},\n\n"
            . "Hierbij bevestigen wij dat u bent ingepland als trainer voor de TTPA cursus.\n\n"
            . "Datum: {{cursusdatum}}\n"
            . "Tijd: {{tijd}}\n"
            . "Locatie: {{locatie}}\n"
            . "Collega-trainer(s): {{collega_trainers}}\n\n"
            . "Uw planning en beschikbaarheid vindt u op {{trainer_pagina}}\n\n"
            . "Met vriendelijke groet,\n\nTTPA cursus",
    ],
];

function table_exists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?');
    $stmt->execute([$table]);

    return (int) $stmt->fetchColumn() > 0;
}

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?'
    );
    $stmt->execute([$table, $column]);

    return (int) $stmt->fetchColumn() > 0;
}

function run_statements(PDO $pdo, array $statements): void
{
    foreach ($statements as $sql) {
        try {
            $pdo->exec($sql);
        } catch (PDOException $e) {
            // 1061 = duplicate index name; harmless on a re-run.
            if (($e->errorInfo[1] ?? 0) !== 1061) {
                throw $e;
            }
        }
    }
}

/** @return array<int, callable(PDO): void> */
function migrations(): array
{
    return [
        // 2: settings, users with roles (admins → users), trainer availability
        //    and assignment, mail templates + log, confirmation/LMS fields.
        2 => function (PDO $pdo): void {
            run_statements($pdo, [
                "CREATE TABLE IF NOT EXISTS settings (
                  k VARCHAR(64) NOT NULL PRIMARY KEY,
                  v TEXT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            ]);

            if (table_exists($pdo, 'admins') && !table_exists($pdo, 'users')) {
                $pdo->exec('RENAME TABLE admins TO users');
            }
            if (!column_exists($pdo, 'users', 'role')) {
                $pdo->exec(
                    "ALTER TABLE users
                     ADD COLUMN role ENUM('admin','trainer') NOT NULL DEFAULT 'admin' AFTER password_hash,
                     ADD COLUMN name VARCHAR(255) NULL AFTER role,
                     ADD COLUMN email VARCHAR(255) NULL AFTER name,
                     ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER email"
                );
            }

            run_statements($pdo, [
                "CREATE TABLE IF NOT EXISTS trainer_availability (
                  user_id INT UNSIGNED NOT NULL,
                  event_id INT UNSIGNED NOT NULL,
                  status ENUM('beschikbaar','misschien','niet') NOT NULL,
                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (user_id, event_id),
                  CONSTRAINT fk_av_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                  CONSTRAINT fk_av_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

                "CREATE TABLE IF NOT EXISTS event_trainers (
                  event_id INT UNSIGNED NOT NULL,
                  user_id INT UNSIGNED NOT NULL,
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (event_id, user_id),
                  CONSTRAINT fk_et_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
                  CONSTRAINT fk_et_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

                "CREATE TABLE IF NOT EXISTS mail_templates (
                  tpl_key VARCHAR(50) NOT NULL PRIMARY KEY,
                  subject VARCHAR(255) NOT NULL,
                  body TEXT NOT NULL,
                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

                "CREATE TABLE IF NOT EXISTS mail_log (
                  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  registration_id INT UNSIGNED NULL,
                  tpl_key VARCHAR(50) NULL,
                  recipient VARCHAR(255) NOT NULL,
                  subject VARCHAR(255) NOT NULL,
                  status ENUM('verzonden','mislukt') NOT NULL,
                  error TEXT NULL,
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT fk_ml_registration FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                'CREATE INDEX idx_ml_registration ON mail_log (registration_id)',
            ]);

            $pdo->exec(
                "ALTER TABLE registrations
                 MODIFY COLUMN status ENUM('nieuw','ingedeeld','bevestigd','geannuleerd') NOT NULL DEFAULT 'nieuw'"
            );
            if (!column_exists($pdo, 'registrations', 'confirmed_at')) {
                $pdo->exec(
                    "ALTER TABLE registrations
                     ADD COLUMN confirmed_at DATETIME NULL AFTER status,
                     ADD COLUMN lms_status VARCHAR(20) NULL AFTER confirmed_at,
                     ADD COLUMN lms_user_id VARCHAR(100) NULL AFTER lms_status,
                     ADD COLUMN lms_message TEXT NULL AFTER lms_user_id"
                );
            }

            $stmt = $pdo->prepare('INSERT IGNORE INTO mail_templates (tpl_key, subject, body) VALUES (?, ?, ?)');
            foreach (array_intersect_key(DEFAULT_MAIL_TEMPLATES, array_flip(['aanmelding_ontvangen', 'inschrijving_bevestigd'])) as $key => $tpl) {
                $stmt->execute([$key, $tpl['subject'], $tpl['body']]);
            }

            // Defaults. Mail server values come from the environment locally
            // (Docker → Mailpit); on the shared host the installer or the
            // admin settings page fills them in.
            $defaults = [
                'app_secret' => bin2hex(random_bytes(32)),
                'construction_enabled' => '1',
                'construction_password' => 'goudvis',
                'mail_transport' => getenv('MAIL_HOST') ? 'smtp' : 'mail',
                'smtp_host' => getenv('MAIL_HOST') ?: '',
                'smtp_port' => getenv('MAIL_PORT') ?: '587',
                'smtp_secure' => getenv('MAIL_HOST') ? 'none' : 'tls',
                'smtp_user' => '',
                'smtp_pass' => '',
                'mail_from_address' => getenv('MAIL_FROM') ?: '',
                'mail_from_name' => 'TTPA cursus',
                'mail_bcc' => '',
            ];
            $stmt = $pdo->prepare('INSERT IGNORE INTO settings (k, v) VALUES (?, ?)');
            foreach ($defaults as $k => $v) {
                $stmt->execute([$k, $v]);
            }
        },

        // 3: trainer assignments are confirmed by the admin (with a mail to the trainer).
        3 => function (PDO $pdo): void {
            if (!column_exists($pdo, 'event_trainers', 'confirmed_at')) {
                $pdo->exec('ALTER TABLE event_trainers ADD COLUMN confirmed_at DATETIME NULL AFTER user_id');
            }
            $tpl = DEFAULT_MAIL_TEMPLATES['trainer_ingepland'];
            $pdo->prepare('INSERT IGNORE INTO mail_templates (tpl_key, subject, body) VALUES (?, ?, ?)')
                ->execute(['trainer_ingepland', $tpl['subject'], $tpl['body']]);
        },
    ];
}

function latest_schema_version(): int
{
    return max(array_keys(migrations()));
}

function current_schema_version(PDO $pdo): int
{
    try {
        $v = $pdo->query("SELECT v FROM settings WHERE k = 'schema_version'")->fetchColumn();
        if ($v !== false) {
            return (int) $v;
        }
    } catch (PDOException $e) {
        // settings table does not exist yet
    }

    // No version recorded: version 1 if the base tables exist, otherwise not installed (0).
    return table_exists($pdo, 'admins') || table_exists($pdo, 'users') ? 1 : 0;
}

/**
 * Bring the database up to the latest version. Does nothing when the
 * application has not been installed yet (no base tables).
 */
function migrate(PDO $pdo): void
{
    $version = current_schema_version($pdo);
    if ($version === 0 || $version >= latest_schema_version()) {
        return;
    }

    // Serialise concurrent requests; the loser re-reads the version.
    $pdo->query("SELECT GET_LOCK('ttpa_migrate', 30)");
    try {
        $version = current_schema_version($pdo);
        foreach (migrations() as $target => $migration) {
            if ($target <= $version) {
                continue;
            }
            $migration($pdo);
            $pdo->prepare("REPLACE INTO settings (k, v) VALUES ('schema_version', ?)")->execute([(string) $target]);
        }
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('ttpa_migrate')");
    }
}
