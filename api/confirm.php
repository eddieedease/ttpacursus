<?php

declare(strict_types=1);

/**
 * Confirm registrations: provision the LMS account (once the koppeling
 * exists), send the confirmation mail and mark them 'bevestigd'.
 *
 * POST { registrationIds: number[] }  — specific registrations
 * POST { eventId: number }            — everyone assigned to that date who is not yet confirmed
 *
 * Confirming an already confirmed registration re-sends the mail.
 */

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/lib/lms.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Methode niet toegestaan', 405);
}
require_admin();

$body = read_json();
if (!empty($body['eventId'])) {
    $stmt = db()->prepare("SELECT id FROM registrations WHERE assigned_event_id = ? AND status = 'ingedeeld'");
    $stmt->execute([(int) $body['eventId']]);
    $ids = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
} else {
    $ids = array_values(array_unique(array_map('intval', (array) ($body['registrationIds'] ?? []))));
}
if ($ids === []) {
    json_error('Geen aanmeldingen om te bevestigen');
}

$results = [];
foreach ($ids as $id) {
    $stmt = db()->prepare('SELECT * FROM registrations WHERE id = ?');
    $stmt->execute([$id]);
    $reg = $stmt->fetch();

    if (!$reg) {
        $results[] = ['id' => $id, 'ok' => false, 'error' => 'Aanmelding niet gevonden'];
        continue;
    }
    if ($reg['assigned_event_id'] === null || $reg['status'] === 'geannuleerd') {
        $results[] = ['id' => $id, 'ok' => false, 'error' => 'Niet ingedeeld op een cursusdatum'];
        continue;
    }

    $lms = lms_provision($reg);
    db()->prepare('UPDATE registrations SET lms_status = ?, lms_user_id = COALESCE(?, lms_user_id), lms_message = ? WHERE id = ?')
        ->execute([$lms['status'], $lms['userId'] ?? null, $lms['message'] ?? null, $id]);
    if ($lms['status'] === 'fout') {
        $results[] = ['id' => $id, 'ok' => false, 'error' => 'LMS: ' . ($lms['message'] ?? 'onbekende fout')];
        continue;
    }

    $mail = send_registration_mail('inschrijving_bevestigd', $id, [
        'lms_gegevens' => lms_credentials_text($lms['credentials'] ?? null),
    ]);
    if (!$mail['ok']) {
        $results[] = ['id' => $id, 'ok' => false, 'error' => 'Mail niet verzonden: ' . $mail['error']];
        continue;
    }

    db()->prepare("UPDATE registrations SET status = 'bevestigd', confirmed_at = NOW() WHERE id = ?")->execute([$id]);
    $results[] = ['id' => $id, 'ok' => true, 'error' => null];
}

json_response(['results' => $results]);
