<?php

declare(strict_types=1);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/db.php';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (is_admin()) {
            $rows = db()->query(
                "SELECT o.id,
                        o.name,
                        o.contact_person AS contactPerson,
                        o.contact_email AS contactEmail,
                        o.contact_phone AS contactPhone,
                        o.address,
                        o.postcode,
                        o.city,
                        o.invoice_address AS invoiceAddress,
                        o.invoice_postcode AS invoicePostcode,
                        o.invoice_city AS invoiceCity,
                        o.invoice_email AS invoiceEmail,
                        o.invoice_reference AS invoiceReference,
                        o.notes,
                        o.is_active AS isActive,
                        (SELECT COUNT(*) FROM registrations r WHERE r.organisation_id = o.id) AS registrationCount
                 FROM organisations o
                 ORDER BY o.name"
            )->fetchAll();
            foreach ($rows as &$row) {
                $row['isActive'] = (bool) $row['isActive'];
            }
            json_response($rows);
        }

        // Public: only active organisations, name and id only (for the form dropdown).
        $rows = db()->query(
            'SELECT id, name FROM organisations WHERE is_active = 1 ORDER BY name'
        )->fetchAll();
        json_response($rows);

    case 'POST':
        require_admin();
        $body = read_json();

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            json_error('Naam is verplicht');
        }

        $stmt = db()->prepare(
            'INSERT INTO organisations
             (name, contact_person, contact_email, contact_phone, address, postcode, city,
              invoice_address, invoice_postcode, invoice_city, invoice_email, invoice_reference, notes, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $name,
            ($body['contactPerson'] ?? null) ?: null,
            ($body['contactEmail'] ?? null) ?: null,
            ($body['contactPhone'] ?? null) ?: null,
            ($body['address'] ?? null) ?: null,
            ($body['postcode'] ?? null) ?: null,
            ($body['city'] ?? null) ?: null,
            ($body['invoiceAddress'] ?? null) ?: null,
            ($body['invoicePostcode'] ?? null) ?: null,
            ($body['invoiceCity'] ?? null) ?: null,
            ($body['invoiceEmail'] ?? null) ?: null,
            ($body['invoiceReference'] ?? null) ?: null,
            ($body['notes'] ?? null) ?: null,
            isset($body['isActive']) ? (int) (bool) $body['isActive'] : 1,
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
            'name' => 'name',
            'contactPerson' => 'contact_person',
            'contactEmail' => 'contact_email',
            'contactPhone' => 'contact_phone',
            'address' => 'address',
            'postcode' => 'postcode',
            'city' => 'city',
            'invoiceAddress' => 'invoice_address',
            'invoicePostcode' => 'invoice_postcode',
            'invoiceCity' => 'invoice_city',
            'invoiceEmail' => 'invoice_email',
            'invoiceReference' => 'invoice_reference',
            'notes' => 'notes',
            'isActive' => 'is_active',
        ];
        $set = [];
        $params = [];
        foreach ($fields as $key => $column) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = $body[$key];
            if ($key === 'name') {
                $value = trim((string) $value);
                if ($value === '') {
                    json_error('Naam is verplicht');
                }
            } elseif ($key === 'isActive') {
                $value = (int) (bool) $value;
            } elseif ($value === '') {
                $value = null;
            }
            $set[] = "$column = ?";
            $params[] = $value;
        }

        if ($set === []) {
            json_error('Geen wijzigingen opgegeven');
        }

        $params[] = $id;
        $stmt = db()->prepare('UPDATE organisations SET ' . implode(', ', $set) . ' WHERE id = ?');
        $stmt->execute($params);

        json_response(['updated' => true]);

    case 'DELETE':
        require_admin();
        $id = (int) ($_GET['id'] ?? 0);
        if ($id < 1) {
            json_error('Ongeldig id');
        }

        try {
            $stmt = db()->prepare('DELETE FROM organisations WHERE id = ?');
            $stmt->execute([$id]);
        } catch (PDOException $e) {
            // FK RESTRICT: organisation still referenced by registrations.
            json_error('Organisatie is in gebruik bij aanmeldingen en kan niet worden verwijderd. Zet deze op inactief.', 409);
        }

        json_response(['deleted' => true]);

    default:
        json_error('Methode niet toegestaan', 405);
}
