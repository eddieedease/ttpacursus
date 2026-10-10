<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/mail.php';

require_admin();

/** API key => settings key. The SMTP password is write-only. */
const EDITABLE_SETTINGS = [
    'constructionEnabled' => 'construction_enabled',
    'constructionPassword' => 'construction_password',
    'mailTransport' => 'mail_transport',
    'smtpHost' => 'smtp_host',
    'smtpPort' => 'smtp_port',
    'smtpSecure' => 'smtp_secure',
    'smtpUser' => 'smtp_user',
    'mailFromAddress' => 'mail_from_address',
    'mailFromName' => 'mail_from_name',
    'mailBcc' => 'mail_bcc',
];

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $out = [];
        foreach (EDITABLE_SETTINGS as $key => $k) {
            $out[$key] = setting($k);
        }
        $out['constructionEnabled'] = $out['constructionEnabled'] === '1';
        $out['smtpPassSet'] = setting('smtp_pass') !== '';
        json_response($out);

    case 'PUT':
        $body = read_json();
        $values = [];
        foreach (EDITABLE_SETTINGS as $key => $k) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = $body[$key];
            if ($key === 'constructionEnabled') {
                $value = $value ? '1' : '0';
            } else {
                $value = trim((string) $value);
            }
            if ($key === 'constructionPassword' && $value === '') {
                json_error('Het wachtwoord voor de preview mag niet leeg zijn');
            }
            if ($key === 'mailTransport' && !in_array($value, ['smtp', 'mail'], true)) {
                json_error('Ongeldige verzendmethode');
            }
            if ($key === 'smtpSecure' && !in_array($value, ['ssl', 'tls', 'none'], true)) {
                json_error('Ongeldige beveiliging');
            }
            if ($key === 'mailFromAddress' && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                json_error('Ongeldig afzenderadres');
            }
            if ($key === 'mailBcc') {
                foreach (array_filter(array_map('trim', explode(',', $value))) as $address) {
                    if (!filter_var($address, FILTER_VALIDATE_EMAIL)) {
                        json_error("Ongeldig BCC-adres: $address");
                    }
                }
            }
            $values[$k] = $value;
        }
        // Switching the mode back on locks out everyone who unlocked the preview before.
        if (($values['construction_enabled'] ?? null) === '1' && setting('construction_enabled') !== '1') {
            $values['preview_nonce'] = bin2hex(random_bytes(8));
        }
        // Only overwrite the SMTP password when a new one is entered.
        if (isset($body['smtpPass']) && $body['smtpPass'] !== '') {
            $values['smtp_pass'] = (string) $body['smtpPass'];
        }
        save_settings($values);
        json_response(['updated' => true]);

    case 'POST':
        // Send a test mail with the saved mail settings.
        $to = trim((string) (read_json()['to'] ?? ''));
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            json_error('Ongeldig e-mailadres');
        }
        $result = send_mail($to, 'Testmail TTPA cursus', "Dit is een testmail.\n\nAls u dit leest, zijn de mailinstellingen in orde.");
        if (!$result['ok']) {
            json_error('Verzenden mislukt: ' . $result['error'], 502);
        }
        json_response(['sent' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
