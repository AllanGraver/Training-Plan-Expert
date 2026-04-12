document.addEventListener("DOMContentLoaded", () => {
  /* ===== Find eksisterende DOM ===== */
  const planSelect = document.getElementById("planSelect");
  const raceDate = document.getElementById("raceDate");
  const generateBtn = document.querySelector("button[onclick='generatePlan()']");
  const weekGrid = document.getElementById("weekGrid");

  if (!planSelect || !raceDate || !generateBtn || !weekGrid) {
    console.warn("Card-layout: Nogle elementer blev ikke fundet – tjek ID’er");
    return;
  }

  /* ===== Opret app container ===== */
  const app = document.createElement("div");
  app.className = "app-container";

  /* ===== Header ===== */
  const header = document.createElement("div");
  header.className = "header-card";
  header.innerHTML = `
    <h1>HLM Training Plan Selector</h1>
    <p>Byg din træningsplan frem mod dit løb</p>
  `;

  /* ===== Helper til cards ===== */
  function createCard(title, elements) {
    const card = document.createElement("div");
    card.className = "card";

    if (title) {
      const h2 = document.createElement("h2");
      h2.textContent = title;
      card.appendChild(h2);
    }

    elements.forEach(el => card.appendChild(el));
    return card;
  }

  /* ===== Cards ===== */
  const raceCard = createCard("1. Vælg konkurrencedato", [raceDate]);
  const planCard = createCard("2. Vælg træningsplan", [planSelect]);
  const generateCard = createCard("3. Generér plan", [generateBtn]);
  const outputCard = createCard("Træningsoversigt", [weekGrid]);

  /* ===== Saml layout ===== */
  app.appendChild(header);
  app.appendChild(raceCard);
  app.appendChild(planCard);
  app.appendChild(generateCard);
  app.appendChild(outputCard);

  /* ===== Ryd body og indsæt nyt layout ===== */
  document.body.innerHTML = "";
  document.body.appendChild(app);
});
