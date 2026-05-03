I want to create a site called TTPA cursus. The site is a dutch site where medical experts can sign a form to follow a course.

## Tech used
- angular (latest) scaffolded a new project via the cli. We want to use best practices for angular development. So zoneless. For now we just have an empy scaffold project
- tailwinc for the styling
- Specifcally only for frontend. For backend we use;
- php (latest) with latest slimphp. Mysql and phpmyadmin. The goal is to upload a build to a shared hosting via sftp 
We will create a Docker file for this (backend development) but do this in a later stage. We only use docker for backend development. Frontend wil be run locally via angular cli and nvm


First step:
- Today we focus on the angular front end.
- We will need to set up 3 component pages: a) landing b) fillform c) admin page
- password mockup for admin route is /admin -> ttpa2025


##### Fields on the form:
Achternaam*
Voorvoegsels
Voorletters*
Voornaam*
Man
Vrouw
Geboortedatum*
Geboorteplaats*
E-mailadres*
Telefoonnummer werk*
Mobiele telefoonnummer
BIG Nummer*
Naam organisatie*
Contactpersoon organisatie*
E-mail contactpersoon organisatie*
Adres organisatie*
Factuuradres organisatie*
Functie*
Dieetwensen
Specialisme*
Afdeling*
In Opleiding*
Nee
Ja

Relevante werkervaring na afronden studie

Titel*
Benodigd voor eenmalig toesturen cursusmateriaal
Adres (prive)*
Postcode*
Woonplaats*
Telefoon
Mobiel*
E-mailadres*
Opmerkingen