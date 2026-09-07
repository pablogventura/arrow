/** Voting methods and preference utilities. */

export const CANDS = ["A", "B", "C"];

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

/** Minimax: minimize the worst pairwise defeat. */
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

/** Approval: approve top `k` candidates (default ceil(m/2)). */
export function approval(profile, cands = CANDS, k = null) {
  const thresh = k ?? Math.ceil(cands.length / 2);
  const scores = Object.fromEntries(cands.map((c) => [c, 0]));
  for (const r of profile) {
    for (let i = 0; i < Math.min(thresh, r.length); i++) scores[r[i]] += 1;
  }
  return argmax(scores, cands);
}

/** Score/range from ranking: top gets m-1, ..., bottom 0 (same points as Borda).
 * Distinct from Borda only when ballots carry free scores; here we use ranking-induced scores
 * so the demo stays comparable, and note the escape in the article. */
export function scoreFromRanking(profile, cands = CANDS) {
  return borda(profile, cands);
}

/** True score voting when each voter supplies numeric utilities. */
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

export const METHODS = {
  plurality,
  borda,
  minimax,
  irv,
  approval,
  score: scoreFromRanking,
};

export const METHOD_LABELS = {
  plurality: "Pluralidad",
  borda: "Borda",
  minimax: "Minimax",
  irv: "IRV",
  approval: "Approval",
  score: "Score (via ranking)",
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
