<?php

declare(strict_types=1);

/**
 * Fictitious demo data for showing the application (installer option).
 *
 * All e-mail addresses use example.com (reserved for examples), so confirming
 * a demo registration can never mail a real person. Course dates are relative
 * to the moment of installing, so they are always in the future.
 *
 * Only loads into an empty database (no organisations, events or
 * registrations yet).
 *
 * @return array{trainers: string[], password: string} Demo trainer logins.
 */
function load_demo_data(PDO $pdo): array
{
    $count = (int) $pdo->query(
        'SELECT (SELECT COUNT(*) FROM organisations) + (SELECT COUNT(*) FROM events) + (SELECT COUNT(*) FROM registrations)'
    )->fetchColumn();
    if ($count > 0) {
        throw new RuntimeException('Demodata kan alleen in een lege database worden geladen.');
    }

    $pdo->beginTransaction();
    try {
        // Organisations
        $orgs = [
            ['UMCG', 'Mevr. P. Dijkstra', 'opleidingen.umcg@example.com', 'Hanzeplein 1', '9713 GZ', 'Groningen', 'Postbus 30001', '9700 RB', 'Groningen', 'facturen.umcg@example.com'],
            ['Amsterdam UMC', 'Dhr. R. van Leeuwen', 'opleidingen.amc@example.com', 'Meibergdreef 9', '1105 AZ', 'Amsterdam', 'Postbus 22660', '1100 DD', 'Amsterdam', 'crediteuren.amc@example.com'],
            ['Radboudumc', 'Mevr. T. Willems', 'academie.radboud@example.com', 'Geert Grooteplein Zuid 10', '6525 GA', 'Nijmegen', 'Postbus 9101', '6500 HB', 'Nijmegen', 'facturatie.radboud@example.com'],
            ['Isala', 'Dhr. M. Kok', 'leerhuis.isala@example.com', 'Dokter van Heesweg 2', '8025 AB', 'Zwolle', 'Postbus 10400', '8000 GK', 'Zwolle', 'facturen.isala@example.com'],
            ['Erasmus MC', 'Mevr. S. Bos', 'onderwijs.erasmus@example.com', 'Dr. Molewaterplein 40', '3015 GD', 'Rotterdam', null, null, null, null],
        ];
        $stmt = $pdo->prepare(
            'INSERT INTO organisations (name, contact_person, contact_email, address, postcode, city,
              invoice_address, invoice_postcode, invoice_city, invoice_email)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $orgIds = [];
        foreach ($orgs as $org) {
            $stmt->execute($org);
            $orgIds[] = (int) $pdo->lastInsertId();
        }

        // Course dates: Tuesdays, 3, 6, 10 and 14 weeks from now.
        $nextTuesday = new DateTimeImmutable('next tuesday');
        $eventIds = [];
        $stmt = $pdo->prepare(
            "INSERT INTO events (event_date, start_time, end_time, location, capacity, status)
             VALUES (?, '09:00:00', '17:00:00', ?, ?, 'open')"
        );
        foreach ([[3, 'Cursuscentrum Utrecht', 12], [6, 'Cursuscentrum Utrecht', 12], [10, 'Congrescentrum Zwolle', 10], [14, 'Cursuscentrum Utrecht', 12]] as [$weeks, $location, $capacity]) {
            $stmt->execute([$nextTuesday->modify("+$weeks weeks")->format('Y-m-d'), $location, $capacity]);
            $eventIds[] = (int) $pdo->lastInsertId();
        }

        // Trainers, sharing one generated password (shown once by the installer).
        $password = demo_password();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $trainers = [
            ['sanne.bakker', 'Sanne Bakker', 'sanne.bakker@example.com'],
            ['pieter.degroot', 'Pieter de Groot', 'pieter.degroot@example.com'],
            ['fatima.elamrani', 'Fatima El Amrani', 'fatima.elamrani@example.com'],
        ];
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role, name, email) VALUES (?, ?, 'trainer', ?, ?)");
        $trainerIds = [];
        foreach ($trainers as [$username, $name, $email]) {
            $stmt->execute([$username, $hash, $name, $email]);
            $trainerIds[] = (int) $pdo->lastInsertId();
        }

        // Availability per trainer per date (null = not filled in yet).
        $availability = [
            [$trainerIds[0], ['beschikbaar', 'beschikbaar', 'niet', 'misschien']],
            [$trainerIds[1], ['beschikbaar', 'misschien', 'beschikbaar', null]],
            [$trainerIds[2], ['niet', 'beschikbaar', 'beschikbaar', null]],
        ];
        $stmt = $pdo->prepare('INSERT INTO trainer_availability (user_id, event_id, status) VALUES (?, ?, ?)');
        foreach ($availability as [$trainerId, $statuses]) {
            foreach ($statuses as $i => $status) {
                if ($status !== null) {
                    $stmt->execute([$trainerId, $eventIds[$i], $status]);
                }
            }
        }
        // First date: trainers confirmed; second date: assigned but not yet confirmed (draft).
        $stmt = $pdo->prepare('INSERT INTO event_trainers (event_id, user_id, confirmed_at) VALUES (?, ?, ?)');
        $stmt->execute([$eventIds[0], $trainerIds[0], date('Y-m-d H:i:s')]);
        $stmt->execute([$eventIds[0], $trainerIds[1], date('Y-m-d H:i:s')]);
        $stmt->execute([$eventIds[1], $trainerIds[2], null]);

        // Registrations: [voornaam, voorvoegsels, achternaam, titel, geslacht, functie, specialisme,
        //                 org index (null = "anders"), preferred date index, assigned date index, status]
        $people = [
            ['Anna', null, 'Jansen', 'Dr.', 'vrouw', 'Medisch specialist', 'Cardiologie', 0, 0, 0, 'bevestigd'],
            ['Mark', 'de', 'Vries', 'Drs.', 'man', 'AIOS', 'Neurologie', 1, 0, 0, 'bevestigd'],
            ['Lotte', 'van', 'Dam', 'Dr.', 'vrouw', 'Medisch specialist', 'Chirurgie', 2, 0, 0, 'bevestigd'],
            ['Daan', null, 'Visser', 'Dr.', 'man', 'Medisch specialist', 'Anesthesiologie', 3, 0, 0, 'ingedeeld'],
            ['Noor', null, 'Hendriks', 'Drs.', 'vrouw', 'AIOS', 'Interne geneeskunde', 0, 1, 1, 'ingedeeld'],
            ['Sem', 'van der', 'Linden', 'Dr.', 'man', 'Medisch specialist', 'Orthopedie', 4, 1, 1, 'ingedeeld'],
            ['Eva', 'van den', 'Berg', 'Drs.', 'vrouw', 'ANIOS', 'Spoedeisende hulp', 1, 1, 1, 'ingedeeld'],
            ['Thomas', null, 'Mulder', 'Dr.', 'man', 'Medisch specialist', 'Urologie', 2, 1, null, 'nieuw'],
            ['Sophie', 'de', 'Wit', 'Drs.', 'vrouw', 'AIOS', 'Gynaecologie', null, 2, null, 'nieuw'],
            ['Lucas', null, 'Smit', 'Dr.', 'man', 'Medisch specialist', 'KNO', 3, 2, null, 'nieuw'],
            ['Julia', null, 'Meijer', 'Dr.', 'vrouw', 'Medisch specialist', 'Dermatologie', 4, 3, null, 'nieuw'],
            ['Ruben', null, 'Bos', 'Drs.', 'man', 'AIOS', 'Kindergeneeskunde', 0, 2, null, 'geannuleerd'],
        ];
        $stmt = $pdo->prepare(
            "INSERT INTO registrations
             (achternaam, voorvoegsels, voorletters, voornaam, titel, geslacht, geboortedatum, geboorteplaats,
              email, telefoon_werk, mobiel, adres, postcode, woonplaats,
              big_nummer, functie, specialisme, afdeling, in_opleiding,
              organisation_id, org_anders_naam, org_anders_contactpersoon, org_anders_email, org_anders_adres, org_anders_factuuradres,
              preferred_event_id, assigned_event_id, status, confirmed_at, lms_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $cities = ['Utrecht', 'Groningen', 'Amsterdam', 'Nijmegen', 'Zwolle', 'Rotterdam'];
        foreach ($people as $i => [$voornaam, $voorvoegsels, $achternaam, $titel, $geslacht, $functie, $specialisme, $org, $pref, $assigned, $status]) {
            $local = strtolower($voornaam . '.' . preg_replace('/[^a-z]/i', '', ($voorvoegsels ?? '') . $achternaam));
            $city = $cities[$i % count($cities)];
            $isAnders = $org === null;
            $stmt->execute([
                $achternaam, $voorvoegsels, strtoupper($voornaam[0]) . '.', $voornaam, $titel, $geslacht,
                sprintf('%d-%02d-%02d', 1972 + $i * 2, ($i % 12) + 1, ($i * 3 % 27) + 1), $city,
                "$local@example.com", sprintf('030-%07d', 2100000 + $i * 137), sprintf('06-%08d', 12345000 + $i * 911),
                sprintf('Lindelaan %d', 3 + $i * 7), sprintf('%04d AB', 1011 + $i * 523), $city,
                sprintf('%011d', 19012345601 + $i * 1013), $functie, $specialisme, $specialisme,
                in_array($functie, ['AIOS', 'ANIOS'], true) ? 1 : 0,
                $isAnders ? null : $orgIds[$org],
                $isAnders ? 'Maasstad Ziekenhuis' : null,
                $isAnders ? 'Dhr. J. de Boer' : null,
                $isAnders ? 'opleidingen.maasstad@example.com' : null,
                $isAnders ? 'Maasstadweg 21, 3079 DZ Rotterdam' : null,
                $isAnders ? 'Postbus 9100, 3007 AC Rotterdam' : null,
                $eventIds[$pref],
                $assigned === null ? null : $eventIds[$assigned],
                $status,
                $status === 'bevestigd' ? date('Y-m-d H:i:s') : null,
                $status === 'bevestigd' ? 'uitgeschakeld' : null,
            ]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return ['trainers' => array_column($trainers, 0), 'password' => $password];
}

/** Readable random password (no look-alike characters). */
function demo_password(): string
{
    $chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    $password = '';
    for ($i = 0; $i < 12; $i++) {
        $password .= $chars[random_int(0, strlen($chars) - 1)];
    }

    return $password;
}
