🏃‍♂️ Training-Plan-Expert

Et simpelt, gratis og letvægtigt webværktøj til at generere personlige træningsplaner frem mod en konkurrence.
Brugeren vælger en predefineret træningsplan ud fra ønsket konkurrencemål, samt en konkurrencedato, hvorefter værktøjet automatisk beregner alle træningsdatoer baglæns. Den færdige plan kan vises på skærmen, udskrives eller eksporteres til kalender og regneark.
Projektet er designet til at være:

- begyndervenligt
- 100 % statisk (ingen server eller database)
- gratis at hoste via GitHub Pages
- nemt at udvide med flere træningsplaner og funktioner

Layoutet er inspireret af Time to Run:
https://www.codyhoover.com/time-to-run/

🌐 Live hjemmeside
Hjemmesiden kører på GitHub Pages og kan tilgås her:
👉 https://allangraver.github.io/Training-Plan-Expert/

✨ Funktioner

Valg af konkurrencedato
Valg af konkurrencedistance
Valg af træningspace
Valg af træningsplan

Automatisk beregning af træningsdatoer
Oversigt over hele træningsplanen
Print‑venlig visning og mobilvenligt layout

🧠 Træningsplan‑format
Alle træningsplaner ligger som JSON‑filer i mappen plans/.
Hver plan beskriver:

- planens navn
- antal uger
- hvilke uger og ugedage der trænes

Eksempel (forkortet):
JavaScript{  "name": "5 km – Begynder",  "duration_weeks": 8,  "sessions": [    { "week": 1, "day": 2, "title": "Rolig løb", "note": "3 km" }  ]}Vis flere linjer
Datoerne beregnes automatisk ud fra den valgte konkurrencedato.

🚀 Sådan bruges projektet

1. Åbn hjemmesiden
2. Vælg træningsplan
3. Vælg konkurrencedato
4. Generér planen
5. Eksportér til kalender, CSV eller print

Ingen login, ingen konto og ingen eksterne tjenester er nødvendige.

🔧 Videreudvikling (idéer)

Projektet er bevidst holdt simpelt, men kan let udvides med:

- flere træningsplaner i dropdown => DONE!
- ugevis visning => DONE!
- bedre visning på mobil => DONE!
- pace‑ og tidsberegninger => DONE!
- Print-venlig visning => DONE!
- Eksport til CSV (Excel / Sheets)
- Eksport til iCal (.ics) (Outlook og IOS)
- delingslink til planen
- valg af faste træningsdage
- synk til Holdsport
- visuelle forbedringer

📄 Licens
Fri anvendelse og tilpasning til privat og ikke‑kommercielt brug.
