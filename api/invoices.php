<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

const INVOICE_STATUSES = ['open', 'verwerkt'];

require_admin();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $rows = db()->query(
            "SELECT i.id,
                    i.invoice_number AS invoiceNumber,
                    i.event_id AS eventId,
                    i.organisation_id AS organisationId,
                    i.event_date AS eventDate,
                    i.org_name AS orgName,
                    i.org_invoice_address AS orgInvoiceAddress,
                    i.org_invoice_email AS orgInvoiceEmail,
                    i.org_invoice_reference AS orgInvoiceReference,
                    i.participant_count AS participantCount,
                    i.participants,
                    i.unit_price AS unitPrice,
                    i.total,
                    i.status,
                    i.notes,
                    i.created_at AS createdAt
             FROM invoices i
             ORDER BY i.created_at DESC"
        )->fetchAll();
        foreach ($rows as &$row) {
            $row['participants'] = json_decode((string) $row['participants'], true) ?: [];
            $row['unitPrice'] = (float) $row['unitPrice'];
            $row['total'] = (float) $row['total'];
        }
        json_response($rows);

    case 'POST':
        $body = read_json();

        $eventId = (int) ($body['eventId'] ?? 0);
        $organisationId = (int) ($body['organisationId'] ?? 0);
        $unitPrice = (float) ($body['unitPrice'] ?? 0);
        if ($eventId < 1 || $organisationId < 1) {
            json_error('Kies een cursusdatum en organisatie');
        }
        if ($unitPrice <= 0) {
            json_error('Vul een geldige prijs per deelnemer in');
        }

        $stmt = db()->prepare('SELECT event_date FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();
        if (!$event) {
            json_error('Cursusdatum bestaat niet');
        }

        $stmt = db()->prepare(
            'SELECT name, invoice_address, invoice_postcode, invoice_city, invoice_email, invoice_reference
             FROM organisations WHERE id = ?'
        );
        $stmt->execute([$organisationId]);
        $org = $stmt->fetch();
        if (!$org) {
            json_error('Organisatie bestaat niet');
        }

        // Billable participants: assigned to this date, linked to this organisation.
        $stmt = db()->prepare(
            "SELECT titel, voorletters, voorvoegsels, achternaam
             FROM registrations
             WHERE assigned_event_id = ? AND organisation_id = ? AND status IN ('ingedeeld', 'bevestigd')
             ORDER BY achternaam"
        );
        $stmt->execute([$eventId, $organisationId]);
        $participants = array_map(
            fn(array $r): string => implode(' ', array_filter([$r['titel'], $r['voorletters'], $r['voorvoegsels'], $r['achternaam']])),
            $stmt->fetchAll()
        );
        if ($participants === []) {
            json_error('Geen ingedeelde deelnemers van deze organisatie op deze datum');
        }

        $count = count($participants);
        $addressParts = array_filter([
            $org['invoice_address'],
            trim(($org['invoice_postcode'] ?? '') . ' ' . ($org['invoice_city'] ?? '')),
        ]);

        $pdo = db();
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'INSERT INTO invoices
             (invoice_number, event_id, organisation_id, event_date, org_name,
              org_invoice_address, org_invoice_email, org_invoice_reference,
              participant_count, participants, unit_price, total, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            'CONCEPT', // replaced below once the id is known
            $eventId,
            $organisationId,
            $event['event_date'],
            $org['name'],
            $addressParts !== [] ? implode("\n", $addressParts) : null,
            $org['invoice_email'] ?: null,
            $org['invoice_reference'] ?: null,
            $count,
            json_encode($participants, JSON_UNESCAPED_UNICODE),
            $unitPrice,
            round($count * $unitPrice, 2),
            ($body['notes'] ?? null) ?: null,
        ]);
        $id = (int) $pdo->lastInsertId();
        $number = sprintf('TTPA-%s-%04d', date('Y'), $id);
        $stmt = $pdo->prepare('UPDATE invoices SET invoice_number = ? WHERE id = ?');
        $stmt->execute([$number, $id]);
        $pdo->commit();

        json_response(['id' => $id, 'invoiceNumber' => $number], 201);

    case 'PUT':
        $body = read_json();

        $id = (int) ($body['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        $set = [];
        $params = [];
        if (array_key_exists('status', $body)) {
            if (!in_array($body['status'], INVOICE_STATUSES, true)) {
                json_error('Ongeldige status');
            }
            $set[] = 'status = ?';
            $params[] = $body['status'];
        }
        if (array_key_exists('notes', $body)) {
            $set[] = 'notes = ?';
            $params[] = ($body['notes'] ?? null) ?: null;
        }

        if ($set === []) {
            json_error('Geen wijzigingen opgegeven');
        }

        $params[] = $id;
        $stmt = db()->prepare('UPDATE invoices SET ' . implode(', ', $set) . ' WHERE id = ?');
        $stmt->execute($params);

        json_response(['updated' => true]);

    case 'DELETE':
        $id = (int) ($_GET['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        $stmt = db()->prepare('DELETE FROM invoices WHERE id = ?');
        $stmt->execute([$id]);

        json_response(['deleted' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
