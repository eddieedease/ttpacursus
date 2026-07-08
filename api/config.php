<?php

declare(strict_types=1);

/**
 * Database configuration.
 *
 * Locally the Docker container provides these as environment variables.
 * On the shared host no env vars exist, so the fallback values apply —
 * fill those in with the credentials from your hosting provider before upload.
 */
return [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'CHANGE_ME_DB_NAME',
    'db_user' => getenv('DB_USER') ?: 'CHANGE_ME_DB_USER',
    'db_pass' => getenv('DB_PASS') ?: 'CHANGE_ME_DB_PASS',

    // Admin password for /admin. CHANGE THIS on the shared host!
    'admin_password' => getenv('ADMIN_PASSWORD') ?: 'ttpa2025',
];
