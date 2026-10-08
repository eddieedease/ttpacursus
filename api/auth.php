<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

start_session();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $user = current_user();
        json_response(['authenticated' => $user !== null, 'role' => $user['role'] ?? null, 'name' => $user['name'] ?? null]);

    case 'POST':
        $body = read_json();
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($username !== '' && $password !== '') {
            $stmt = db()->prepare('SELECT id, username, name, role, password_hash FROM users WHERE username = ? AND is_active = 1');
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['user_id'] = (int) $user['id'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['name'] = $user['name'] ?: $user['username'];
                json_response(['authenticated' => true, 'role' => $user['role'], 'name' => $_SESSION['name']]);
            }
        }

        json_error('Onjuiste inloggegevens', 401);

    case 'DELETE':
        $_SESSION = [];
        session_destroy();
        json_response(['authenticated' => false, 'role' => null, 'name' => null]);

    default:
        json_error('Methode niet toegestaan', 405);
}
