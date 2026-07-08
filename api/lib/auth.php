<?php

declare(strict_types=1);

require_once __DIR__ . '/http.php';

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name('TTPASESSID');
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'path' => '/',
        ]);
        session_start();
    }
}

function is_admin(): bool
{
    start_session();

    return !empty($_SESSION['is_admin']);
}

function require_admin(): void
{
    if (!is_admin()) {
        json_error('Niet ingelogd', 401);
    }
}
