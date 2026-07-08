-- Development seed data. Do NOT import on the shared host.

-- Dev admin: username 'admin', password 'ttpa2025'
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2y$10$OL5231/3ZVxjDkdY82VR1OX43VuheJUIB/kgOs4vb5hUmMbhNfKxe');

INSERT INTO organisations (name, contact_person, contact_email, address, postcode, city, invoice_address, invoice_postcode, invoice_city, invoice_email) VALUES
('UMCG', 'Mevr. P. Dijkstra', 'inkoop@umcg.nl', 'Hanzeplein 1', '9713 GZ', 'Groningen', 'Postbus 30001', '9700 RB', 'Groningen', 'facturen@umcg.nl'),
('Amsterdam UMC', 'Dhr. R. van Leeuwen', 'opleidingen@amsterdamumc.nl', 'Meibergdreef 9', '1105 AZ', 'Amsterdam', 'Postbus 22660', '1100 DD', 'Amsterdam', 'crediteuren@amsterdamumc.nl'),
('Radboudumc', 'Mevr. T. Willems', 'academie@radboudumc.nl', 'Geert Grooteplein Zuid 10', '6525 GA', 'Nijmegen', 'Postbus 9101', '6500 HB', 'Nijmegen', 'facturatie@radboudumc.nl');

INSERT INTO events (event_date, start_time, end_time, location, capacity, status) VALUES
('2026-09-15', '09:00:00', '17:00:00', 'Cursuscentrum Utrecht', 12, 'open'),
('2026-10-13', '09:00:00', '17:00:00', 'Cursuscentrum Utrecht', 12, 'open'),
('2026-11-10', '09:00:00', '17:00:00', 'Cursuscentrum Utrecht', 12, 'open');

INSERT INTO registrations
(achternaam, voorvoegsels, voorletters, voornaam, titel, geslacht, geboortedatum, geboorteplaats,
 email, telefoon_werk, mobiel, adres, postcode, woonplaats,
 big_nummer, functie, specialisme, afdeling, in_opleiding,
 organisation_id, preferred_event_id, status)
VALUES
('Jansen', NULL, 'A.', 'Anna', 'Dr.', 'vrouw', '1985-03-12', 'Groningen',
 'a.jansen@umcg.nl', '050-1234567', '06-12345678', 'Kerkstraat 12', '9711 AB', 'Groningen',
 '19048291', 'Cardioloog', 'Cardiologie', 'Cardiologie', 0,
 1, 1, 'nieuw'),
('Vries', 'de', 'M.', 'Mark', 'Drs.', 'man', '1990-07-24', 'Utrecht',
 'm.devries@amsterdamumc.nl', '020-7654321', '06-87654321', 'Lindenlaan 8', '1012 CD', 'Amsterdam',
 '38201947', 'AIOS', 'Neurologie', 'Neurologie', 1,
 2, 2, 'nieuw');
