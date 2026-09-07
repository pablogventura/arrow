/** Preference generation and Monte Carlo metrics. */

import {
  CANDS,
  METHODS,
  METHOD_LABELS,
  allRankings,
  condorcetWinner,
  majorityPrefers,
  rankingFromUtilities,
  scoreFromUtilities,
  approvalFromUtilities,
} from "./voting.js";

export { METHOD_LABELS };

/** Canonical Condorcet cycle (matches Lean Canonical.voterRankings). */
export const CANONICAL_PROFILE = [
  ["A", "B", "C"],
  ["A", "B", "C"],
  ["B", "C", "A"],
  ["B", "C", "A"],
  ["C", "A", "B"],
];

export function impartialCulture(nVoters, cands = CANDS, rng = Math.random) {
  const ranks = allRankings(cands);
  const profile = [];
  for (let i = 0; i < nVoters; i++) {
    profile.push(ranks[Math.floor(rng() * ranks.length)].slice());
  }
  return profile;
}

/** 1D spatial model: candidates and voters on a line; utility = -distance. */
export function spatial1D(nVoters, cands = CANDS, rng = Math.random) {
  const candPos = {};
  cands.forEach((c, i) => {
    candPos[c] = (i + 1) / (cands.length + 1) + (rng() - 0.5) * 0.05;
  });
  const utilities = [];
  const profile = [];
  for (let i = 0; i < nVoters; i++) {
    const v = rng();
    const u = {};
    for (const c of cands) u[c] = -Math.abs(v - candPos[c]);
    utilities.push(u);
    profile.push(rankingFromUtilities(u, cands));
  }
  return { profile, utilities, candPos };
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

/** IIA stress: insert a spoiler candidate in a strong position for some voters. */
export function iiaStress(profile, methodFn, cands = CANDS) {
  const base = methodFn(profile, cands);
  const extra = "S";
  const extendedCands = cands.concat([extra]);
  const extended = profile.map((r, idx) => {
    const copy = r.slice();
    // Half the electorate ranks the spoiler second; others put it last.
    if (idx % 2 === 0 && copy.length >= 1) {
      copy.splice(1, 0, extra);
    } else {
      copy.push(extra);
    }
    return copy;
  });
  const winExt = methodFn(extended, extendedCands);
  if (winExt === extra) return { changed: false, base, winExt };
  return { changed: winExt !== base, base, winExt };
}

export function runElection(profile, utilities = null, cands = CANDS) {
  const results = {};
  for (const [name, fn] of Object.entries(METHODS)) {
    results[name] = fn(profile, cands);
  }
  if (utilities) {
    results.scoreUtil = scoreFromUtilities(utilities, cands);
    results.approvalUtil = approvalFromUtilities(utilities, cands);
  }
  results.condorcet = condorcetWinner(profile, cands);
  if (utilities) results.utilitarian = utilitarianWinner(utilities, cands);
  return results;
}

export function monteCarlo({
  nRuns = 200,
  nVoters = 25,
  model = "spatial",
  cands = CANDS,
  rng = Math.random,
} = {}) {
  const methodNames = Object.keys(METHODS);
  const stats = {};
  for (const m of methodNames) {
    stats[m] = {
      condorcetHits: 0,
      condorcetOpps: 0,
      regretSum: 0,
      regretN: 0,
      iiaChanges: 0,
      majorityTop: 0,
    };
  }

  for (let t = 0; t < nRuns; t++) {
    let profile;
    let utilities = null;
    if (model === "ic") {
      profile = impartialCulture(nVoters, cands, rng);
    } else {
      const s = spatial1D(nVoters, cands, rng);
      profile = s.profile;
      utilities = s.utilities;
    }
    const cw = condorcetWinner(profile, cands);
    for (const m of methodNames) {
      const w = METHODS[m](profile, cands);
      if (cw !== null) {
        stats[m].condorcetOpps += 1;
        if (w === cw) stats[m].condorcetHits += 1;
      }
      if (utilities) {
        stats[m].regretSum += utilitarianRegret(utilities, w, cands);
        stats[m].regretN += 1;
      }
      const stress = iiaStress(profile, METHODS[m], cands);
      if (stress.changed) stats[m].iiaChanges += 1;
      // majority agreement: winner beats every other by majority?
      if (cands.every((y) => y === w || majorityPrefers(profile, w, y))) {
        stats[m].majorityTop += 1;
      }
    }
  }

  const summary = {};
  for (const m of methodNames) {
    const s = stats[m];
    summary[m] = {
      condorcetEfficiency: s.condorcetOpps ? s.condorcetHits / s.condorcetOpps : null,
      meanRegret: s.regretN ? s.regretSum / s.regretN : null,
      iiaChangeRate: s.iiaChanges / nRuns,
      majorityTopRate: s.majorityTop / nRuns,
    };
  }
  return summary;
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
