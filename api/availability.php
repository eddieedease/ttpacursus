<?php

declare(strict_types=1);

/**
 * Trainer availability for the logged-in trainer.
 *
 * GET → upcoming course dates (not cancelled) with the trainer's own
 *       availability and whether the admin assigned them.
 * PUT { eventId, status: 'beschikbaar' | 'misschien' | 'niet' | null }
 */

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

const AVAILABILITY_STATUSES = ['beschikbaar', 'misschien', 'niet'];

$user = require_user();
if ($user['role'] !== 'trainer') {
    json_error('Alleen voor trainers', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $stmt = db()->prepare(
            "SELECT e.id AS eventId, e.event_date AS eventDate, e.start_time AS startTime, e.end_time AS endTime,
                    e.location, e.status AS eventStatus,
                    a.status AS availability,
                    (et.user_id IS NOT NULL) AS assigned
             FROM events e
             LEFT JOIN trainer_availability a ON a.event_id = e.id AND a.user_id = ?
             LEFT JOIN event_trainers et ON et.event_id = e.id AND et.user_id = ?
             WHERE e.event_date >= CURDATE() AND e.status <> 'geannuleerd'
             ORDER BY e.event_date"
        );
        $stmt->execute([$user['id'], $user['id']]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['eventId'] = (int) $row['eventId'];
            $row['assigned'] = (bool) $row['assigned'];
        }
        json_response($rows);

    case 'PUT':
        $body = read_json();
        $eventId = (int) ($body['eventId'] ?? 0);
        $status = $body['status'] ?? null;

        $stmt = db()->prepare("SELECT id FROM events WHERE id = ? AND event_date >= CURDATE() AND status <> 'geannuleerd'");
        $stmt->execute([$eventId]);
        if (!$stmt->fetch()) {
            json_error('Cursusdatum niet gevonden');
        }

        if ($status === null) {
            db()->prepare('DELETE FROM trainer_availability WHERE user_id = ? AND event_id = ?')->execute([$user['id'], $eventId]);
        } else {
            if (!in_array($status, AVAILABILITY_STATUSES, true)) {
                json_error('Ongeldige status');
            }
            db()->prepare(
                'INSERT INTO trainer_availability (user_id, event_id, status) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status)'
            )->execute([$user['id'], $eventId, $status]);
        }
        json_response(['updated' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
