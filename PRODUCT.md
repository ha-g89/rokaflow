# Product

## Register

product

## Users

RokaFlow bedient drie primaire rollen binnen een multi-tenant IT-asset/medewerker-lifecycle platform:

- **MSP-beheerders** — IT-dienstverleners die meerdere klantorganisaties beheren, schakelen regelmatig tussen klant-contexten (context-switch). Vaak de hele werkdag in de tool.
- **Klant-portaaladmins** — IT/HR-contactpersoon bij een klantbedrijf die eigen medewerkers, hardware, licenties en telefonie beheert. Gebruikt de tool incidenteel, niet de hele dag.
- **Superusers** — intern platformbeheer over alle MSP's en klanten heen. Laag aantal gebruikers, hoge impact acties (abonnementen, organisaties).

Werkcontext: beheerwerk met gevoelige data (persoonsgegevens, contracten, financiële informatie), vaak tussendoor naast ander werk — geen dedicated "in de tool zitten"-sessies zoals bij creatieve tools.

## Product Purpose

Multi-tenant employee lifecycle + IT-asset management: onboarding/offboarding van medewerkers, hardware/licentie/telefonie-tracking, afdelingen/locaties, checklists en notificaties. Succes = beheerders kunnen snel en foutloos assets/medewerkers beheren zonder omwegen, met vertrouwen dat multi-tenant data correct gescheiden blijft.

## Brand Personality

Modern, premium en efficiënt. Fris en gepolijst aanvoelend — nadrukkelijk geen saaie/verouderde IT-beheertool-uitstraling (klassieke grijze ticketsystemen). Tegelijk snelheid en dichtheid: power-users moeten met weinig clicks dingen voor elkaar krijgen. Rust en vertrouwen zijn net zo belangrijk als glans — dit is een tool voor gevoelige personeels-/asset-data, geen consumer-app.

## Anti-references

- Verouderde/grijze enterprise IT-beheersoftware (ticket-systeem-esthetiek, dichte tabellen zonder ademruimte, jaren-2000 admin-paneel-look)
- Speelse/consumer-achtige interfaces — RokaFlow is zakelijk, geen playful branding
- Onnodige drukte/versiering die de workflow vertraagt

## Design Principles

- **Snelheid boven decoratie** — elke visuele keuze moet de taak sneller maken, nooit alleen mooier
- **Rust bij gevoelige data** — kalme, voorspelbare interacties rond persoons-/financiële gegevens; geen verrassingen bij destructieve acties (altijd bevestiging)
- **Premium door precisie, niet door effectbejag** — polish zit in details (hover-states, spacing, dark-mode consistentie), niet in zware visuele elementen
- **Multi-tenant duidelijkheid** — UI moet altijd ondubbelzinnig maken in welke tenant-context (eigen bedrijf / welke klant / superuser) de gebruiker zich bevindt
- **Eén consistente taal over alle rollen** — MSP-portaal, klant-portaal en superuser-beheer delen dezelfde componenten en patronen, geen drie losse ontwerptalen

## Accessibility & Inclusion

Geen formeel WCAG-niveau vereist. Goede praktijk aanhouden: voldoende contrast, zichtbare focus-states, geen puur-kleur-afhankelijke informatie (status altijd ook via label/icoon, niet alleen kleur).
