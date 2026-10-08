<?php

declare(strict_types=1);

require_once __DIR__ . '/http.php';

const USER_ROLES = ['admin', 'trainer'];

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

/** @return array{id: int, role: string, name: string}|null */
function current_user(): ?array
{
    start_session();

    return isset($_SESSION['user_id'])
        ? ['id' => (int) $_SESSION['user_id'], 'role' => (string) $_SESSION['role'], 'name' => (string) $_SESSION['name']]
        : null;
}

function is_admin(): bool
{
    return (current_user()['role'] ?? null) === 'admin';
}

function require_admin(): void
{
    if (!is_admin()) {
        json_error('Niet ingelogd', 401);
    }
}

/** Any logged-in user (admin or trainer). */
function require_user(): array
{
    $user = current_user();
    if ($user === null) {
        json_error('Niet ingelogd', 401);
    }

    return $user;
}
