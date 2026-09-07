import {
  CANONICAL_PROFILE,
  runElection,
  monteCarlo,
  mulberry32,
  METHOD_LABELS,
  METHOD_BLURBS,
  impartialCulture,
  spatial1D,
  randomUtilities,
  explainCanonical,
} from "./sim.js";
import { CANDS, allRankings } from "./voting.js";

const RANK_OPTIONS = allRankings(CANDS);
let lastUtilities = null;

function el(id) {
  return document.getElementById(id);
}

function renderResults(results) {
  const box = el("results");
  const rows = Object.entries(METHOD_LABELS)
    .map(([k, label]) => {
      const w = results[k];
      const tip = METHOD_BLURBS[k] || "";
      return `<tr><th><span class="tip" title="${tip}">${label}</span></th><td>${w ?? "-"}</td></tr>`;
    })
    .join("");
  const extra = [
    results.condorcet != null
      ? `<tr><th>Ganador de Condorcet</th><td>${results.condorcet}</td></tr>`
      : `<tr><th>Ganador de Condorcet</th><td>no hay (ciclo)</td></tr>`,
    results.utilitarian != null
      ? `<tr><th>Max. utilitario</th><td>${results.utilitarian}</td></tr>`
      : "",
    results.scoreUtil != null
      ? `<tr><th>Score (utilidades)</th><td>${results.scoreUtil}</td></tr>`
      : "",
    results.approvalUtil != null
      ? `<tr><th>Approval (utilidades)</th><td>${results.approvalUtil}</td></tr>`
      : "",
  ].join("");
  box.innerHTML = `<table class="results-table"><tbody>${rows}${extra}</tbody></table>`;
}

function renderExplain(results, isCanonical) {
  const box = el("canonicalExplain");
  if (!isCanonical) {
    box.innerHTML = Object.entries(METHOD_BLURBS)
      .map(
        ([k, t]) =>
          `<p><strong>${METHOD_LABELS[k]}</strong> (${results[k]}): ${t}</p>`
      )
      .join("");
    return;
  }
  box.innerHTML =
    `<h3>Por qué discrepan</h3><ul>` +
    explainCanonical(results)
      .map((line) => `<li>${line}</li>`)
      .join("") +
    `</ul>`;
}

function profileFromSelects() {
  const n = Number(el("nVotersManual").value);
  const profile = [];
  for (let i = 0; i < n; i++) {
    const sel = el(`rank-${i}`);
    profile.push(RANK_OPTIONS[Number(sel.value)].slice());
  }
  return profile;
}

function buildManualEditors() {
  lastUtilities = null;
  el("utilsPanel").hidden = true;
  const n = Number(el("nVotersManual").value);
  const wrap = el("manualEditors");
  wrap.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const label = document.createElement("label");
    label.className = "rank-label";
    label.innerHTML = `Votante ${i + 1}`;
    const sel = document.createElement("select");
    sel.id = `rank-${i}`;
    RANK_OPTIONS.forEach((r, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = r.join(" > ");
      sel.appendChild(opt);
    });
    sel.value = String(i % RANK_OPTIONS.length);
    label.appendChild(sel);
    wrap.appendChild(label);
  }
}

function applyProfileToEditors(profile) {
  buildManualEditors();
  profile.forEach((r, i) => {
    const idx = RANK_OPTIONS.findIndex(
      (o) => o[0] === r[0] && o[1] === r[1] && o[2] === r[2]
    );
    if (el(`rank-${i}`)) el(`rank-${i}`).value = String(idx);
  });
}

function loadCanonical() {
  el("nVotersManual").value = String(CANONICAL_PROFILE.length);
  applyProfileToEditors(CANONICAL_PROFILE);
  const results = runElection(CANONICAL_PROFILE);
  renderResults(results);
  renderExplain(results, true);
  el("scenarioNote").textContent =
    "Escenario canónico: ciclo de Condorcet (mismo perfil que verifica Lean).";
}

function runManual() {
  const profile = profileFromSelects();
  const results = runElection(profile, lastUtilities);
  renderResults(results);
  renderExplain(results, false);
  el("scenarioNote").textContent = lastUtilities
    ? `Perfil con utilidades latentes (${profile.length} votantes).`
    : `Perfil manual con ${profile.length} votantes.`;
}

function drawBars(canvas, summary, key, labelFmt) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const methods = Object.keys(METHOD_LABELS);
  const vals = methods.map((m) => summary[m][key]);
  const maxV = Math.max(0.0001, ...vals.map((v) => (v == null ? 0 : Math.abs(v))));
  const barW = w / (methods.length * 1.5);
  methods.forEach((m, i) => {
    const v = summary[m][key];
    const x = (i + 0.15) * (w / methods.length);
    const vh = v == null ? 0 : (Math.abs(v) / maxV) * (h - 40);
    ctx.fillStyle = "#1c4b56";
    ctx.fillRect(x, h - 24 - vh, barW, vh);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(METHOD_LABELS[m].slice(0, 7), x, h - 8);
    ctx.fillText(v == null ? "n/a" : labelFmt(v), x, h - 28 - vh);
  });
}

function runMonte() {
  const nRuns = Number(el("nRuns").value);
  const nVoters = Number(el("nVoters").value);
  const model = el("model").value;
  const seed = Number(el("seed").value) || 1;
  const rng = mulberry32(seed);
  const summary = monteCarlo({ nRuns, nVoters, model, rng });
  const out = el("monteTable");
  out.innerHTML =
    `<thead><tr><th>Método</th><th>Eficiencia Condorcet</th><th>Regret medio</th><th>Tasa cambio IIA</th><th>Top mayoritario</th></tr></thead>` +
    `<tbody>` +
    Object.keys(METHOD_LABELS)
      .map((m) => {
        const s = summary[m];
        return `<tr>
          <td><span class="tip" title="${METHOD_BLURBS[m]}">${METHOD_LABELS[m]}</span></td>
          <td>${s.condorcetEfficiency == null ? "n/a" : (100 * s.condorcetEfficiency).toFixed(1) + "%"}</td>
          <td>${s.meanRegret == null ? "n/a" : s.meanRegret.toFixed(3)}</td>
          <td>${(100 * s.iiaChangeRate).toFixed(1)}%</td>
          <td>${(100 * s.majorityTopRate).toFixed(1)}%</td>
        </tr>`;
      })
      .join("") +
    `</tbody>`;
  drawBars(el("chartCondorcet"), summary, "condorcetEfficiency", (v) =>
    (100 * v).toFixed(0) + "%"
  );
  drawBars(el("chartIia"), summary, "iiaChangeRate", (v) => (100 * v).toFixed(0) + "%");
  if (model === "spatial") {
    drawBars(el("chartRegret"), summary, "meanRegret", (v) => v.toFixed(2));
  } else {
    const ctx = el("chartRegret").getContext("2d");
    ctx.clearRect(0, 0, el("chartRegret").width, el("chartRegret").height);
    ctx.fillText("Regret solo en modelo espacial", 12, 40);
  }
  el("monteNote").textContent = `${nRuns} corridas, ${nVoters} votantes, modelo ${model}, semilla ${seed}.`;
}

function exportCsv() {
  const table = el("monteTable");
  if (!table.rows.length) return;
  const lines = [];
  for (const row of table.rows) {
    const cells = [...row.cells].map((c) => `"${c.textContent.replace(/"/g, '""')}"`);
    lines.push(cells.join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "arrow-montecarlo.csv";
  a.click();
}

function showUtilities(utilities) {
  const panel = el("utilsPanel");
  panel.hidden = false;
  panel.innerHTML =
    `<p class="lede">Utilidades en [0,1] (escape de Arrow: approval y score usan números, no solo el orden).</p>` +
    `<table class="results-table"><thead><tr><th>Votante</th>${CANDS.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>` +
    utilities
      .map(
        (u, i) =>
          `<tr><td>${i + 1}</td>${CANDS.map((c) => `<td>${u[c].toFixed(2)}</td>`).join("")}</tr>`
      )
      .join("") +
    `</tbody></table>`;
}

function wire() {
  el("nVotersManual").addEventListener("change", buildManualEditors);
  el("btnCanonical").addEventListener("click", loadCanonical);
  el("btnManual").addEventListener("click", runManual);
  el("btnMonte").addEventListener("click", runMonte);
  el("btnCsv").addEventListener("click", exportCsv);
  el("btnRandomIc").addEventListener("click", () => {
    const n = Number(el("nVotersManual").value);
    const profile = impartialCulture(n);
    lastUtilities = null;
    applyProfileToEditors(profile);
    const results = runElection(profile);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent = "Perfil impartial culture.";
  });
  el("btnRandomSpatial").addEventListener("click", () => {
    const n = Number(el("nVotersManual").value);
    const { profile, utilities } = spatial1D(n);
    lastUtilities = utilities;
    applyProfileToEditors(profile);
    showUtilities(utilities);
    const results = runElection(profile, utilities);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent = "Perfil espacial 1D con utilidades latentes.";
  });
  el("btnUtils").addEventListener("click", () => {
    const n = Number(el("nVotersManual").value);
    const { profile, utilities } = randomUtilities(n);
    lastUtilities = utilities;
    applyProfileToEditors(profile);
    showUtilities(utilities);
    const results = runElection(profile, utilities);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent =
      "Escape: mismas personas, pero approval/score leen utilidades (no solo el orden).";
  });
  buildManualEditors();
  loadCanonical();
}

wire();
