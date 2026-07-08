-- TTPA cursus database schema.
-- Runs automatically on first start of the MySQL container.
-- For the shared host: import this file once via phpMyAdmin.

USE ttpacursus;

CREATE TABLE IF NOT EXISTS organisations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(50) NULL,
  address VARCHAR(255) NULL,
  postcode VARCHAR(20) NULL,
  city VARCHAR(120) NULL,
  invoice_address VARCHAR(255) NULL,
  invoice_postcode VARCHAR(20) NULL,
  invoice_city VARCHAR(120) NULL,
  invoice_email VARCHAR(255) NULL,
  invoice_reference VARCHAR(120) NULL,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  location VARCHAR(255) NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 12,
  status ENUM('open','gesloten','geannuleerd') NOT NULL DEFAULT 'open',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- Persoonlijke gegevens
  achternaam VARCHAR(120) NOT NULL,
  voorvoegsels VARCHAR(40) NULL,
  voorletters VARCHAR(20) NOT NULL,
  voornaam VARCHAR(120) NOT NULL,
  titel VARCHAR(60) NOT NULL,
  geslacht ENUM('man','vrouw') NOT NULL,
  geboortedatum DATE NOT NULL,
  geboorteplaats VARCHAR(120) NOT NULL,
  -- Contactgegevens
  email VARCHAR(255) NOT NULL,
  telefoon_werk VARCHAR(50) NOT NULL,
  mobiel VARCHAR(50) NOT NULL,
  mobiel_extra VARCHAR(50) NULL,
  -- Privéadres
  adres VARCHAR(255) NOT NULL,
  postcode VARCHAR(20) NOT NULL,
  woonplaats VARCHAR(120) NOT NULL,
  -- Professionele gegevens
  big_nummer VARCHAR(20) NOT NULL,
  functie VARCHAR(120) NOT NULL,
  specialisme VARCHAR(120) NOT NULL,
  afdeling VARCHAR(120) NOT NULL,
  in_opleiding TINYINT(1) NOT NULL DEFAULT 0,
  werkervaring TEXT NULL,
  -- Organisatie: koppeling naar bekende organisatie, of vrije invoer bij "anders"
  organisation_id INT UNSIGNED NULL,
  org_anders_naam VARCHAR(255) NULL,
  org_anders_contactpersoon VARCHAR(255) NULL,
  org_anders_email VARCHAR(255) NULL,
  org_anders_adres VARCHAR(255) NULL,
  org_anders_factuuradres VARCHAR(255) NULL,
  -- Cursusdatum: voorkeur van de deelnemer, definitieve indeling door admin
  preferred_event_id INT UNSIGNED NULL,
  assigned_event_id INT UNSIGNED NULL,
  status ENUM('nieuw','ingedeeld','geannuleerd') NOT NULL DEFAULT 'nieuw',
  -- Overig
  dieetwensen VARCHAR(255) NULL,
  opmerkingen TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reg_organisation FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reg_preferred_event FOREIGN KEY (preferred_event_id) REFERENCES events (id) ON DELETE SET NULL,
  CONSTRAINT fk_reg_assigned_event FOREIGN KEY (assigned_event_id) REFERENCES events (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_reg_status ON registrations (status);
CREATE INDEX idx_reg_assigned ON registrations (assigned_event_id);
CREATE INDEX idx_events_date ON events (event_date);
