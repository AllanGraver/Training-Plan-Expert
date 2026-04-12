function enableAccordionWeeks() {
  const table = document.querySelector(".week-table");
  if (!table) return;

  const isMobile = window.innerWidth <= 700;

  // Desktop: vis tabel, fjern accordion
  if (!isMobile) {
    table.style.display = "";
    document.querySelectorAll(".accordion-container").forEach(el => el.remove());
    return;
  }

  // Mobil: skjul tabel
  table.style.display = "none";

  // Undgå at lave accordion flere gange
  if (document.querySelector(".accordion-container")) return;

  const accordion = document.createElement("div");
  accordion.className = "accordion-container";

  const rows = table.querySelectorAll("tbody tr");

  rows.forEach((row, index) => {
    const headerCell = row.querySelector(".week-col");
    const cells = row.querySelectorAll("td:not(.week-col):not(.km-col)");
    const kmCell = row.querySelector(".km-col");

    if (!headerCell) return;

    const item = document.createElement("div");
    item.className = "accordion-item";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "accordion-header";
    header.innerHTML = `
      <span>${headerCell.innerHTML}</span>
      <span class="accordion-toggle">+</span>
    `;

    const body = document.createElement("div");
    body.className = "accordion-body";

    cells.forEach((cell, i) => {
      if (cell.textContent.trim() === "–") return;

      const dayName = ["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"][i];

      const day = document.createElement("div");
      day.className = "accordion-day";
      day.innerHTML = `<strong>${dayName}</strong><br>${cell.innerHTML}`;
      body.appendChild(day);
    });

    if (kmCell) {
      const summary = document.createElement("div");
      summary.className = "accordion-summary";
      summary.innerHTML = `Ugentlig / total: <strong>${kmCell.textContent}</strong>`;
      body.appendChild(summary);
    }

    // ✅ CLICK HANDLER – KLASSER (ROBUST)
    header.addEventListener("click", () => {
      const open = item.classList.contains("open");

      document.querySelectorAll(".accordion-item").forEach(i => {
        i.classList.remove("open");
        i.querySelector(".accordion-toggle").textContent = "+";
      });

      if (!open) {
        item.classList.add("open");
        header.querySelector(".accordion-toggle").textContent = "−";
      }
    });

    // Åbn sidste uge som default
    if (index === rows.length - 1) {
      item.classList.add("open");
      header.querySelector(".accordion-toggle").textContent = "−";
    }

    item.appendChild(header);
    item.appendChild(body);
    accordion.appendChild(item);
  });

  table.parentNode.insertBefore(accordion, table.nextSibling);
}

// Hook efter renderWeekTable
document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("resize", () => {
    setTimeout(enableAccordionWeeks, 150);
  });

  const original = renderWeekTable;
  renderWeekTable = function (...args) {
    original.apply(this, args);
    setTimeout(enableAccordionWeeks, 0);
  };
});
