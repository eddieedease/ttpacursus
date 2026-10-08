<?php

declare(strict_types=1);

require_once __DIR__ . '/http.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/settings.php';

/**
 * "Under construction" mode: while enabled, the public site and its public
 * API endpoints are only available after entering the preview password.
 * Unlocking sets a signed cookie; changing the password invalidates it.
 * Logged-in admins and trainers always have access.
 */
const PREVIEW_COOKIE = 'ttpa_preview';

function construction_enabled(): bool
{
    return setting('construction_enabled', '0') === '1';
}

function preview_token(): string
{
    return hash_hmac('sha256', setting('construction_password'), setting('app_secret'));
}

function site_unlocked(): bool
{
    if (!construction_enabled() || current_user() !== null) {
        return true;
    }
    $cookie = (string) ($_COOKIE[PREVIEW_COOKIE] ?? '');

    return $cookie !== '' && hash_equals(preview_token(), $cookie);
}

function require_site_unlocked(): void
{
    if (!site_unlocked()) {
        json_error('De site is nog in aanbouw', 403);
    }
}

function set_preview_cookie(): void
{
    setcookie(PREVIEW_COOKIE, preview_token(), [
        'expires' => time() + 60 * 60 * 24 * 30,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
}
