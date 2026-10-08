<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';
require __DIR__ . '/lib/site.php';
require __DIR__ . '/lib/mail.php';

const REGISTRATION_STATUSES = ['nieuw', 'ingedeeld', 'bevestigd', 'geannuleerd'];

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        require_admin();

        $where = [];
        $params = [];
        if (!empty($_GET['status']) && in_array($_GET['status'], REGISTRATION_STATUSES, true)) {
            $where[] = 'r.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['event_id'])) {
            $where[] = 'r.assigned_event_id = ?';
            $params[] = (int) $_GET['event_id'];
        }

        $sql = "SELECT r.id,
                       r.achternaam, r.voorvoegsels, r.voorletters, r.voornaam, r.titel,
                       r.geslacht, r.geboortedatum, r.geboorteplaats,
                       r.email, r.telefoon_werk AS telefoonWerk, r.mobiel, r.mobiel_extra AS mobielExtra,
                       r.adres, r.postcode, r.woonplaats,
                       r.big_nummer AS bigNummer, r.functie, r.specialisme, r.afdeling,
                       r.in_opleiding AS inOpleiding, r.werkervaring,
                       r.organisation_id AS organisationId,
                       o.name AS organisationName,
                       r.org_anders_naam AS orgAndersNaam,
                       r.org_anders_contactpersoon AS orgAndersContactpersoon,
                       r.org_anders_email AS orgAndersEmail,
                       r.org_anders_adres AS orgAndersAdres,
                       r.org_anders_factuuradres AS orgAndersFactuuradres,
                       r.preferred_event_id AS preferredEventId,
                       pe.event_date AS preferredEventDate,
                       r.assigned_event_id AS assignedEventId,
                       ae.event_date AS assignedEventDate,
                       r.status, r.dieetwensen, r.opmerkingen,
                       r.confirmed_at AS confirmedAt, r.lms_status AS lmsStatus,
                       r.created_at AS createdAt
                FROM registrations r
                LEFT JOIN organisations o ON o.id = r.organisation_id
                LEFT JOIN events pe ON pe.id = r.preferred_event_id
                LEFT JOIN events ae ON ae.id = r.assigned_event_id";
        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY r.created_at DESC';

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['inOpleiding'] = (bool) $row['inOpleiding'];
        }

        json_response($rows);

    case 'POST':
        // Public: submit the registration form.
        require_site_unlocked();
        $body = read_json();

        $required = [
            'achternaam', 'voorletters', 'voornaam', 'titel', 'geslacht',
            'geboortedatum', 'geboorteplaats', 'email', 'telefoonWerk', 'mobiel',
            'adres', 'postcode', 'woonplaats',
            'bigNummer', 'functie', 'specialisme', 'afdeling', 'inOpleiding',
        ];
        foreach ($required as $field) {
            if (trim((string) ($body[$field] ?? '')) === '') {
                json_error("Veld '$field' is verplicht");
            }
        }
        if (!filter_var((string) $body['email'], FILTER_VALIDATE_EMAIL)) {
            json_error('Ongeldig e-mailadres');
        }
        if (!in_array($body['geslacht'], ['man', 'vrouw'], true)) {
            json_error('Ongeldig geslacht');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $body['geboortedatum'])) {
            json_error('Ongeldige geboortedatum');
        }

        // Preferred course date must be an open, upcoming event.
        $preferredEventId = (int) ($body['preferredEventId'] ?? 0);
        if ($preferredEventId < 1) {
            json_error('Kies een cursusdatum');
        }
        $stmt = db()->prepare("SELECT id FROM events WHERE id = ? AND status = 'open' AND event_date >= CURDATE()");
        $stmt->execute([$preferredEventId]);
        if (!$stmt->fetch()) {
            json_error('De gekozen cursusdatum is niet (meer) beschikbaar');
        }

        // Organisation: either a known one, or free-text via "anders".
        $organisationId = isset($body['organisationId']) && $body['organisationId'] !== null && $body['organisationId'] !== ''
            ? (int) $body['organisationId']
            : null;
        $orgAndersNaam = trim((string) ($body['orgAndersNaam'] ?? ''));

        if ($organisationId !== null) {
            $stmt = db()->prepare('SELECT id FROM organisations WHERE id = ? AND is_active = 1');
            $stmt->execute([$organisationId]);
            if (!$stmt->fetch()) {
                json_error('Ongeldige organisatie');
            }
            $orgAndersNaam = '';
        } elseif ($orgAndersNaam === '') {
            json_error('Kies een organisatie of vul de organisatiegegevens in');
        }

        $stmt = db()->prepare(
            'INSERT INTO registrations
             (achternaam, voorvoegsels, voorletters, voornaam, titel, geslacht, geboortedatum, geboorteplaats,
              email, telefoon_werk, mobiel, mobiel_extra,
              adres, postcode, woonplaats,
              big_nummer, functie, specialisme, afdeling, in_opleiding, werkervaring,
              organisation_id, org_anders_naam, org_anders_contactpersoon, org_anders_email, org_anders_adres, org_anders_factuuradres,
              preferred_event_id, dieetwensen, opmerkingen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            trim((string) $body['achternaam']),
            trim((string) ($body['voorvoegsels'] ?? '')) ?: null,
            trim((string) $body['voorletters']),
            trim((string) $body['voornaam']),
            trim((string) $body['titel']),
            $body['geslacht'],
            $body['geboortedatum'],
            trim((string) $body['geboorteplaats']),
            trim((string) $body['email']),
            trim((string) $body['telefoonWerk']),
            trim((string) $body['mobiel']),
            trim((string) ($body['mobielExtra'] ?? '')) ?: null,
            trim((string) $body['adres']),
            trim((string) $body['postcode']),
            trim((string) $body['woonplaats']),
            trim((string) $body['bigNummer']),
            trim((string) $body['functie']),
            trim((string) $body['specialisme']),
            trim((string) $body['afdeling']),
            $body['inOpleiding'] === 'ja' || $body['inOpleiding'] === true ? 1 : 0,
            trim((string) ($body['werkervaring'] ?? '')) ?: null,
            $organisationId,
            $orgAndersNaam ?: null,
            trim((string) ($body['orgAndersContactpersoon'] ?? '')) ?: null,
            trim((string) ($body['orgAndersEmail'] ?? '')) ?: null,
            trim((string) ($body['orgAndersAdres'] ?? '')) ?: null,
            trim((string) ($body['orgAndersFactuuradres'] ?? '')) ?: null,
            $preferredEventId,
            trim((string) ($body['dieetwensen'] ?? '')) ?: null,
            trim((string) ($body['opmerkingen'] ?? '')) ?: null,
        ]);

        $id = (int) db()->lastInsertId();

        // Confirmation of receipt. A mail failure must not fail the
        // registration itself; it is visible in the mail log.
        send_registration_mail('aanmelding_ontvangen', $id);

        json_response(['id' => $id], 201);

    case 'PUT':
        // Admin actions: assign to a date, switch organisation, change status.
        require_admin();
        $body = read_json();

        $id = (int) ($body['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        $set = [];
        $params = [];

        if (array_key_exists('assignedEventId', $body)) {
            $eventId = $body['assignedEventId'] !== null && $body['assignedEventId'] !== '' ? (int) $body['assignedEventId'] : null;
            if ($eventId !== null) {
                $stmt = db()->prepare('SELECT id FROM events WHERE id = ?');
                $stmt->execute([$eventId]);
                if (!$stmt->fetch()) {
                    json_error('Cursusdatum bestaat niet');
                }
            }
            $set[] = 'assigned_event_id = ?';
            $params[] = $eventId;
            // Assignment drives the status, unless the caller sets one explicitly.
            // Moving a confirmed registration makes it 'ingedeeld' again: it
            // needs a new confirmation for the new date.
            if (!array_key_exists('status', $body)) {
                $set[] = 'status = ?';
                $params[] = $eventId !== null ? 'ingedeeld' : 'nieuw';
            }
        }

        if (array_key_exists('organisationId', $body)) {
            $orgId = $body['organisationId'] !== null && $body['organisationId'] !== '' ? (int) $body['organisationId'] : null;
            if ($orgId !== null) {
                $stmt = db()->prepare('SELECT id FROM organisations WHERE id = ?');
                $stmt->execute([$orgId]);
                if (!$stmt->fetch()) {
                    json_error('Organisatie bestaat niet');
                }
            }
            $set[] = 'organisation_id = ?';
            $params[] = $orgId;
        }

        if (array_key_exists('status', $body)) {
            if (!in_array($body['status'], REGISTRATION_STATUSES, true)) {
                json_error('Ongeldige status');
            }
            $set[] = 'status = ?';
            $params[] = $body['status'];
        }

        // Editable form fields. Keys not present in the body stay untouched.
        $requiredFields = [
            'achternaam' => 'achternaam',
            'voorletters' => 'voorletters',
            'voornaam' => 'voornaam',
            'titel' => 'titel',
            'geboorteplaats' => 'geboorteplaats',
            'telefoonWerk' => 'telefoon_werk',
            'mobiel' => 'mobiel',
            'adres' => 'adres',
            'postcode' => 'postcode',
            'woonplaats' => 'woonplaats',
            'bigNummer' => 'big_nummer',
            'functie' => 'functie',
            'specialisme' => 'specialisme',
            'afdeling' => 'afdeling',
        ];
        foreach ($requiredFields as $key => $column) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = trim((string) $body[$key]);
            if ($value === '') {
                json_error("Veld '$key' mag niet leeg zijn");
            }
            $set[] = "$column = ?";
            $params[] = $value;
        }

        $optionalFields = [
            'voorvoegsels' => 'voorvoegsels',
            'mobielExtra' => 'mobiel_extra',
            'werkervaring' => 'werkervaring',
            'orgAndersNaam' => 'org_anders_naam',
            'orgAndersContactpersoon' => 'org_anders_contactpersoon',
            'orgAndersEmail' => 'org_anders_email',
            'orgAndersAdres' => 'org_anders_adres',
            'orgAndersFactuuradres' => 'org_anders_factuuradres',
            'dieetwensen' => 'dieetwensen',
            'opmerkingen' => 'opmerkingen',
        ];
        foreach ($optionalFields as $key => $column) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $set[] = "$column = ?";
            $params[] = trim((string) $body[$key]) ?: null;
        }

        if (array_key_exists('email', $body)) {
            if (!filter_var((string) $body['email'], FILTER_VALIDATE_EMAIL)) {
                json_error('Ongeldig e-mailadres');
            }
            $set[] = 'email = ?';
            $params[] = trim((string) $body['email']);
        }
        if (array_key_exists('geslacht', $body)) {
            if (!in_array($body['geslacht'], ['man', 'vrouw'], true)) {
                json_error('Ongeldig geslacht');
            }
            $set[] = 'geslacht = ?';
            $params[] = $body['geslacht'];
        }
        if (array_key_exists('geboortedatum', $body)) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $body['geboortedatum'])) {
                json_error('Ongeldige geboortedatum');
            }
            $set[] = 'geboortedatum = ?';
            $params[] = $body['geboortedatum'];
        }
        if (array_key_exists('inOpleiding', $body)) {
            $set[] = 'in_opleiding = ?';
            $params[] = $body['inOpleiding'] === 'ja' || $body['inOpleiding'] === true ? 1 : 0;
        }

        if ($set === []) {
            json_error('Geen wijzigingen opgegeven');
        }

        $params[] = $id;
        $stmt = db()->prepare('UPDATE registrations SET ' . implode(', ', $set) . ' WHERE id = ?');
        $stmt->execute($params);

        json_response(['updated' => true]);

    case 'DELETE':
        require_admin();
        $id = (int) ($_GET['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        $stmt = db()->prepare('DELETE FROM registrations WHERE id = ?');
        $stmt->execute([$id]);

        json_response(['deleted' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
