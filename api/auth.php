<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';

$config = require __DIR__ . '/config.php';

start_session();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        json_response(['authenticated' => is_admin()]);

    case 'POST':
        $body = read_json();
        $password = (string) ($body['password'] ?? '');

        if ($password !== '' && hash_equals((string) $config['admin_password'], $password)) {
            session_regenerate_id(true);
            $_SESSION['is_admin'] = true;
            json_response(['authenticated' => true]);
        }

        json_error('Onjuist wachtwoord', 401);

    case 'DELETE':
        $_SESSION = [];
        session_destroy();
        json_response(['authenticated' => false]);

    default:
        json_error('Methode niet toegestaan', 405);
}
