<?php

declare(strict_types=1);

/**
 * LMS (Inervo) koppeling — placeholder.
 *
 * Called for every registration the admin confirms, BEFORE the confirmation
 * mail is sent, so the login details can be included in that mail via the
 * {{lms_gegevens}} placeholder.
 *
 * To implement later:
 *   - if $registration['lms_user_id'] is already set, the account exists:
 *     do not create it again (confirming can be repeated, e.g. after a date
 *     change or a failed mail) — only enrol for the (new) course date;
 *   - otherwise create the account with a generated password and enrol the
 *     participant in the course;
 *   - return the account id and the login details.
 *
 * @param array $registration Row from the registrations table (snake_case columns).
 * @return array{status: string, userId?: ?string, message?: ?string, credentials?: ?array{username: string, password: string, url?: string}}
 *         status: 'uitgeschakeld' (no LMS configured), 'aangemaakt', 'bestaand' or 'fout'
 */
function lms_provision(array $registration): array
{
    return ['status' => 'uitgeschakeld'];
}

/** Text block for the {{lms_gegevens}} placeholder. */
function lms_credentials_text(?array $credentials): string
{
    if (!$credentials) {
        return '';
    }
    $text = "Uw inloggegevens voor de leeromgeving:\n";
    if (!empty($credentials['url'])) {
        $text .= "Adres: {$credentials['url']}\n";
    }

    return $text . "Gebruikersnaam: {$credentials['username']}\nWachtwoord: {$credentials['password']}\n\n";
}
