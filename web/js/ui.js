import {
  CANONICAL_PROFILE,
  runElection,
  monteCarlo,
  mulberry32,
  METHOD_LABELS,
  METHOD_BLURBS,
  METHOD_GROUP,
  impartialCulture,
  spatial1D,
  singlePeaked,
  randomUtilities,
  explainCanonical,
  medianVoterWinner,
} from "./sim.js";
import { CANDS, allRankings } from "./voting.js";

const RANK_OPTIONS = allRankings(CANDS);
let lastUtilities = null;
let lastSummary = null;

function el(id) {
  return document.getElementById(id);
}

function tableFor(results, group) {
  const rows = Object.keys(METHOD_LABELS)
    .filter((k) => METHOD_GROUP[k] === group && results[k] != null)
    .map((k) => {
      const tip = METHOD_BLURBS[k] || "";
      return `<tr><th><span class="tip" title="${tip}">${METHOD_LABELS[k]}</span></th><td>${results[k]}</td></tr>`;
    })
    .join("");
  const extra =
    group === "ranking"
      ? results.condorcet != null
        ? `<tr><th>Condorcet</th><td>${results.condorcet}</td></tr>`
        : `<tr><th>Condorcet</th><td>no hay (ciclo)</td></tr>`
      : results.utilitarian != null
        ? `<tr><th>Max. utilitario</th><td>${results.utilitarian}</td></tr>`
        : "";
  return `<table class="results-table"><tbody>${rows}${extra}</tbody></table>`;
}

function renderResults(results) {
  el("resultsRanking").innerHTML = tableFor(results, "ranking");
  el("resultsEscape").innerHTML = results.scoreUtil
    ? tableFor(results, "escape")
    : `<p class="note">Cargá utilidades (espacial / botón Utilidades) para ver escapes de boleta.</p>`;
}

function renderExplain(results, isCanonical) {
  const box = el("canonicalExplain");
  if (isCanonical) {
    box.innerHTML =
      `<h3>Por qué discrepan</h3><ul>` +
      explainCanonical(results)
        .map((line) => `<li>${line}</li>`)
        .join("") +
      `</ul>`;
    return;
  }
  box.innerHTML = Object.keys(METHOD_LABELS)
    .filter((k) => results[k] != null)
    .slice(0, 8)
    .map(
      (k) =>
        `<p><strong>${METHOD_LABELS[k]}</strong> (${results[k]}): ${METHOD_BLURBS[k]}</p>`
    )
    .join("");
}

function profileFromSelects() {
  const n = Number(el("nVotersManual").value);
  const profile = [];
  for (let i = 0; i < n; i++) {
    profile.push(RANK_OPTIONS[Number(el(`rank-${i}`).value)].slice());
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
    label.textContent = `Votante ${i + 1}`;
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
  el("nVotersManual").value = String(profile.length);
  buildManualEditors();
  profile.forEach((r, i) => {
    const idx = RANK_OPTIONS.findIndex(
      (o) => o[0] === r[0] && o[1] === r[1] && o[2] === r[2]
    );
    if (el(`rank-${i}`)) el(`rank-${i}`).value = String(idx >= 0 ? idx : 0);
  });
}

function showUtilities(utilities) {
  const panel = el("utilsPanel");
  panel.hidden = false;
  panel.innerHTML =
    `<p class="lede">Utilidades normalizadas en [0,1] (alimentan approval/score/MJ/STAR).</p>` +
    `<table class="results-table"><thead><tr><th>Votante</th>${CANDS.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>` +
    utilities
      .map(
        (u, i) =>
          `<tr><td>${i + 1}</td>${CANDS.map((c) => `<td>${u[c].toFixed(2)}</td>`).join("")}</tr>`
      )
      .join("") +
    `</tbody></table>`;
}

function loadCanonical() {
  applyProfileToEditors(CANONICAL_PROFILE);
  lastUtilities = null;
  const results = runElection(CANONICAL_PROFILE);
  renderResults(results);
  renderExplain(results, true);
  el("scenarioNote").textContent =
    "Escenario canónico: ciclo de Condorcet (mismo perfil que Lean Canonical).";
}

function runManual() {
  const profile = profileFromSelects();
  const results = runElection(profile, lastUtilities);
  renderResults(results);
  renderExplain(results, false);
  el("scenarioNote").textContent = lastUtilities
    ? `Perfil con utilidades (${profile.length} votantes).`
    : `Perfil manual (${profile.length} votantes).`;
}

function drawBars(canvas, summary, keys, metric, labelFmt) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const vals = keys.map((m) => summary[m]?.[metric]);
  const maxV = Math.max(0.0001, ...vals.map((v) => (v == null ? 0 : Math.abs(v))));
  const barW = w / (keys.length * 1.5);
  keys.forEach((m, i) => {
    const v = summary[m]?.[metric];
    const x = (i + 0.15) * (w / keys.length);
    const vh = v == null ? 0 : (Math.abs(v) / maxV) * (h - 40);
    ctx.fillStyle = "#1c4b56";
    ctx.fillRect(x, h - 24 - vh, barW, vh);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "9px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText((METHOD_LABELS[m] || m).slice(0, 8), x, h - 8);
    ctx.fillText(v == null ? "n/a" : labelFmt(v), x, h - 28 - vh);
  });
}

function fillMonteTable(tableId, summary, group) {
  const keys = Object.keys(METHOD_LABELS).filter((k) => METHOD_GROUP[k] === group);
  const table = el(tableId);
  table.innerHTML =
    `<thead><tr><th>Método</th><th>Eff. Condorcet</th><th>Regret</th><th>IIA-stress</th><th>Top mayoritario</th></tr></thead><tbody>` +
    keys
      .map((m) => {
        const s = summary[m];
        if (!s) return "";
        return `<tr>
          <td><span class="tip" title="${METHOD_BLURBS[m]}">${METHOD_LABELS[m]}</span></td>
          <td>${s.condorcetEfficiency == null ? "n/a" : (100 * s.condorcetEfficiency).toFixed(1) + "%"}</td>
          <td>${s.meanRegret == null ? "n/a" : s.meanRegret.toFixed(3)}</td>
          <td>${s.iiaChangeRate == null ? "n/a" : (100 * s.iiaChangeRate).toFixed(1) + "%"}</td>
          <td>${(100 * s.majorityTopRate).toFixed(1)}%</td>
        </tr>`;
      })
      .join("") +
    `</tbody>`;
}

function runMonte() {
  const nRuns = Number(el("nRuns").value);
  const nVoters = Number(el("nVoters").value);
  const model = el("model").value;
  const seed = Number(el("seed").value) || 1;
  const rng = mulberry32(seed);
  const summary = monteCarlo({ nRuns, nVoters, model, rng });
  lastSummary = summary;
  el("metaNote").textContent =
    `Tasa de existencia de ganador de Condorcet: ${(100 * summary._meta.condorcetExistenceRate).toFixed(1)}% ` +
    `(modelo ${model}, ${nRuns} corridas, ${nVoters} votantes, semilla ${seed}).`;
  fillMonteTable("monteTableRank", summary, "ranking");
  fillMonteTable("monteTableEscape", summary, "escape");
  const rankKeys = Object.keys(METHOD_LABELS).filter((k) => METHOD_GROUP[k] === "ranking");
  const escKeys = Object.keys(METHOD_LABELS).filter((k) => METHOD_GROUP[k] === "escape");
  drawBars(el("chartCondorcet"), summary, rankKeys, "condorcetEfficiency", (v) =>
    (100 * v).toFixed(0) + "%"
  );
  drawBars(el("chartRegret"), summary, escKeys, "meanRegret", (v) => v.toFixed(2));
  drawBars(el("chartIia"), summary, rankKeys, "iiaChangeRate", (v) =>
    v == null ? "n/a" : (100 * v).toFixed(0) + "%"
  );
  el("monteNote").textContent = "CSV exporta ambas tablas.";
}

function exportCsv() {
  if (!lastSummary) return;
  const lines = ["group,method,condorcet_eff,mean_regret,iia_rate,majority_top"];
  for (const m of Object.keys(METHOD_LABELS)) {
    const s = lastSummary[m];
    if (!s) continue;
    lines.push(
      [
        s.group,
        m,
        s.condorcetEfficiency,
        s.meanRegret,
        s.iiaChangeRate,
        s.majorityTopRate,
      ].join(",")
    );
  }
  lines.push(`meta,condorcet_existence,${lastSummary._meta.condorcetExistenceRate},,,`);
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "arrow-montecarlo.csv";
  a.click();
}

function runMedian() {
  const n = Number(el("nMedian").value);
  const seed = Number(el("seedMedian").value) || 1;
  const rng = mulberry32(seed);
  const { profile, utilities, candPos, voterPos } = spatial1D(n, CANDS, rng);
  const { median, winner } = medianVoterWinner(voterPos, candPos, CANDS);
  const results = runElection(profile, utilities);
  const canvas = el("medianCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#cfc6b6";
  ctx.beginPath();
  ctx.moveTo(20, h / 2);
  ctx.lineTo(w - 20, h / 2);
  ctx.stroke();
  const xOf = (t) => 20 + t * (w - 40);
  voterPos.forEach((v) => {
    ctx.fillStyle = "#8a9aa3";
    ctx.beginPath();
    ctx.arc(xOf(v), h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  CANDS.forEach((c) => {
    ctx.fillStyle = "#1c4b56";
    ctx.fillRect(xOf(candPos[c]) - 5, h / 2 - 18, 10, 18);
    ctx.fillText(c, xOf(candPos[c]) - 4, h / 2 - 22);
  });
  ctx.strokeStyle = "#b85c38";
  ctx.beginPath();
  ctx.moveTo(xOf(median), 10);
  ctx.lineTo(xOf(median), h - 10);
  ctx.stroke();
  ctx.fillStyle = "#b85c38";
  ctx.fillText("mediana", xOf(median) + 4, 20);
  el("medianOut").innerHTML =
    `<p>Mediana en ${median.toFixed(3)}. Candidato más cercano: <strong>${winner}</strong>.</p>` +
    `<p>Condorcet: <strong>${results.condorcet}</strong>. Score util: <strong>${results.scoreUtil}</strong>. ` +
    `Pluralidad: <strong>${results.plurality}</strong>. Minimax: <strong>${results.minimax}</strong>.</p>` +
    `<p>${results.condorcet === winner ? "Coincide mediana = Condorcet (como predice la teoría en single-peaked)." : "Caso borde / empate de distancias."}</p>`;
}

function wire() {
  el("nVotersManual").addEventListener("change", buildManualEditors);
  el("btnCanonical").addEventListener("click", loadCanonical);
  el("btnManual").addEventListener("click", runManual);
  el("btnMonte").addEventListener("click", runMonte);
  el("btnCsv").addEventListener("click", exportCsv);
  el("btnMedian").addEventListener("click", runMedian);
  el("btnRandomIc").addEventListener("click", () => {
    const profile = impartialCulture(Number(el("nVotersManual").value));
    lastUtilities = null;
    applyProfileToEditors(profile);
    const results = runElection(profile);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent = "Impartial culture (dominio universal; muchos ciclos).";
  });
  el("btnRandomSpatial").addEventListener("click", () => {
    const { profile, utilities } = spatial1D(Number(el("nVotersManual").value));
    lastUtilities = utilities;
    applyProfileToEditors(profile);
    showUtilities(utilities);
    const results = runElection(profile, utilities);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent = "Espacial 1D (rankings single-peaked + utilidades).";
  });
  el("btnRandomPeaked").addEventListener("click", () => {
    const { profile, utilities } = singlePeaked(Number(el("nVotersManual").value));
    lastUtilities = utilities;
    applyProfileToEditors(profile);
    showUtilities(utilities);
    const results = runElection(profile, utilities);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent = "Single-peaked explícito (escape por dominio).";
  });
  el("btnUtils").addEventListener("click", () => {
    const { profile, utilities } = randomUtilities(Number(el("nVotersManual").value));
    lastUtilities = utilities;
    applyProfileToEditors(profile);
    showUtilities(utilities);
    const results = runElection(profile, utilities);
    renderResults(results);
    renderExplain(results, false);
    el("scenarioNote").textContent = "Utilidades libres: escapes de boleta activos.";
  });
  buildManualEditors();
  loadCanonical();
  runMedian();
}

wire();
