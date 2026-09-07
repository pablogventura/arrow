import Arrow.Pref

/-!
# Canonical Condorcet cycle (shared with the web demo)
-/

namespace Arrow.Canonical

open Arrow

/-- Five voters, three candidates: a Condorcet cycle used in the article and UI. -/
def voterRankings : Profile 5 := fun
  | ⟨0, _⟩ => Ranking.abc
  | ⟨1, _⟩ => Ranking.abc
  | ⟨2, _⟩ => Ranking.bca
  | ⟨3, _⟩ => Ranking.bca
  | ⟨4, _⟩ => Ranking.cab

def countPref (P : Profile 5) (x y : Cand) : Nat :=
  (if (P ⟨0, by decide⟩).prefers x y then 1 else 0) +
  (if (P ⟨1, by decide⟩).prefers x y then 1 else 0) +
  (if (P ⟨2, by decide⟩).prefers x y then 1 else 0) +
  (if (P ⟨3, by decide⟩).prefers x y then 1 else 0) +
  (if (P ⟨4, by decide⟩).prefers x y then 1 else 0)

theorem cycle_AB : countPref voterRankings .A .B = 3 := by native_decide
theorem cycle_BA : countPref voterRankings .B .A = 2 := by native_decide
theorem cycle_BC : countPref voterRankings .B .C = 4 := by native_decide
theorem cycle_CB : countPref voterRankings .C .B = 1 := by native_decide
theorem cycle_CA : countPref voterRankings .C .A = 3 := by native_decide
theorem cycle_AC : countPref voterRankings .A .C = 2 := by native_decide

theorem top0 : (voterRankings ⟨0, by decide⟩).top = .A := by native_decide
theorem top2 : (voterRankings ⟨2, by decide⟩).top = .B := by native_decide
theorem top4 : (voterRankings ⟨4, by decide⟩).top = .C := by native_decide

end Arrow.Canonical
