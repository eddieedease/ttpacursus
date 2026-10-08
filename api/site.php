<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/site.php';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        json_response(['construction' => construction_enabled(), 'unlocked' => site_unlocked()]);

    case 'POST':
        // Unlock the preview with the construction password.
        $password = (string) (read_json()['password'] ?? '');
        if (!construction_enabled()) {
            json_response(['unlocked' => true]);
        }
        if ($password === '' || !hash_equals(setting('construction_password'), $password)) {
            json_error('Onjuist wachtwoord', 401);
        }
        set_preview_cookie();
        json_response(['unlocked' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
