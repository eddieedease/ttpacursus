<?php

declare(strict_types=1);

/**
 * Admin overview of trainers: contact details, upcoming dates they are
 * assigned to, and their availability for upcoming course dates.
 */

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Methode niet toegestaan', 405);
}

$trainers = db()->query(
    "SELECT id, username, COALESCE(name, username) AS name, email, is_active AS isActive
     FROM users WHERE role = 'trainer' ORDER BY name"
)->fetchAll();

// Every upcoming, non-cancelled date × trainer, with availability and assignment.
$rows = db()->query(
    "SELECT u.id AS userId, e.id AS eventId, e.event_date AS eventDate, e.location,
            a.status AS availability, (et.user_id IS NOT NULL) AS assigned, (et.confirmed_at IS NOT NULL) AS confirmed
     FROM users u
     CROSS JOIN events e
     LEFT JOIN trainer_availability a ON a.user_id = u.id AND a.event_id = e.id
     LEFT JOIN event_trainers et ON et.user_id = u.id AND et.event_id = e.id
     WHERE u.role = 'trainer' AND e.event_date >= CURDATE() AND e.status <> 'geannuleerd'
     ORDER BY e.event_date"
)->fetchAll();

$dates = [];
foreach ($rows as $row) {
    $dates[$row['userId']][] = [
        'eventId' => (int) $row['eventId'],
        'eventDate' => $row['eventDate'],
        'location' => $row['location'],
        'availability' => $row['availability'],
        'assigned' => (bool) $row['assigned'],
        'confirmed' => (bool) $row['confirmed'],
    ];
}

foreach ($trainers as &$trainer) {
    $trainer['isActive'] = (bool) $trainer['isActive'];
    $trainer['dates'] = $dates[$trainer['id']] ?? [];
}

json_response($trainers);
