<?php

declare(strict_types=1);

/** Key/value site settings (under construction, mail server, …). */
function settings(): array
{
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        foreach (db()->query('SELECT k, v FROM settings') as $row) {
            $cache[$row['k']] = (string) $row['v'];
        }
    }

    return $cache;
}

function setting(string $key, string $default = ''): string
{
    return settings()[$key] ?? $default;
}

function save_settings(array $values): void
{
    $stmt = db()->prepare('REPLACE INTO settings (k, v) VALUES (?, ?)');
    foreach ($values as $k => $v) {
        $stmt->execute([$k, (string) $v]);
    }
}
