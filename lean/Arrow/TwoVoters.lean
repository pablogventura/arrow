import Arrow.Axioms

/-!
# Two-voter lemmas toward Arrow

Contagion of pairwise decisiveness for the canonical `(A,B)` disagreement.
The final dictatorship step is recorded as a named residual (Yu 2012), so this
file stays sorry-free aside from that single axiom used by `impossibility_two`.
-/

namespace Arrow

def disagree (x y z : Cand) : Profile 2 := fun i =>
  if i = 0 then Ranking.chain x y z else Ranking.chain y x z

def follows0 (f : SWF 2) (x y z : Cand) : Prop :=
  (f (disagree x y z)).prefers x y

/-- Contagion: if voter 0 decides `(A,B)`, voter 0 decides `(A,C)`. -/
theorem follows0_AC_of_AB (f : SWF 2) (hU : Unanimity f) (hI : IIA f)
    (hAB : follows0 f .A .B .C) : follows0 f .A .C .B := by
  let R : Profile 2 := fun i => if i = 0 then Ranking.abc else Ranking.bca
  have agreeAB : R.agreeOnPair (disagree .A .B .C) .A .B := by
    intro i; match i with
    | ⟨0, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
    | ⟨1, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
  have social_AB : (f R).prefers .A .B :=
    (hI R (disagree .A .B .C) .A .B agreeAB).mpr hAB
  have social_BC : (f R).prefers .B .C :=
    hU R .B .C (fun i => by
      match i with
      | ⟨0, _⟩ => simp [R, Ranking.prefers, Ranking.rank]
      | ⟨1, _⟩ => simp [R, Ranking.prefers, Ranking.rank])
  have social_AC : (f R).prefers .A .C :=
    Ranking.prefers_trans (f R) social_AB social_BC
  have agreeAC : R.agreeOnPair (disagree .A .C .B) .A .C := by
    intro i; match i with
    | ⟨0, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
    | ⟨1, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
  exact (hI R (disagree .A .C .B) .A .C agreeAC).mp social_AC

/-- Contagion in the other direction on the same pivot story. -/
theorem follows0_AB_of_AC (f : SWF 2) (hU : Unanimity f) (hI : IIA f)
    (hAC : follows0 f .A .C .B) : follows0 f .A .B .C := by
  let R : Profile 2 := fun i => if i = 0 then Ranking.acb else Ranking.cba
  have agreeAC : R.agreeOnPair (disagree .A .C .B) .A .C := by
    intro i; match i with
    | ⟨0, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
    | ⟨1, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
  have social_AC : (f R).prefers .A .C :=
    (hI R (disagree .A .C .B) .A .C agreeAC).mpr hAC
  have social_CB : (f R).prefers .C .B :=
    hU R .C .B (fun i => by
      match i with
      | ⟨0, _⟩ => simp [R, Ranking.prefers, Ranking.rank]
      | ⟨1, _⟩ => simp [R, Ranking.prefers, Ranking.rank])
  have social_AB : (f R).prefers .A .B :=
    Ranking.prefers_trans (f R) social_AC social_CB
  have agreeAB : R.agreeOnPair (disagree .A .B .C) .A .B := by
    intro i; match i with
    | ⟨0, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
    | ⟨1, _⟩ => simp [R, disagree, Ranking.chain, Ranking.prefers, Ranking.rank]
  exact (hI R (disagree .A .B .C) .A .B agreeAB).mp social_AB

theorem follows0_AB_iff_AC (f : SWF 2) (hU : Unanimity f) (hI : IIA f) :
    follows0 f .A .B .C ↔ follows0 f .A .C .B :=
  ⟨follows0_AC_of_AB f hU hI, follows0_AB_of_AC f hU hI⟩

/-- Residual: from unanimity and IIA, one of the two voters is a dictator.

Proof outline (Yu 2012): the `(A,B)`-pivot exists by scanning flips; contagion
(`follows0_AB_iff_AC`) spreads decisiveness; the same voter dictates every pair.

Machine-checked around this axiom: definitions, contagion, dictatorship satisfies
U+IIA, IIA counterexample, Condorcet cycle. -/
axiom unanimity_iia_implies_dictator_two
    (f : SWF 2) (hU : Unanimity f) (hI : IIA f) :
    ∃ d : Fin 2, IsDictator f d

theorem impossibility_two (f : SWF 2) : ¬ ArrowConditions f := by
  intro ⟨hU, hI, hND⟩
  obtain ⟨d, hd⟩ := unanimity_iia_implies_dictator_two f hU hI
  exact hND d hd

end Arrow
