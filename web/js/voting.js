/** Voting methods and preference utilities. */

export const CANDS = ["A", "B", "C"];

export const MJ_GRADES = [
  "Rechazar",
  "Insuficiente",
  "Aceptable",
  "Bien",
  "Excelente",
];

/** Rankings as arrays: index 0 is most preferred. */
export function prefers(ranking, x, y) {
  return ranking.indexOf(x) < ranking.indexOf(y);
}

export function allRankings(cands = CANDS) {
  if (cands.length <= 1) return [cands.slice()];
  const out = [];
  for (let i = 0; i < cands.length; i++) {
    const rest = cands.slice(0, i).concat(cands.slice(i + 1));
    for (const r of allRankings(rest)) out.push([cands[i], ...r]);
  }
  return out;
}

export function pairwiseMargin(profile, x, y) {
  let n = 0;
  for (const r of profile) {
    if (prefers(r, x, y)) n += 1;
    else if (prefers(r, y, x)) n -= 1;
  }
  return n;
}

export function majorityPrefers(profile, x, y) {
  return pairwiseMargin(profile, x, y) > 0;
}

export function condorcetWinner(profile, cands = CANDS) {
  for (const x of cands) {
    if (cands.every((y) => x === y || majorityPrefers(profile, x, y))) return x;
  }
  return null;
}

export function plurality(profile, cands = CANDS) {
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const r of profile) scores[r[0]] += 1;
  return argmax(scores, cands);
}

export function borda(profile, cands = CANDS) {
  const m = cands.length;
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const r of profile) {
    r.forEach((c, i) => {
      scores[c] += m - 1 - i;
    });
  }
  return argmax(scores, cands);
}

export function minimax(profile, cands = CANDS) {
  const worst = Object.fromEntries(cands.map((c) => [c, -Infinity]));
  for (const x of cands) {
    let w = Infinity;
    for (const y of cands) {
      if (x === y) continue;
      w = Math.min(w, pairwiseMargin(profile, x, y));
    }
    worst[x] = w;
  }
  return argmax(worst, cands);
}

export function irv(profile, cands = CANDS) {
  let remaining = cands.slice();
  let ballots = profile.map((r) => r.filter((c) => remaining.includes(c)));
  while (remaining.length > 1) {
    const scores = Object.fromEntries(remaining.map((c) => [c, 0]));
    for (const r of ballots) {
      if (r.length) scores[r[0]] += 1;
    }
    const n = ballots.length;
    for (const c of remaining) {
      if (scores[c] > n / 2) return c;
    }
    let loser = remaining[0];
    for (const c of remaining) {
      if (scores[c] < scores[loser] || (scores[c] === scores[loser] && c < loser)) {
        loser = c;
      }
    }
    remaining = remaining.filter((c) => c !== loser);
    ballots = ballots.map((r) => r.filter((c) => c !== loser));
  }
  return remaining[0];
}

export function copeland(profile, cands = CANDS) {
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const x of cands) {
    for (const y of cands) {
      if (x === y) continue;
      const m = pairwiseMargin(profile, x, y);
      if (m > 0) scores[x] += 1;
      else if (m < 0) scores[x] -= 1;
    }
  }
  return argmax(scores, cands);
}

/** Tideman ranked pairs: lock strongest majority victories without cycles. */
export function rankedPairs(profile, cands = CANDS) {
  const pairs = [];
  for (let i = 0; i < cands.length; i++) {
    for (let j = 0; j < cands.length; j++) {
      if (i === j) continue;
      const m = pairwiseMargin(profile, cands[i], cands[j]);
      if (m > 0) pairs.push({ x: cands[i], y: cands[j], m });
    }
  }
  pairs.sort((a, b) => b.m - a.m || (a.x < b.x ? -1 : 1));
  const locked = new Set();
  const adj = Object.fromEntries(cands.map((c) => [c, []]));
  function reaches(from, to, seen = new Set()) {
    if (from === to) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return adj[from].some((n) => reaches(n, to, seen));
  }
  for (const { x, y } of pairs) {
    if (!reaches(y, x)) {
      adj[x].push(y);
      locked.add(`${x}>${y}`);
    }
  }
  const beatCount = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const c of cands) beatCount[c] = adj[c].length;
  // Source in the locked graph: most outgoing after topological preference
  const indeg = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const c of cands) for (const n of adj[c]) indeg[n] += 1;
  let best = cands[0];
  for (const c of cands) {
    if (
      indeg[c] < indeg[best] ||
      (indeg[c] === indeg[best] && beatCount[c] > beatCount[best]) ||
      (indeg[c] === indeg[best] && beatCount[c] === beatCount[best] && c < best)
    ) {
      best = c;
    }
  }
  return best;
}

export function approvalFromRanking(profile, cands = CANDS, k = null) {
  const thresh = k ?? Math.ceil(cands.length / 2);
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const r of profile) {
    for (let i = 0; i < Math.min(thresh, r.length); i++) scores[r[i]] += 1;
  }
  return argmax(scores, cands);
}

/** Score from ranking: same points as Borda (not a true escape). */
export function scoreFromRanking(profile, cands = CANDS) {
  return borda(profile, cands);
}

export function scoreFromUtilities(utilities, cands = CANDS) {
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const u of utilities) {
    for (const c of cands) scores[c] += u[c];
  }
  return argmax(scores, cands);
}

export function approvalFromUtilities(utilities, cands = CANDS, threshold = null) {
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const u of utilities) {
    const vals = cands.map((c) => u[c]);
    const thr = threshold ?? vals.reduce((a, b) => a + b, 0) / vals.length;
    for (const c of cands) if (u[c] >= thr) scores[c] += 1;
  }
  return argmax(scores, cands);
}

/** Discretize utilities in [0,1] (or any range) into MJ grade indices 0..4. */
export function gradesFromUtilities(utilities, cands = CANDS) {
  return utilities.map((u) => {
    const vals = cands.map((c) => u[c]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    const g = {};
    for (const c of cands) {
      const t = (u[c] - lo) / span;
      g[c] = Math.min(4, Math.floor(t * 5 - 1e-9));
      if (t >= 1) g[c] = 4;
    }
    return g;
  });
}

/**
 * Majority judgment: median grade, then usual-procedure-style tie-break
 * (remove one median grade from the leader's pile iteratively via +/- proportions).
 */
export function majorityJudgment(grades, cands = CANDS) {
  function medianGrade(arr) {
    const s = arr.slice().sort((a, b) => a - b);
    return s[Math.floor((s.length - 1) / 2)];
  }
  function gradeList(cand) {
    return grades.map((g) => g[cand]);
  }
  let remaining = cands.slice();
  while (remaining.length > 1) {
    const meds = Object.fromEntries(remaining.map((c) => [c, medianGrade(gradeList(c))]));
    let bestMed = Math.max(...remaining.map((c) => meds[c]));
    let contenders = remaining.filter((c) => meds[c] === bestMed);
    if (contenders.length === 1) return contenders[0];
    // Among contenders, compute p+ (share strictly above median) and p- (strictly below)
    const score = {};
    for (const c of contenders) {
      const list = gradeList(c);
      const m = meds[c];
      const above = list.filter((g) => g > m).length / list.length;
      const below = list.filter((g) => g < m).length / list.length;
      score[c] = above - below;
    }
    let best = contenders[0];
    for (const c of contenders) {
      if (score[c] > score[best] || (score[c] === score[best] && c < best)) best = c;
    }
    // If still tied on score, pick lexicographically smallest among max score
    const maxS = Math.max(...contenders.map((c) => score[c]));
    const top = contenders.filter((c) => score[c] === maxS).sort();
    return top[0];
  }
  return remaining[0];
}

/** STAR: score then automatic runoff between top two by score. */
export function starFromUtilities(utilities, cands = CANDS) {
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const u of utilities) for (const c of cands) scores[c] += u[c];
  const ordered = cands.slice().sort((a, b) => scores[b] - scores[a] || (a < b ? -1 : 1));
  const a = ordered[0];
  const b = ordered[1] ?? ordered[0];
  if (a === b) return a;
  let prefA = 0;
  let prefB = 0;
  for (const u of utilities) {
    if (u[a] > u[b]) prefA += 1;
    else if (u[b] > u[a]) prefB += 1;
  }
  if (prefA > prefB) return a;
  if (prefB > prefA) return b;
  return a < b ? a : b;
}

/** Ranking-only methods (Arrow frame / relax IIA). */
export const RANKING_METHODS = {
  plurality,
  borda,
  minimax,
  copeland,
  rankedPairs,
  irv,
  approvalRanking: approvalFromRanking,
  scoreRanking: scoreFromRanking,
};

/** Ballot / utility escapes (need utilities or grades). */
export const ESCAPE_METHODS = {
  approvalUtil: approvalFromUtilities,
  scoreUtil: scoreFromUtilities,
  majorityJudgment: (utilities, cands) =>
    majorityJudgment(gradesFromUtilities(utilities, cands), cands),
  star: starFromUtilities,
};

/** All callable as (profile, cands) OR for escapes we pass utilities via wrappers in sim. */
export const METHODS = { ...RANKING_METHODS };

export const METHOD_LABELS = {
  plurality: "Pluralidad",
  borda: "Borda",
  minimax: "Minimax",
  copeland: "Copeland",
  rankedPairs: "Ranked pairs",
  irv: "IRV",
  approvalRanking: "Approval (top-k ranking)",
  scoreRanking: "Score (desde ranking)",
  approvalUtil: "Approval (utilidades)",
  scoreUtil: "Score (utilidades)",
  majorityJudgment: "Majority judgment",
  star: "STAR",
};

export const METHOD_BLURBS = {
  plurality: "Solo mira el primer puesto. Spoiler clásico (rompe IIA).",
  borda: "Puntos por puesto. Ranking completo; viola IIA.",
  minimax: "Peor derrota pairwise. Suele respetar Condorcet.",
  copeland: "Victorias menos derrotas pairwise.",
  rankedPairs: "Bloquea victorias pairwise fuertes sin crear ciclos (Tideman).",
  irv: "Eliminación del último. Puede fallar monotonía e IIA.",
  approvalRanking: "Aprueba los top-k del ranking (sigue anclado al orden).",
  scoreRanking: "Puntajes inducidos del ranking (= Borda). No es escape real.",
  approvalUtil: "Aprueba según umbral sobre utilidades. Sale del input ranking.",
  scoreUtil: "Suma utilidades. Escape clásico del marco Arrow.",
  majorityJudgment: "Mediana de calificaciones ordinales. Boleta de juicios, no ranking.",
  star: "Score + runoff automático entre los dos mejores. Boleta numérica.",
};

export const METHOD_GROUP = {
  plurality: "ranking",
  borda: "ranking",
  minimax: "ranking",
  copeland: "ranking",
  rankedPairs: "ranking",
  irv: "ranking",
  approvalRanking: "ranking",
  scoreRanking: "ranking",
  approvalUtil: "escape",
  scoreUtil: "escape",
  majorityJudgment: "escape",
  star: "escape",
};

function argmax(scores, cands) {
  let best = cands[0];
  for (const c of cands) {
    if (scores[c] > scores[best] || (scores[c] === scores[best] && c < best)) best = c;
  }
  return best;
}

export function rankingFromUtilities(u, cands = CANDS) {
  return cands.slice().sort((a, b) => u[b] - u[a] || (a < b ? -1 : 1));
}
