<?php

declare(strict_types=1);

/**
 * Confirm the trainers scheduled on a course date: every assigned trainer
 * that is not yet confirmed gets the "trainer ingepland" mail and is then
 * marked confirmed (from then on they see the date as scheduled).
 *
 * POST { eventId: number }
 */

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/mail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Methode niet toegestaan', 405);
}
require_admin();

$eventId = (int) (read_json()['eventId'] ?? 0);
$stmt = db()->prepare(
    'SELECT et.user_id FROM event_trainers et JOIN users u ON u.id = et.user_id
     WHERE et.event_id = ? AND et.confirmed_at IS NULL'
);
$stmt->execute([$eventId]);
$userIds = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
if ($userIds === []) {
    json_error('Er zijn geen ingeplande trainers om te bevestigen');
}

$results = [];
foreach ($userIds as $userId) {
    try {
        $vars = trainer_mail_vars($eventId, $userId);
        if (!filter_var($vars['email'], FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException("{$vars['naam']} heeft geen (geldig) e-mailadres; vul het in onder Gebruikers");
        }
        $mail = render_mail_template('trainer_ingepland', $vars);
    } catch (Throwable $e) {
        $results[] = ['id' => $userId, 'ok' => false, 'error' => $e->getMessage()];
        continue;
    }

    $sent = send_mail($vars['email'], $mail['subject'], $mail['body'], null, 'trainer_ingepland');
    if (!$sent['ok']) {
        $results[] = ['id' => $userId, 'ok' => false, 'error' => "{$vars['naam']}: mail niet verzonden: {$sent['error']}"];
        continue;
    }

    db()->prepare('UPDATE event_trainers SET confirmed_at = NOW() WHERE event_id = ? AND user_id = ?')->execute([$eventId, $userId]);
    $results[] = ['id' => $userId, 'ok' => true, 'error' => null];
}

json_response(['results' => $results]);
