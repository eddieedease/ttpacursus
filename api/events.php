<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/site.php';

const EVENT_STATUSES = ['open', 'gesloten', 'geannuleerd'];

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (is_admin()) {
            $rows = db()->query(
                "SELECT e.id,
                        e.event_date AS eventDate,
                        e.start_time AS startTime,
                        e.end_time AS endTime,
                        e.location,
                        e.capacity,
                        e.status,
                        e.notes,
                        (SELECT COUNT(*) FROM registrations r WHERE r.assigned_event_id = e.id) AS assignedCount,
                        (SELECT COUNT(*) FROM registrations r WHERE r.assigned_event_id = e.id AND r.status = 'bevestigd') AS confirmedCount,
                        (SELECT COUNT(*) FROM registrations r WHERE r.preferred_event_id = e.id AND r.status <> 'geannuleerd') AS preferredCount
                 FROM events e
                 ORDER BY e.event_date"
            )->fetchAll();

            // Per date: every active trainer with their availability and whether they are assigned.
            $trainers = db()->query(
                "SELECT e.id AS eventId, u.id AS userId, COALESCE(u.name, u.username) AS name,
                        a.status AS availability,
                        (et.user_id IS NOT NULL) AS assigned,
                        (et.confirmed_at IS NOT NULL) AS confirmed
                 FROM events e
                 CROSS JOIN users u
                 LEFT JOIN trainer_availability a ON a.event_id = e.id AND a.user_id = u.id
                 LEFT JOIN event_trainers et ON et.event_id = e.id AND et.user_id = u.id
                 WHERE u.role = 'trainer' AND (u.is_active = 1 OR et.user_id IS NOT NULL)
                 ORDER BY name"
            )->fetchAll();
            $byEvent = [];
            foreach ($trainers as $t) {
                $byEvent[$t['eventId']][] = [
                    'userId' => (int) $t['userId'],
                    'name' => $t['name'],
                    'availability' => $t['availability'],
                    'assigned' => (bool) $t['assigned'],
                    'confirmed' => (bool) $t['confirmed'],
                ];
            }
            foreach ($rows as &$row) {
                $row['trainers'] = $byEvent[$row['id']] ?? [];
            }
            unset($row);
        } else {
            require_site_unlocked();
            // Public: only open, future dates, with remaining spots.
            $rows = db()->query(
                "SELECT e.id,
                        e.event_date AS eventDate,
                        e.start_time AS startTime,
                        e.end_time AS endTime,
                        e.location,
                        GREATEST(e.capacity - (SELECT COUNT(*) FROM registrations r WHERE r.assigned_event_id = e.id), 0) AS spotsLeft
                 FROM events e
                 WHERE e.status = 'open' AND e.event_date >= CURDATE()
                 ORDER BY e.event_date"
            )->fetchAll();
            foreach ($rows as &$row) {
                $row['spotsLeft'] = (int) $row['spotsLeft'];
            }
        }
        json_response($rows);

    case 'POST':
        require_admin();
        $body = read_json();

        $eventDate = (string) ($body['eventDate'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)) {
            json_error('Ongeldige datum');
        }
        $status = (string) ($body['status'] ?? 'open');
        if (!in_array($status, EVENT_STATUSES, true)) {
            json_error('Ongeldige status');
        }

        $stmt = db()->prepare(
            'INSERT INTO events (event_date, start_time, end_time, location, capacity, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $eventDate,
            ($body['startTime'] ?? null) ?: null,
            ($body['endTime'] ?? null) ?: null,
            ($body['location'] ?? null) ?: null,
            max(1, (int) ($body['capacity'] ?? 12)),
            $status,
            ($body['notes'] ?? null) ?: null,
        ]);

        json_response(['id' => (int) db()->lastInsertId()], 201);

    case 'PUT':
        require_admin();
        $body = read_json();

        $id = (int) ($body['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        $fields = [
            'eventDate' => 'event_date',
            'startTime' => 'start_time',
            'endTime' => 'end_time',
            'location' => 'location',
            'capacity' => 'capacity',
            'status' => 'status',
            'notes' => 'notes',
        ];
        $set = [];
        $params = [];
        foreach ($fields as $key => $column) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = $body[$key];
            if ($key === 'eventDate' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $value)) {
                json_error('Ongeldige datum');
            }
            if ($key === 'status' && !in_array($value, EVENT_STATUSES, true)) {
                json_error('Ongeldige status');
            }
            if ($key === 'capacity') {
                $value = max(1, (int) $value);
            }
            if (in_array($key, ['startTime', 'endTime', 'location', 'notes'], true) && $value === '') {
                $value = null;
            }
            $set[] = "$column = ?";
            $params[] = $value;
        }

        // Assigned trainers: replaces the whole set.
        $trainerIds = null;
        if (array_key_exists('trainerIds', $body)) {
            $trainerIds = array_values(array_unique(array_map('intval', (array) $body['trainerIds'])));
        }

        if ($set === [] && $trainerIds === null) {
            json_error('Geen wijzigingen opgegeven');
        }

        $pdo = db();
        $pdo->beginTransaction();
        if ($set !== []) {
            $params[] = $id;
            $stmt = $pdo->prepare('UPDATE events SET ' . implode(', ', $set) . ' WHERE id = ?');
            $stmt->execute($params);
        }
        if ($trainerIds !== null) {
            // Remove trainers no longer in the set; keep existing rows (and their confirmation).
            $placeholders = implode(',', array_fill(0, count($trainerIds), '?')) ?: 'NULL';
            $pdo->prepare("DELETE FROM event_trainers WHERE event_id = ? AND user_id NOT IN ($placeholders)")
                ->execute([$id, ...$trainerIds]);
            $insert = $pdo->prepare(
                "INSERT IGNORE INTO event_trainers (event_id, user_id)
                 SELECT ?, id FROM users WHERE id = ? AND role = 'trainer'"
            );
            foreach ($trainerIds as $trainerId) {
                $insert->execute([$id, $trainerId]);
            }
        }
        $pdo->commit();

        json_response(['updated' => true]);

    case 'DELETE':
        require_admin();
        $id = (int) ($_GET['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        // Registrations that point to this date fall back to NULL (FK ON DELETE SET NULL);
        // put registrations that were assigned to it back to 'nieuw'.
        $pdo = db();
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE registrations SET status = 'nieuw' WHERE assigned_event_id = ? AND status = 'ingedeeld'");
        $stmt->execute([$id]);
        $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $pdo->commit();

        json_response(['deleted' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
