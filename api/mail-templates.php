<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/mail.php';

require_admin();

const TEMPLATE_INFO = [
    'aanmelding_ontvangen' => [
        'name' => 'Aanmelding ontvangen',
        'description' => 'Wordt automatisch verstuurd naar de deelnemer zodra het aanmeldformulier is ingestuurd.',
    ],
    'inschrijving_bevestigd' => [
        'name' => 'Inschrijving bevestigd',
        'description' => 'Wordt verstuurd wanneer de beheerder een aanmelding bevestigt (knop "Bevestigen & mailen").',
    ],
    'trainer_ingepland' => [
        'name' => 'Trainer ingepland',
        'description' => 'Wordt naar de trainer verstuurd wanneer de beheerder de ingeplande trainers van een cursusdatum bevestigt.',
    ],
];

function placeholder_list(array $placeholders): array
{
    $out = [];
    foreach ($placeholders as $key => $label) {
        $out[] = ['key' => $key, 'label' => $label];
    }

    return $out;
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $rows = db()->query('SELECT tpl_key AS `key`, subject, body, updated_at AS updatedAt FROM mail_templates ORDER BY FIELD(tpl_key, \'aanmelding_ontvangen\', \'inschrijving_bevestigd\', \'trainer_ingepland\')')->fetchAll();
        $templates = [];
        foreach ($rows as $row) {
            $templates[] = array_merge(
                $row,
                TEMPLATE_INFO[$row['key']] ?? ['name' => $row['key'], 'description' => ''],
                ['placeholders' => placeholder_list($row['key'] === 'trainer_ingepland' ? TRAINER_MAIL_PLACEHOLDERS : MAIL_PLACEHOLDERS)]
            );
        }
        json_response(['templates' => $templates]);

    case 'PUT':
        $body = read_json();
        $key = (string) ($body['key'] ?? '');
        $subject = trim((string) ($body['subject'] ?? ''));
        $text = trim((string) ($body['body'] ?? ''));
        if ($subject === '' || $text === '') {
            json_error('Onderwerp en tekst zijn verplicht');
        }
        $stmt = db()->prepare('UPDATE mail_templates SET subject = ?, body = ? WHERE tpl_key = ?');
        $stmt->execute([$subject, $text, $key]);
        json_response(['updated' => true]);

    case 'POST':
        // Test: render the saved template with example data and send it.
        $body = read_json();
        $to = trim((string) ($body['to'] ?? ''));
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            json_error('Ongeldig e-mailadres');
        }
        try {
            $mail = render_mail_template((string) ($body['key'] ?? ''), sample_mail_vars());
        } catch (Throwable $e) {
            json_error($e->getMessage());
        }
        $result = send_mail($to, '[TEST] ' . $mail['subject'], $mail['body'], null, (string) $body['key']);
        if (!$result['ok']) {
            json_error('Verzenden mislukt: ' . $result['error'], 502);
        }
        json_response(['sent' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
