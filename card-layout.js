document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     FIND EKSISTERENDE DOM (hele sektioner)
  ============================================================ */
  const felt1 = document.getElementById("felt1");     // Felt 1: dato + løbsdistance
  const felt2 = document.getElementById("felt2");     // Felt 2: VDOT / pace
  const felt3 = document.getElementById("felt3");     // Felt 3: vælg plan
  const felt4 = document.getElementById("felt4");     // Felt 4: generér + downloads
  const weekGrid = document.getElementById("weekGrid"); // output grid

  // (Valgfrit) Overskriften "Træningsoversigt" hvis du har den som <h2>
  // Vi finder den kun hvis den findes, og flytter den ind i output-card.
  const overviewHeading = Array.from(document.querySelectorAll("h2"))
    .find(h => (h.textContent || "").trim().toLowerCase() === "træningsoversigt");

  // Robusthed: tjek hvad der mangler
  const missing = [];
  if (!felt1) missing.push("felt1");
  if (!felt2) missing.push("felt2");
  if (!felt3) missing.push("felt3");
  if (!felt4) missing.push("felt4");
  if (!weekGrid) missing.push("weekGrid");

  if (missing.length) {
    console.warn("Card-layout: Nogle elementer blev ikke fundet – tjek ID’er");
    console.warn("Mangler:", missing.join(", "));
    return;
  }

  /* ============================================================
     OPRET APP CONTAINER
  ============================================================ */
  const app = document.createElement("div");
  app.className = "app-container";

  /* ============================================================
     HEADER (Løbeklar)
  ============================================================ */
  const header = document.createElement("div");
  header.className = "header-card";
  header.innerHTML = `
    <h1>Løbeklar</h1>
    <p>Din løbsdato. Dit tempo. Din plan.</p>
  `;

  /* ============================================================
     HELPER: Wrap en eksisterende sektion ind i et card
     (vi flytter selve elementet, så alt indhold + knapper følger med)
  ============================================================ */
  function wrapSectionAsCard(title, sectionEl) {
    const card = document.createElement("div");
    card.className = "card";

    if (title) {
      const h2 = document.createElement("h2");
      h2.textContent = title;
      card.appendChild(h2);
    }

    // Fjern evt. intern H2 i sektionen for at undgå dobbelt-overskrift
    // (Hvis du gerne vil beholde interne titler, så kommentér næste 4 linjer ud)
    const internalH2 = sectionEl.querySelector("h2");
    if (internalH2) internalH2.remove();

    card.appendChild(sectionEl);
    return card;
  }

  /* ============================================================
     OUTPUT CARD: Træningsoversigt + weekGrid
     (weekGrid flyttes ind her, og evt "Træningsoversigt"-h2 flyttes også)
  ============================================================ */
  const outputCard = document.createElement("div");
  outputCard.className = "card";

  const outTitle = document.createElement("h2");
  outTitle.textContent = "Træningsoversigt";
  outputCard.appendChild(outTitle);

  if (overviewHeading) {
    // fjern den gamle overskrift for at undgå duplicate
    overviewHeading.remove();
  }

  // weekGrid ligger allerede i DOM – vi flytter den ind i cardet
  outputCard.appendChild(weekGrid);

  /* ============================================================
     BUILD CARDS (FELT 1-4 + output)
  ============================================================ */
  const card1 = wrapSectionAsCard("1. Vælg konkurrencedato og distance", felt1);
  const card2 = wrapSectionAsCard("2. Beregn træningspace (VDOT)", felt2);
  const card3 = wrapSectionAsCard("3. Vælg træningsplan", felt3);
  const card4 = wrapSectionAsCard("4. Generér træningsplan", felt4);

  /* ============================================================
     SAML LAYOUT
  ============================================================ */
  app.appendChild(header);
  app.appendChild(card1);
  app.appendChild(card2);
  app.appendChild(card3);
  app.appendChild(card4);
  app.appendChild(outputCard);

  /* ============================================================
     RYD BODY OG INDSÆT NYT LAYOUT
     (OBS: Vi flytter eksisterende elementer, så event listeners bevares)
  ============================================================ */
  document.body.innerHTML = "";
  document.body.appendChild(app);
});
``
