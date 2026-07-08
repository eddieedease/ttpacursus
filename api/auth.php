<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

start_session();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        json_response(['authenticated' => is_admin()]);

    case 'POST':
        $body = read_json();
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($username !== '' && $password !== '') {
            $stmt = db()->prepare('SELECT password_hash FROM admins WHERE username = ?');
            $stmt->execute([$username]);
            $admin = $stmt->fetch();

            if ($admin && password_verify($password, $admin['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['is_admin'] = true;
                json_response(['authenticated' => true]);
            }
        }

        json_error('Onjuiste inloggegevens', 401);

    case 'DELETE':
        $_SESSION = [];
        session_destroy();
        json_response(['authenticated' => false]);

    default:
        json_error('Methode niet toegestaan', 405);
}
