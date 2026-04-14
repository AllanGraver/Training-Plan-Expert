/* ============================================================
   GLOBAL STATE
============================================================ */
let planData = null;
const plansCache = {};
let USER_VDOT = null;
let SELECTED_RACE_DISTANCE = null;
let VDOT_DISTANCE = null;


/* ============================================================
   DISTANCE-KNAPPER (felt 1)
============================================================ */
const distanceButtons = document.querySelectorAll(".distance-btn");

distanceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    distanceButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    SELECTED_RACE_DISTANCE = parseFloat(btn.dataset.distance);
    updatePlanDropdown();
  });
});


/* ============================================================
   LOAD INDEX.JSON + PLANER
============================================================ */
async function loadPlansIndex() {
  const res = await fetch("plans/index.json");
  const index = await res.json();

  for (const file of index.plans) {
    const planRes = await fetch("plans/" + file);
    const planJson = await planRes.json();

    plansCache[planJson.id] = planJson;
  }

  updatePlanDropdown();
}


/* ============================================================
   FILTERING AF PLANER (felt 1 → felt 3)
============================================================ */

function updatePlanDropdown() {
  const select = document.getElementById("planSelect");
  if (!select) return;

  select.innerHTML = "";
  planData = null;

  if (!SELECTED_RACE_DISTANCE) return;

  const filtered = Object.values(plansCache).filter(plan =>
    Math.abs(plan.race_distance_km - SELECTED_RACE_DISTANCE) < 0.01
  );

  filtered.forEach(plan => {
    const opt = document.createElement("option");
    opt.value = plan.id;
    opt.textContent = plan.name;
    select.appendChild(opt);
  });

  // ✅ Auto-vælg første plan hvis der findes nogen
  
  if (filtered.length > 0) {
    select.value = filtered[0].id;
    planData = plansCache[filtered[0].id] || filtered[0];

  // ✅ PlanData

}




/* ============================================================
   RÅ VDOT-BEREGNING (KORRIGERET ENHEDER)
   Daniels-formlen bruger hastighed i meter pr. minut (m/min)
============================================================ */
function calculateRawVDOT(timeStr, distKm) {
  const parts = timeStr.split(":").map(Number);

  let seconds = 0;
  if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else {
    return null;
  }

  if (!seconds || !distKm) return null;

  const tMin = seconds / 60;                     // tid i minutter
  const v = (distKm * 1000) / tMin;              // hastighed i m/min  ✅

  const vo2 = -4.6 + 0.182258 * v + 0.000104 * (v * v);

  const pct =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * tMin) +
    0.2989558 * Math.exp(-0.1932605 * tMin);

  const vdot = vo2 / pct;

  return vdot;
}



/* ============================================================
   INTERPOLATION MELLEM VDOT-ZONER
============================================================ */
function paceToSeconds(paceStr) {
  const [m, s] = paceStr.split(":").map(Number);
  return m * 60 + s;
}

function secondsToPace(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function interpolatePace(p1, p2, t) {
  const s1 = paceToSeconds(p1);
  const s2 = paceToSeconds(p2);
  return secondsToPace(s1 + (s2 - s1) * t);
}

function findBoundingVDOTs(rawVDOT) {
  const keys = Object.keys(VDOT_ZONES).map(Number).sort((a, b) => a - b);

  if (rawVDOT <= keys[0]) return { lower: keys[0], upper: keys[0] };
  if (rawVDOT >= keys[keys.length - 1]) return { lower: keys[keys.length - 1], upper: keys[keys.length - 1] };

  for (let i = 0; i < keys.length - 1; i++) {
    if (rawVDOT >= keys[i] && rawVDOT <= keys[i + 1]) {
      return { lower: keys[i], upper: keys[i + 1] };
    }
  }
}

function getInterpolatedZones(rawVDOT) {
  const { lower, upper } = findBoundingVDOTs(rawVDOT);

  if (lower === upper) return VDOT_ZONES[lower];

  const t = (rawVDOT - lower) / (upper - lower);

  const zLow = VDOT_ZONES[lower];
  const zUp = VDOT_ZONES[upper];

  return {
    E: interpolatePace(zLow.E, zUp.E, t),
    M: interpolatePace(zLow.M, zUp.M, t),
    T: interpolatePace(zLow.T, zUp.T, t),
    I: interpolatePace(zLow.I, zUp.I, t),
    R: interpolatePace(zLow.R, zUp.R, t)
  };
}


/* ============================================================
   BEREGN VDOT FRA LØBSTID
   ✅ Tilføjet "silent" parameter så auto-beregning ikke giver alerts
============================================================ */
function calculateVDOT(silent = false) {
  const dist = VDOT_DISTANCE;
  if (!dist) {
    if (!silent) alert("Vælg en distance");
    return;
  }

  const hh = parseInt(document.getElementById("timeHours").value || 0, 10);
  const mm = parseInt(document.getElementById("timeMinutes").value || 0, 10);
  const ss = parseInt(document.getElementById("timeSeconds").value || 0, 10);

  if (isNaN(hh) || isNaN(mm) || isNaN(ss)) {
    if (!silent) alert("Indtast mindst minutter og sekunder");
    return;
  }

  if (mm > 59 || ss > 59 || hh < 0 || mm < 0 || ss < 0) {
    if (!silent) alert("Tjek din tid (mm/ss skal være 0-59)");
    return;
  }

  const totalSeconds = hh * 3600 + mm * 60 + ss;
  if (totalSeconds <= 0) {
    if (!silent) alert("Indtast en tid større end 0");
    return;
  }

  const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const raw = calculateRawVDOT(timeStr, dist);
  if (!raw) {
    if (!silent) alert("Kunne ikke beregne VDOT – tjek dine tal");
    return;
  }

  USER_VDOT = raw;
  const zones = getInterpolatedZones(raw);

  document.getElementById("vdotValue").textContent = raw.toFixed(1);
  document.getElementById("zoneE").textContent = zones.E;
  document.getElementById("zoneM").textContent = zones.M;
  document.getElementById("zoneT").textContent = zones.T;
  document.getElementById("zoneI").textContent = zones.I;
  document.getElementById("zoneR").textContent = zones.R;

  document.getElementById("vdotCard").style.display = "block";
}


/* ============================================================
   AUTO-BEREGNING AF VDOT
============================================================ */
let autoVDOTTimer = null;

function canAutoCalculateVDOT() {
  if (!VDOT_DISTANCE) return false;

  const hh = parseInt(document.getElementById("timeHours").value || 0, 10);
  const mm = parseInt(document.getElementById("timeMinutes").value || 0, 10);
  const ss = parseInt(document.getElementById("timeSeconds").value || 0, 10);

  if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return false;
  if (mm > 59 || ss > 59 || hh < 0 || mm < 0 || ss < 0) return false;

  const totalSeconds = hh * 3600 + mm * 60 + ss;
  return totalSeconds > 0;
}

function triggerAutoVDOT() {
  clearTimeout(autoVDOTTimer);

  autoVDOTTimer = setTimeout(() => {
    if (canAutoCalculateVDOT()) {
      // ✅ silent=true så ingen alerts mens man taster
      calculateVDOT(true);
    } else {
      document.getElementById("vdotCard").style.display = "none";
      USER_VDOT = null;
    }
  }, 250);
}

/* ============================================================
   AUTO-GENERÉR PLAN (når alt er klart)
============================================================ */

let autoPlanTimer = null;

function canAutoGeneratePlan() {
  const raceDateInput = document.getElementById("raceDate")?.value;
  return !!planData && !!USER_VDOT && !!raceDateInput;
}

function tryAutoGeneratePlan() {
  clearTimeout(autoPlanTimer);

  // Debounce så vi ikke renderer flere gange mens man taster/ændrer
  autoPlanTimer = setTimeout(() => {
    if (canAutoGeneratePlan()) {
      renderWeekTable(planData);
    }
  }, 250);
}



/* ============================================================
   INIT (ENESTE DOMContentLoaded)
   - Auto-VDOT
   - Auto-generér plan når alt er klar
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadPlansIndex();

  /* =========================
     FELT 1: Distanceknapper
  ========================== */
  const distanceButtons = document.querySelectorAll(".distance-btn");
  distanceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      distanceButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      SELECTED_RACE_DISTANCE = parseFloat(btn.dataset.distance);
      updatePlanDropdown();

      // ✅ Når distance ændres -> planer ændres -> prøv auto-generér
      tryAutoGeneratePlan();
    });
  });

  /* =========================
     FELT 1: Konkurrencedato
  ========================== */
  document.getElementById("raceDate")?.addEventListener("change", () => {
    tryAutoGeneratePlan();
  });

  /* =========================
     FELT 3: Plan dropdown (sæt planData ved valg)
  ========================== */
  document.getElementById("planSelect")?.addEventListener("change", (e) => {
    const id = e.target.value;
    planData = plansCache[id] || null;
    tryAutoGeneratePlan();
  });

  /* =========================
     FELT 2: VDOT distance dropdown
  ========================== */
  const vdotDistanceSelect = document.getElementById("vdotDistance");
  if (vdotDistanceSelect) {
    vdotDistanceSelect.addEventListener("change", () => {
      VDOT_DISTANCE = parseFloat(vdotDistanceSelect.value);
      triggerAutoVDOT();
      tryAutoGeneratePlan();
    });
  }

  /* =========================
     FELT 2: Tid -> auto VDOT -> auto plan
  ========================== */
  ["timeHours", "timeMinutes", "timeSeconds"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      triggerAutoVDOT();
      tryAutoGeneratePlan();
    });

    el.addEventListener("change", () => {
      triggerAutoVDOT();
      tryAutoGeneratePlan();
    });
  });

  /* =========================
     Fallback knapper (valgfrit)
  ========================== */
  document.getElementById("calculateVDOT")?.addEventListener("click", () => {
    calculateVDOT(false);
    tryAutoGeneratePlan();
  });

  document.getElementById("generatePlan")?.addEventListener("click", generatePlan);
});




/* ============================================================
   GENERÉR PLAN
============================================================ */
function generatePlan() {
  if (!planData) {
    alert("Vælg en træningsplan først");
    return;
  }

  if (!USER_VDOT) {
    alert("Beregn dine træningszoner ud fra løbstid først.");
    return;
  }

  const raceDateInput = document.getElementById("raceDate").value;
  if (!raceDateInput) {
    alert("Vælg en konkurrencedato");
    return;
  }
   
function paceToMinPerKm(paceStr) {
  if (!paceStr) return null;
  const [m, s] = paceStr.split(":").map(Number);
  return m + s / 60;
}

function minutesToKm(minutes, paceStr) {
  const pace = paceToMinPerKm(paceStr);
  if (!pace || minutes <= 0) return null;
  return minutes / pace;
}

function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h} t ${m} min` : `${m} min`;
}


  renderWeekTable(planData);
}


/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadPlansIndex();

  ["timeHours", "timeMinutes", "timeSeconds"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", triggerAutoVDOT);
      el.addEventListener("change", triggerAutoVDOT);
    }
  });
});


/* ============================================================
   GENERÉR PLAN
============================================================ */
function generatePlan() {
  if (!planData) {
    alert("Vælg en træningsplan først");
    return;
  }

  if (!USER_VDOT) {
    alert("Beregn dine træningszoner ud fra løbstid først.");
    return;
  }

  const raceDateInput = document.getElementById("raceDate").value;
  if (!raceDateInput) {
    alert("Vælg en konkurrencedato");
    return;
  }

  renderWeekTable(planData);
}



/* ============================================================
   RENDER UGE-TABEL (MODEL A: MIN + EST. KM)
============================================================ */
function renderWeekTable(plan) {
  const gridEl = document.getElementById("weekGrid");
  const raceDate = new Date(document.getElementById("raceDate").value);

  const raceDayIndex = ((raceDate.getDay() + 6) % 7) + 1;
  const durationWeeks = plan.duration_weeks;

  let sessions = [...plan.sessions];

  // Parse distance fra note hvis nødvendigt
  sessions.forEach(s => {
    if (s.distance_km == null && s.note) {
      const match = s.note.replace(",", ".").match(/([\d.]+)\s*km/i);
      if (match) s.distance_km = parseFloat(match[1]);
    }
  });

  /* ---------- Flyt race-pas ---------- */
  const lastWeekSessions = sessions.filter(s => s.week === durationWeeks);
  let lastSession = null;

  lastWeekSessions.forEach(s => {
    if (!lastSession || s.day > lastSession.day) lastSession = s;
  });

  if (lastSession) {
    sessions = sessions.filter(s => s !== lastSession);

    let raceKm = plan.race_distance_km ?? lastSession.distance_km ?? 21.1;

    lastSession.distance_km = raceKm;
    lastSession.note = `${raceKm} km`;
    lastSession.title = "Race";
    lastSession.isRace = true;
    lastSession.day = raceDayIndex;

    sessions.push(lastSession);
  }

  /* ---------- Byg uge-struktur ---------- */
  const weeks = {};
  sessions.forEach(s => {
    if (!weeks[s.week]) weeks[s.week] = {};
    if (!weeks[s.week][s.day]) weeks[s.week][s.day] = [];
    weeks[s.week][s.day].push(s);
  });

  const headers = ["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"];

  let html = "<table class='week-table'><thead><tr>";
  html += "<th class='week-col'>Oversigt</th>";
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "<th class='km-col'>Ugentlig belastning</th></tr></thead><tbody>";

  const ePace = document.getElementById("zoneE")?.textContent; // fx "5:25"

  for (let w = 1; w <= durationWeeks; w++) {
    const weekStart = getDateForWeekDay(raceDate, durationWeeks, w, 1);
    const weekEnd = getDateForWeekDay(raceDate, durationWeeks, w, 7);
    const calendarWeek = getISOWeekNumber(weekStart);

    let weekKm = 0;
    let weekMinutes = 0;

    html += `
      <tr>
        <td class="week-col">
          Træningsuge ${w} (uge ${calendarWeek})<br>
          <span>(${formatDanskDatoKort(weekStart)} – ${formatDanskDatoKort(weekEnd)})</span>
        </td>
    `;

    for (let d = 1; d <= 7; d++) {
      const ses = weeks[w]?.[d] || [];

      if (!ses.length) {
        html += "<td>–</td>";
        continue;
      }

      let cell = "";

      ses.forEach(s => {

        if (s.distance_km != null) weekKm += s.distance_km;
        if (s.duration_min != null) weekMinutes += s.duration_min;

        cell += `
          <div class="session ${s.isRace ? "race-session" : ""}">
            <div class="session-title">
              ${s.isRace ? "🏁 <strong>Race</strong>" : `<strong>${s.title}</strong>`}
            </div>
            ${s.distance_km != null ? `<div class="session-note">${s.distance_km.toFixed(1)} km</div>` : ""}
            ${s.duration_min != null ? `<div class="session-note">${s.duration_min} min</div>` : ""}
          </div>
        `;
      });

      html += `<td>${cell}</td>`;
    }

    /* ---------- MODEL A: min + est. km ---------- */
    
let primaryLine = "";
let secondaryLine = "";
const ePaceStr = document.getElementById("zoneE")?.textContent;

if (ePaceStr) {
  const [m, s] = ePaceStr.split(":").map(Number);
  const paceMinPerKm = m + s / 60;

  /* ========= CASE 1: TIDSBASERET ========= */
  if (weekMinutes > 0) {
    const estKm = weekMinutes / paceMinPerKm;

    primaryLine = `${weekMinutes} min`;
    secondaryLine = `~${(weekKm + estKm).toFixed(1)} km`;
  }

  /* ========= CASE 2: DISTANCEBASERET ========= */
  else if (weekKm > 0) {
    const estMin = weekKm * paceMinPerKm;

    primaryLine = `${weekKm.toFixed(1)} km`;
    secondaryLine = `~${Math.round(estMin)} min`;
  }
}

/* Fallback (hvis noget er helt tomt) */
if (!primaryLine) {
  primaryLine = "–";
  secondaryLine = "";
}

html += `
  <td class="km-col">
    <div><strong>${primaryLine}</strong></div>
    ${secondaryLine ? `<div style="font-size:0.8em;color:#555">${secondaryLine}</div>` : ""}
  </td>
`;

  }

  html += "</tbody></table>";
  gridEl.innerHTML = html;
}


/* ============================================================
   DATO-HJÆLP
============================================================ */
function getDateForWeekDay(raceDate, weeks, week, day) {
  const d = new Date(raceDate);
  d.setDate(d.getDate() - (weeks - week) * 7 + (day - 1));
  return d;
}

function formatDanskDatoKort(d) {
  const m = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
  return `${String(d.getDate()).padStart(2,"0")}-${m[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}


/* ============================================================
   DOWNLOAD STUBS
============================================================ */
function downloadCSV() {
  alert("CSV-download er ikke implementeret endnu.");
}

function downloadICS() {
  alert("iCal-download er ikke implementeret endnu.");
}
/* ============================================================
   VALIDERING – FORHINDR BOGSTAVER I TIDSFELTER
============================================================ */

["timeHours", "timeMinutes", "timeSeconds"].forEach(id => {
  const el = document.getElementById(id);

  el.addEventListener("input", () => {
    el.value = el.value.replace(/\D/g, ""); // fjern alt der ikke er tal
  });
});
/* ============================================================
   AUTO-FOKUS & AUTOFORMAT FOR TIDSFELTER
============================================================ */

const hhInput = document.getElementById("timeHours");
const mmInput = document.getElementById("timeMinutes");
const ssInput = document.getElementById("timeSeconds");

// Auto-fokus når der er skrevet 2 cifre
function autoFocusNext(current, next, max = null) {
  current.addEventListener("input", () => {
    let val = current.value;

    // Begrænsning (fx mm og ss max 59)
    if (max !== null && val !== "") {
      val = Math.min(parseInt(val), max);
      current.value = val;
    }

    // Hop videre når der er 2 cifre
    if (val.length >= 2) {
      next.focus();
      next.select();
    }
  });
}

// Auto-format når feltet forlades (fx 4 → 04)
function autoPad(input) {
  input.addEventListener("blur", () => {
    if (input.value !== "") {
      input.value = String(input.value).padStart(2, "0");
    }
  });
}

// Opsætning
autoFocusNext(hhInput, mmInput);
autoFocusNext(mmInput, ssInput, 59);
autoFocusNext(ssInput, ssInput, 59); // sidste felt

autoPad(hhInput);
autoPad(mmInput);
autoPad(ssInput);


/* ============================================================
   VALIDERING – FORHINDR BOGSTAVER I TIDSFELTER
============================================================ */

["timeHours", "timeMinutes", "timeSeconds"].forEach(id => {
  const el = document.getElementById(id);

  el.addEventListener("input", () => {
    el.value = el.value.replace(/\D/g, ""); // fjern alt der ikke er tal
  });
});


/* ============================================================
   PRINT – UDFYLD SPECIFIKATIONER
============================================================ */
window.addEventListener("beforeprint", () => {
  // Konkurrencedato
  const raceDate = document.getElementById("raceDate")?.value;
  document.getElementById("printRaceDate").textContent =
    raceDate ? new Date(raceDate).toLocaleDateString("da-DK") : "-";

  // Træningsplan
  document.getElementById("printPlanName").textContent =
    planData?.name || "-";

  // VDOT-zoner
  document.getElementById("printZoneE").textContent = document.getElementById("zoneE")?.textContent || "-";
  document.getElementById("printZoneM").textContent = document.getElementById("zoneM")?.textContent || "-";
  document.getElementById("printZoneT").textContent = document.getElementById("zoneT")?.textContent || "-";
  document.getElementById("printZoneI").textContent = document.getElementById("zoneI")?.textContent || "-";
  document.getElementById("printZoneR").textContent = document.getElementById("zoneR")?.textContent || "-";
});
