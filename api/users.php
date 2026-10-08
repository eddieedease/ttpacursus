<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

require_admin();

function active_admin_count(?int $excludeId = null): int
{
    $stmt = db()->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?");
    $stmt->execute([$excludeId ?? 0]);

    return (int) $stmt->fetchColumn();
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $rows = db()->query(
            "SELECT u.id, u.username, u.name, u.email, u.role, u.is_active AS isActive, u.created_at AS createdAt,
                    (SELECT COUNT(*) FROM event_trainers et WHERE et.user_id = u.id) AS assignedCount
             FROM users u
             ORDER BY u.role, COALESCE(u.name, u.username)"
        )->fetchAll();
        foreach ($rows as &$row) {
            $row['isActive'] = (bool) $row['isActive'];
        }
        json_response($rows);

    case 'POST':
        $body = read_json();
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $role = (string) ($body['role'] ?? 'trainer');
        $email = trim((string) ($body['email'] ?? ''));

        if ($username === '') {
            json_error('Gebruikersnaam is verplicht');
        }
        if (strlen($password) < 8) {
            json_error('Het wachtwoord moet minimaal 8 tekens zijn');
        }
        if (!in_array($role, USER_ROLES, true)) {
            json_error('Ongeldige rol');
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Ongeldig e-mailadres');
        }
        $stmt = db()->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            json_error('Deze gebruikersnaam bestaat al');
        }

        db()->prepare('INSERT INTO users (username, password_hash, role, name, email) VALUES (?, ?, ?, ?, ?)')
            ->execute([$username, password_hash($password, PASSWORD_DEFAULT), $role, trim((string) ($body['name'] ?? '')) ?: null, $email ?: null]);
        json_response(['id' => (int) db()->lastInsertId()], 201);

    case 'PUT':
        $body = read_json();
        $id = (int) ($body['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }
        $self = current_user()['id'];

        $set = [];
        $params = [];
        if (array_key_exists('name', $body)) {
            $set[] = 'name = ?';
            $params[] = trim((string) $body['name']) ?: null;
        }
        if (array_key_exists('email', $body)) {
            $email = trim((string) $body['email']);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_error('Ongeldig e-mailadres');
            }
            $set[] = 'email = ?';
            $params[] = $email ?: null;
        }
        if (array_key_exists('role', $body)) {
            if (!in_array($body['role'], USER_ROLES, true)) {
                json_error('Ongeldige rol');
            }
            if ($body['role'] !== 'admin' && active_admin_count($id) === 0) {
                json_error('Er moet minimaal één actieve beheerder overblijven');
            }
            $set[] = 'role = ?';
            $params[] = $body['role'];
        }
        if (array_key_exists('isActive', $body)) {
            if (!$body['isActive'] && $id === $self) {
                json_error('U kunt uw eigen account niet deactiveren');
            }
            if (!$body['isActive'] && active_admin_count($id) === 0) {
                json_error('Er moet minimaal één actieve beheerder overblijven');
            }
            $set[] = 'is_active = ?';
            $params[] = $body['isActive'] ? 1 : 0;
        }
        if (!empty($body['password'])) {
            if (strlen((string) $body['password']) < 8) {
                json_error('Het wachtwoord moet minimaal 8 tekens zijn');
            }
            $set[] = 'password_hash = ?';
            $params[] = password_hash((string) $body['password'], PASSWORD_DEFAULT);
        }
        if ($set === []) {
            json_error('Geen wijzigingen opgegeven');
        }

        $params[] = $id;
        db()->prepare('UPDATE users SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($params);
        json_response(['updated' => true]);

    case 'DELETE':
        $id = (int) ($_GET['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }
        if ($id === current_user()['id']) {
            json_error('U kunt uw eigen account niet verwijderen');
        }
        if (active_admin_count($id) === 0) {
            json_error('Er moet minimaal één actieve beheerder overblijven');
        }
        db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
        json_response(['deleted' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
