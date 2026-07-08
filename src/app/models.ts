export type EventStatus = 'open' | 'gesloten' | 'geannuleerd';
export type RegistrationStatus = 'nieuw' | 'ingedeeld' | 'geannuleerd';

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
  preferredCount?: number;
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
