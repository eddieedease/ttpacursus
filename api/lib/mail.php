<?php

declare(strict_types=1);

require_once __DIR__ . '/settings.php';
require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

/** Placeholders per mail template, with a description for the admin UI. */
const TRAINER_MAIL_PLACEHOLDERS = [
    'naam' => 'Naam van de trainer',
    'cursusdatum' => 'Cursusdatum',
    'tijd' => 'Tijd van de cursus',
    'locatie' => 'Locatie van de cursus',
    'collega_trainers' => 'Andere ingeplande trainers op deze datum',
    'trainer_pagina' => 'Link naar de trainerspagina',
];

const MAIL_PLACEHOLDERS = [
    'voornaam' => 'Voornaam',
    'achternaam' => 'Achternaam (incl. voorvoegsels)',
    'naam' => 'Volledige naam met titel en voorletters',
    'titel' => 'Titel',
    'email' => 'E-mailadres deelnemer',
    'organisatie' => 'Organisatie',
    'voorkeursdatum' => 'Voorkeursdatum (opgegeven op het formulier)',
    'cursusdatum' => 'Definitieve cursusdatum',
    'tijd' => 'Tijd van de cursus',
    'locatie' => 'Locatie van de cursus',
    'lms_gegevens' => 'Inloggegevens leeromgeving (leeg zolang de LMS-koppeling niet actief is)',
];

function dutch_date(?string $date): string
{
    if (!$date) {
        return '';
    }
    $days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    $months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    $ts = strtotime($date);

    return $days[(int) date('w', $ts)] . ' ' . date('j', $ts) . ' ' . $months[(int) date('n', $ts) - 1] . ' ' . date('Y', $ts);
}

function time_range(?string $start, ?string $end): string
{
    if (!$start) {
        return '';
    }

    return substr($start, 0, 5) . ($end ? ' – ' . substr($end, 0, 5) : '') . ' uur';
}

/** Placeholder values for one registration. */
function registration_mail_vars(int $registrationId, array $extra = []): array
{
    $stmt = db()->prepare(
        'SELECT r.*, o.name AS org_name,
                pe.event_date AS pref_date,
                ae.event_date AS ev_date, ae.start_time AS ev_start, ae.end_time AS ev_end, ae.location AS ev_location
         FROM registrations r
         LEFT JOIN organisations o ON o.id = r.organisation_id
         LEFT JOIN events pe ON pe.id = r.preferred_event_id
         LEFT JOIN events ae ON ae.id = r.assigned_event_id
         WHERE r.id = ?'
    );
    $stmt->execute([$registrationId]);
    $r = $stmt->fetch();
    if (!$r) {
        throw new RuntimeException('Aanmelding niet gevonden');
    }

    return array_merge([
        'voornaam' => $r['voornaam'],
        'achternaam' => trim(($r['voorvoegsels'] ?? '') . ' ' . $r['achternaam']),
        'naam' => implode(' ', array_filter([$r['titel'], $r['voorletters'], $r['voorvoegsels'], $r['achternaam']])),
        'titel' => $r['titel'],
        'email' => $r['email'],
        'organisatie' => $r['org_name'] ?? $r['org_anders_naam'] ?? '',
        'voorkeursdatum' => dutch_date($r['pref_date']),
        'cursusdatum' => dutch_date($r['ev_date']),
        'tijd' => time_range($r['ev_start'], $r['ev_end']),
        'locatie' => $r['ev_location'] ?? '',
        'lms_gegevens' => '',
    ], $extra);
}

/** Placeholder values for a trainer scheduled on a course date. */
function trainer_mail_vars(int $eventId, int $userId): array
{
    $stmt = db()->prepare('SELECT event_date, start_time, end_time, location FROM events WHERE id = ?');
    $stmt->execute([$eventId]);
    $event = $stmt->fetch();
    $stmt = db()->prepare('SELECT COALESCE(name, username) AS name, email FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$event || !$user) {
        throw new RuntimeException('Cursusdatum of trainer niet gevonden');
    }
    $stmt = db()->prepare(
        'SELECT COALESCE(u.name, u.username) FROM event_trainers et JOIN users u ON u.id = et.user_id
         WHERE et.event_id = ? AND et.user_id <> ? ORDER BY 1'
    );
    $stmt->execute([$eventId, $userId]);
    $colleagues = $stmt->fetchAll(PDO::FETCH_COLUMN);

    return [
        'email' => (string) $user['email'],
        'naam' => $user['name'],
        'cursusdatum' => dutch_date($event['event_date']),
        'tijd' => time_range($event['start_time'], $event['end_time']),
        'locatie' => $event['location'] ?? '',
        'collega_trainers' => $colleagues ? implode(', ', $colleagues) : 'geen',
        'trainer_pagina' => site_url('/trainer'),
    ];
}

/** Absolute URL on this site (the API lives in /api below the site root). */
function site_url(string $path): string
{
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/x.php')), '/');

    return ($https ? 'https' : 'http') . '://' . $host . $base . $path;
}

/** Example values, used for test mails from the admin. */
function sample_mail_vars(): array
{
    return [
        'collega_trainers' => 'Pieter de Groot',
        'trainer_pagina' => site_url('/trainer'),
        'voornaam' => 'Anna',
        'achternaam' => 'Jansen',
        'naam' => 'Dr. A. Jansen',
        'titel' => 'Dr.',
        'email' => 'a.jansen@voorbeeld.nl',
        'organisatie' => 'Voorbeeldziekenhuis',
        'voorkeursdatum' => dutch_date('2026-11-10'),
        'cursusdatum' => dutch_date('2026-11-10'),
        'tijd' => '09:00 – 17:00 uur',
        'locatie' => 'Cursuscentrum Utrecht',
        'lms_gegevens' => "Uw inloggegevens voor de leeromgeving:\nGebruikersnaam: a.jansen@voorbeeld.nl\nWachtwoord: voorbeeld123\n\n",
    ];
}

function fill_placeholders(string $text, array $vars): string
{
    return preg_replace_callback(
        '/\{\{\s*([a-z_]+)\s*\}\}/',
        fn(array $m): string => array_key_exists($m[1], $vars) ? (string) $vars[$m[1]] : $m[0],
        $text
    );
}

/** @return array{subject: string, body: string} */
function render_mail_template(string $key, array $vars): array
{
    $stmt = db()->prepare('SELECT subject, body FROM mail_templates WHERE tpl_key = ?');
    $stmt->execute([$key]);
    $tpl = $stmt->fetch();
    if (!$tpl) {
        throw new RuntimeException("Mailsjabloon '$key' bestaat niet");
    }

    return [
        'subject' => fill_placeholders($tpl['subject'], $vars),
        'body' => fill_placeholders($tpl['body'], $vars),
    ];
}

function text_to_html(string $text): string
{
    $html = nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8'));

    return '<!doctype html><html lang="nl"><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1e293b">'
        . $html . '</body></html>';
}

/**
 * Send a plain-text mail (with an HTML alternative) and log the result.
 *
 * @return array{ok: bool, error: ?string}
 */
function send_mail(string $to, string $subject, string $body, ?int $registrationId = null, ?string $tplKey = null): array
{
    $error = null;
    try {
        $fromAddress = setting('mail_from_address');
        if ($fromAddress === '') {
            throw new RuntimeException('Er is geen afzenderadres ingesteld (Beheer → Instellingen)');
        }

        $mail = new PHPMailer(true);
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Timeout = 15;

        if (setting('mail_transport') === 'smtp') {
            $mail->isSMTP();
            $mail->Host = setting('smtp_host');
            $mail->Port = (int) setting('smtp_port', '587');
            $secure = setting('smtp_secure', 'tls');
            if ($secure === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($secure === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = '';
                $mail->SMTPAutoTLS = false;
            }
            if (setting('smtp_user') !== '') {
                $mail->SMTPAuth = true;
                $mail->Username = setting('smtp_user');
                $mail->Password = setting('smtp_pass');
            }
        } else {
            $mail->isMail();
        }

        $mail->setFrom($fromAddress, setting('mail_from_name', 'TTPA cursus'));
        $mail->addAddress($to);
        foreach (array_filter(array_map('trim', explode(',', setting('mail_bcc')))) as $bcc) {
            $mail->addBCC($bcc);
        }
        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body = text_to_html($body);
        $mail->AltBody = $body;
        $mail->send();
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }

    db()->prepare(
        'INSERT INTO mail_log (registration_id, tpl_key, recipient, subject, status, error) VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$registrationId, $tplKey, $to, $subject, $error === null ? 'verzonden' : 'mislukt', $error]);

    return ['ok' => $error === null, 'error' => $error];
}

/** Render a template for a registration and send it to the participant. */
function send_registration_mail(string $tplKey, int $registrationId, array $extraVars = []): array
{
    try {
        $vars = registration_mail_vars($registrationId, $extraVars);
        $mail = render_mail_template($tplKey, $vars);
    } catch (Throwable $e) {
        return ['ok' => false, 'error' => $e->getMessage()];
    }

    return send_mail($vars['email'], $mail['subject'], $mail['body'], $registrationId, $tplKey);
}
