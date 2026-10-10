export type EventStatus = 'open' | 'gesloten' | 'geannuleerd';
export type RegistrationStatus = 'nieuw' | 'ingedeeld' | 'bevestigd' | 'geannuleerd';
export type UserRole = 'admin' | 'trainer';
export type Availability = 'beschikbaar' | 'misschien' | 'niet';

export interface CourseEvent {
  id: number;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  // Public listing only
  spotsLeft?: number;
  // Admin listing only
  capacity?: number;
  status?: EventStatus;
  notes?: string | null;
  assignedCount?: number;
  confirmedCount?: number;
  preferredCount?: number;
  trainers?: EventTrainer[];
}

export interface EventTrainer {
  userId: number;
  name: string;
  availability: Availability | null;
  assigned: boolean;
  /** Assignment confirmed by the admin (trainer mailed). */
  confirmed: boolean;
}

/** A course date as seen by the logged-in trainer. */
export interface TrainerEvent {
  eventId: number;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  eventStatus: string;
  availability: Availability | null;
  assigned: boolean;
}

/** Admin overview of one trainer. */
export interface TrainerOverview {
  id: number;
  username: string;
  name: string;
  email: string | null;
  isActive: boolean;
  dates: {
    eventId: number;
    eventDate: string;
    location: string | null;
    availability: Availability | null;
    assigned: boolean;
    confirmed: boolean;
  }[];
}

export interface User {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  assignedCount: number;
}

export interface SiteSettings {
  constructionEnabled: boolean;
  constructionPassword: string;
  mailTransport: 'smtp' | 'mail';
  smtpHost: string;
  smtpPort: string;
  smtpSecure: 'ssl' | 'tls' | 'none';
  smtpUser: string;
  smtpPassSet: boolean;
  mailFromAddress: string;
  mailFromName: string;
  mailBcc: string;
}

export interface MailTemplate {
  key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  updatedAt: string;
  placeholders: MailPlaceholder[];
}

export interface MailPlaceholder {
  key: string;
  label: string;
}

export interface MailLogEntry {
  id: number;
  registrationId: number | null;
  templateKey: string | null;
  recipient: string;
  subject: string;
  status: 'verzonden' | 'mislukt';
  error: string | null;
  createdAt: string;
}

export interface ConfirmResult {
  id: number;
  ok: boolean;
  error: string | null;
}

export interface OrganisationOption {
  id: number;
  name: string;
}

export interface Organisation extends OrganisationOption {
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  invoiceAddress: string | null;
  invoicePostcode: string | null;
  invoiceCity: string | null;
  invoiceEmail: string | null;
  invoiceReference: string | null;
  notes: string | null;
  isActive: boolean;
  registrationCount: number;
}

export interface Registration {
  id: number;
  achternaam: string;
  voorvoegsels: string | null;
  voorletters: string;
  voornaam: string;
  titel: string;
  geslacht: 'man' | 'vrouw';
  geboortedatum: string;
  geboorteplaats: string;
  email: string;
  telefoonWerk: string;
  mobiel: string;
  mobielExtra: string | null;
  adres: string;
  postcode: string;
  woonplaats: string;
  bigNummer: string;
  functie: string;
  specialisme: string;
  afdeling: string;
  inOpleiding: boolean;
  werkervaring: string | null;
  organisationId: number | null;
  organisationName: string | null;
  orgAndersNaam: string | null;
  orgAndersContactpersoon: string | null;
  orgAndersEmail: string | null;
  orgAndersAdres: string | null;
  orgAndersFactuuradres: string | null;
  preferredEventId: number | null;
  preferredEventDate: string | null;
  assignedEventId: number | null;
  assignedEventDate: string | null;
  status: RegistrationStatus;
  dieetwensen: string | null;
  opmerkingen: string | null;
  confirmedAt: string | null;
  lmsStatus: string | null;
  createdAt: string;
}

export type InvoiceStatus = 'open' | 'verwerkt';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  eventId: number | null;
  organisationId: number | null;
  eventDate: string;
  orgName: string;
  orgInvoiceAddress: string | null;
  orgInvoiceEmail: string | null;
  orgInvoiceReference: string | null;
  participantCount: number;
  participants: string[];
  unitPrice: number;
  total: number;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
}

export interface RegistrationSubmission {
  achternaam: string;
  voorvoegsels: string;
  voorletters: string;
  voornaam: string;
  titel: string;
  geslacht: string;
  geboortedatum: string;
  geboorteplaats: string;
  email: string;
  telefoonWerk: string;
  mobiel: string;
  mobielExtra: string;
  adres: string;
  postcode: string;
  woonplaats: string;
  bigNummer: string;
  functie: string;
  specialisme: string;
  afdeling: string;
  inOpleiding: string;
  werkervaring: string;
  organisationId: number | null;
  orgAndersNaam: string;
  orgAndersContactpersoon: string;
  orgAndersEmail: string;
  orgAndersAdres: string;
  orgAndersFactuuradres: string;
  preferredEventId: number;
  dieetwensen: string;
  opmerkingen: string;
}
