<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Methode niet toegestaan', 405);
}

$sql = 'SELECT l.id, l.registration_id AS registrationId, l.tpl_key AS templateKey, l.recipient, l.subject,
               l.status, l.error, l.created_at AS createdAt
        FROM mail_log l';
$params = [];
if (!empty($_GET['registration_id'])) {
    $sql .= ' WHERE l.registration_id = ?';
    $params[] = (int) $_GET['registration_id'];
}
$sql .= ' ORDER BY l.id DESC LIMIT 200';

$stmt = db()->prepare($sql);
$stmt->execute($params);
json_response($stmt->fetchAll());
