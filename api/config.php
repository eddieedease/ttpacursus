<?php

declare(strict_types=1);

/**
 * Database configuration.
 *
 * Locally the Docker container provides these as environment variables.
 * On the shared host the web installer (install.php) writes a
 * config.local.php with the real credentials; that file overrides the
 * values below and is never part of a build, so re-uploading a new
 * build never wipes your production credentials.
 */
$config = [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'CHANGE_ME_DB_NAME',
    'db_user' => getenv('DB_USER') ?: 'CHANGE_ME_DB_USER',
    'db_pass' => getenv('DB_PASS') ?: 'CHANGE_ME_DB_PASS',
];

$localFile = __DIR__ . '/config.local.php';
if (is_file($localFile)) {
    $config = array_merge($config, require $localFile);
}

return $config;
