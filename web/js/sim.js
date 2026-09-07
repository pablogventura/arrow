/** Preference generation, escapes metrics, Monte Carlo. */

import {
  CANDS,
  RANKING_METHODS,
  ESCAPE_METHODS,
  METHOD_LABELS,
  METHOD_BLURBS,
  METHOD_GROUP,
  allRankings,
  condorcetWinner,
  majorityPrefers,
  rankingFromUtilities,
  pairwiseMargin,
  gradesFromUtilities,
} from "./voting.js";

export { METHOD_LABELS, METHOD_BLURBS, METHOD_GROUP, RANKING_METHODS, ESCAPE_METHODS };

export const CANONICAL_PROFILE = [
  ["A", "B", "C"],
  ["A", "B", "C"],
  ["B", "C", "A"],
  ["B", "C", "A"],
  ["C", "A", "B"],
];

export const MODEL_LABELS = {
  ic: "Impartial culture",
  spatial1d: "Espacial 1D",
  spatial2d: "Espacial 2D",
  peaked: "Single-peaked",
  peakedNoisy: "Single-peaked + ruido",
  mallows: "Mallows",
};

export function explainCanonical(results) {
  return [
    "Mayoría pairwise: A vence a B (3-2), B vence a C (4-1), C vence a A (3-2). Ciclo: no hay ganador de Condorcet.",
    "Primeros puestos: A, A, B, B, C. Pluralidad empatan A y B (2).",
    `Borda gana ${results.borda}; ranked pairs ${results.rankedPairs}; minimax ${results.minimax}; Copeland ${results.copeland}.`,
    `IRV gana ${results.irv}. Approval/score desde ranking no son escapes reales del teorema.`,
  ];
}

export function impartialCulture(nVoters, cands = CANDS, rng = Math.random) {
  const ranks = allRankings(cands);
  return Array.from({ length: nVoters }, () =>
    ranks[Math.floor(rng() * ranks.length)].slice()
  );
}

export function spatial1D(nVoters, cands = CANDS, rng = Math.random) {
  const candPos = {};
  cands.forEach((c, i) => {
    candPos[c] = (i + 1) / (cands.length + 1) + (rng() - 0.5) * 0.04;
  });
  const utilities = [];
  const profile = [];
  const voterPos = [];
  for (let i = 0; i < nVoters; i++) {
    const v = rng();
    voterPos.push(v);
    const u = {};
    for (const c of cands) u[c] = -Math.abs(v - candPos[c]);
    utilities.push(normalizeUtil(u, cands));
    profile.push(rankingFromUtilities(u, cands));
  }
  return { profile, utilities, candPos, voterPos };
}

/** Alias narrativo: same as spatial1D (single-peaked rankings). */
export function singlePeaked(nVoters, cands = CANDS, rng = Math.random) {
  return spatial1D(nVoters, cands, rng);
}

/** Single-peaked then swap adjacent candidates with probability pNoise. */
export function peakedNoisy(nVoters, cands = CANDS, rng = Math.random, pNoise = 0.25) {
  const base = spatial1D(nVoters, cands, rng);
  const profile = base.profile.map((r) => {
    const copy = r.slice();
    for (let i = 0; i < copy.length - 1; i++) {
      if (rng() < pNoise) {
        const t = copy[i];
        copy[i] = copy[i + 1];
        copy[i + 1] = t;
      }
    }
    return copy;
  });
  // Rebuild utilities consistently with noisy ranking via positions still
  return { ...base, profile };
}

export function spatial2D(nVoters, cands = CANDS, rng = Math.random) {
  const candPos = {};
  cands.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / cands.length;
    candPos[c] = {
      x: 0.5 + 0.35 * Math.cos(angle) + (rng() - 0.5) * 0.05,
      y: 0.5 + 0.35 * Math.sin(angle) + (rng() - 0.5) * 0.05,
    };
  });
  const utilities = [];
  const profile = [];
  for (let i = 0; i < nVoters; i++) {
    const vx = rng();
    const vy = rng();
    const u = {};
    for (const c of cands) {
      const dx = vx - candPos[c].x;
      const dy = vy - candPos[c].y;
      u[c] = -Math.sqrt(dx * dx + dy * dy);
    }
    utilities.push(normalizeUtil(u, cands));
    profile.push(rankingFromUtilities(u, cands));
  }
  return { profile, utilities, candPos };
}

/** Mallows model: sample rankings near a reference with dispersion phi in (0,1]. */
export function mallows(nVoters, cands = CANDS, rng = Math.random, phi = 0.4) {
  const ranks = allRankings(cands);
  const ref = ranks[Math.floor(rng() * ranks.length)];
  function kendall(a, b) {
    let d = 0;
    for (let i = 0; i < cands.length; i++) {
      for (let j = i + 1; j < cands.length; j++) {
        const ai = a.indexOf(cands[i]);
        const aj = a.indexOf(cands[j]);
        const bi = b.indexOf(cands[i]);
        const bj = b.indexOf(cands[j]);
        if ((ai - aj) * (bi - bj) < 0) d += 1;
      }
    }
    return d;
  }
  const weights = ranks.map((r) => Math.pow(phi, kendall(r, ref)));
  const sum = weights.reduce((a, b) => a + b, 0);
  const profile = [];
  for (let i = 0; i < nVoters; i++) {
    let t = rng() * sum;
    let chosen = ranks[0];
    for (let k = 0; k < ranks.length; k++) {
      t -= weights[k];
      if (t <= 0) {
        chosen = ranks[k];
        break;
      }
    }
    profile.push(chosen.slice());
  }
  // Synthetic utilities from rank positions for escape methods
  const m = cands.length;
  const utilities = profile.map((r) => {
    const u = {};
    r.forEach((c, i) => {
      u[c] = (m - 1 - i) / (m - 1 || 1);
    });
    return u;
  });
  return { profile, utilities, ref };
}

export function randomUtilities(nVoters, cands = CANDS, rng = Math.random) {
  const utilities = Array.from({ length: nVoters }, () => {
    const u = {};
    for (const c of cands) u[c] = rng();
    return u;
  });
  const profile = utilities.map((u) => rankingFromUtilities(u, cands));
  return { profile, utilities };
}

function normalizeUtil(u, cands) {
  const vals = cands.map((c) => u[c]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const out = {};
  for (const c of cands) out[c] = (u[c] - lo) / span;
  return out;
}

export function generateModel(model, nVoters, cands = CANDS, rng = Math.random) {
  switch (model) {
    case "ic":
      return { profile: impartialCulture(nVoters, cands, rng), utilities: null };
    case "spatial":
    case "spatial1d":
      return spatial1D(nVoters, cands, rng);
    case "spatial2d":
      return spatial2D(nVoters, cands, rng);
    case "peaked":
      return singlePeaked(nVoters, cands, rng);
    case "peakedNoisy":
      return peakedNoisy(nVoters, cands, rng);
    case "mallows":
      return mallows(nVoters, cands, rng);
    default:
      return spatial1D(nVoters, cands, rng);
  }
}

export function utilitarianWinner(utilities, cands = CANDS) {
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const u of utilities) for (const c of cands) scores[c] += u[c];
  let best = cands[0];
  for (const c of cands) {
    if (scores[c] > scores[best] || (scores[c] === scores[best] && c < best)) best = c;
  }
  return best;
}

export function utilitarianRegret(utilities, winner, cands = CANDS) {
  const opt = utilitarianWinner(utilities, cands);
  const sum = (cand) => utilities.reduce((s, u) => s + u[cand], 0);
  return sum(opt) - sum(winner);
}

export function iiaStress(profile, methodFn, cands = CANDS) {
  const base = methodFn(profile, cands);
  const extra = "S";
  const extendedCands = cands.concat([extra]);
  const extended = profile.map((r, idx) => {
    const copy = r.slice();
    if (idx % 2 === 0 && copy.length >= 1) copy.splice(1, 0, extra);
    else copy.push(extra);
    return copy;
  });
  const winExt = methodFn(extended, extendedCands);
  if (winExt === extra) return { changed: false, base, winExt };
  return { changed: winExt !== base, base, winExt };
}

export function medianVoterWinner(voterPos, candPos, cands = CANDS) {
  const sorted = voterPos.slice().sort((a, b) => a - b);
  const med = sorted[Math.floor((sorted.length - 1) / 2)];
  let best = cands[0];
  for (const c of cands) {
    if (Math.abs(candPos[c] - med) < Math.abs(candPos[best] - med)) best = c;
  }
  return { median: med, winner: best };
}

export function runElection(profile, utilities = null, cands = CANDS) {
  const results = {};
  for (const [name, fn] of Object.entries(RANKING_METHODS)) {
    results[name] = fn(profile, cands);
  }
  if (utilities) {
    for (const [name, fn] of Object.entries(ESCAPE_METHODS)) {
      results[name] = fn(utilities, cands);
    }
    results.utilitarian = utilitarianWinner(utilities, cands);
    results._grades = gradesFromUtilities(utilities, cands);
  }
  results.condorcet = condorcetWinner(profile, cands);
  results._margins = {};
  for (const x of cands) {
    for (const y of cands) {
      if (x < y) results._margins[`${x}${y}`] = pairwiseMargin(profile, x, y);
    }
  }
  return results;
}

export function monteCarlo({
  nRuns = 200,
  nVoters = 25,
  model = "spatial1d",
  cands = CANDS,
  rng = Math.random,
} = {}) {
  const rankingNames = Object.keys(RANKING_METHODS);
  const escapeNames = Object.keys(ESCAPE_METHODS);
  const allNames = [...rankingNames, ...escapeNames];
  const stats = {};
  for (const m of allNames) {
    stats[m] = {
      condorcetHits: 0,
      condorcetOpps: 0,
      regretSum: 0,
      regretN: 0,
      iiaChanges: 0,
      majorityTop: 0,
    };
  }
  let condorcetExists = 0;

  for (let t = 0; t < nRuns; t++) {
    const gen = generateModel(model, nVoters, cands, rng);
    const { profile } = gen;
    let { utilities } = gen;
    if (!utilities) {
      // IC: synthetic utilities from ranks for escape comparison
      const m = cands.length;
      utilities = profile.map((r) => {
        const u = {};
        r.forEach((c, i) => {
          u[c] = (m - 1 - i) / (m - 1 || 1);
        });
        return u;
      });
    }
    const cw = condorcetWinner(profile, cands);
    if (cw !== null) condorcetExists += 1;

    for (const m of rankingNames) {
      const w = RANKING_METHODS[m](profile, cands);
      if (cw !== null) {
        stats[m].condorcetOpps += 1;
        if (w === cw) stats[m].condorcetHits += 1;
      }
      stats[m].regretSum += utilitarianRegret(utilities, w, cands);
      stats[m].regretN += 1;
      if (iiaStress(profile, RANKING_METHODS[m], cands).changed) stats[m].iiaChanges += 1;
      if (cands.every((y) => y === w || majorityPrefers(profile, w, y))) {
        stats[m].majorityTop += 1;
      }
    }
    for (const m of escapeNames) {
      const w = ESCAPE_METHODS[m](utilities, cands);
      if (cw !== null) {
        stats[m].condorcetOpps += 1;
        if (w === cw) stats[m].condorcetHits += 1;
      }
      stats[m].regretSum += utilitarianRegret(utilities, w, cands);
      stats[m].regretN += 1;
      // IIA stress less meaningful for util methods; skip or count 0
      if (cands.every((y) => y === w || majorityPrefers(profile, w, y))) {
        stats[m].majorityTop += 1;
      }
    }
  }

  const summary = {};
  for (const m of allNames) {
    const s = stats[m];
    summary[m] = {
      group: METHOD_GROUP[m],
      condorcetEfficiency: s.condorcetOpps ? s.condorcetHits / s.condorcetOpps : null,
      meanRegret: s.regretN ? s.regretSum / s.regretN : null,
      iiaChangeRate: rankingNames.includes(m) ? s.iiaChanges / nRuns : null,
      majorityTopRate: s.majorityTop / nRuns,
    };
  }
  summary._meta = {
    condorcetExistenceRate: condorcetExists / nRuns,
    nRuns,
    nVoters,
    model,
  };
  return summary;
}

/** Agreement matrix: fraction of runs where method i and j agree. */
export function methodAgreement({
  nRuns = 100,
  nVoters = 25,
  model = "spatial1d",
  rng = Math.random,
  cands = CANDS,
} = {}) {
  const names = [...Object.keys(RANKING_METHODS), ...Object.keys(ESCAPE_METHODS)];
  const agree = {};
  for (const a of names) {
    agree[a] = {};
    for (const b of names) agree[a][b] = 0;
  }
  for (let t = 0; t < nRuns; t++) {
    const gen = generateModel(model, nVoters, cands, rng);
    let { profile, utilities } = gen;
    if (!utilities) {
      const m = cands.length;
      utilities = profile.map((r) => {
        const u = {};
        r.forEach((c, i) => {
          u[c] = (m - 1 - i) / (m - 1 || 1);
        });
        return u;
      });
    }
    const wins = {};
    for (const m of Object.keys(RANKING_METHODS)) wins[m] = RANKING_METHODS[m](profile, cands);
    for (const m of Object.keys(ESCAPE_METHODS)) wins[m] = ESCAPE_METHODS[m](utilities, cands);
    for (const a of names) {
      for (const b of names) {
        if (wins[a] === wins[b]) agree[a][b] += 1;
      }
    }
  }
  for (const a of names) {
    for (const b of names) agree[a][b] /= nRuns;
  }
  return { names, agree };
}

export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
