import Arrow.Axioms
import Arrow.General

/-!
# Finite case: dictatorship works; a concrete rule breaks IIA
-/

namespace Arrow

/-- A rule that looks at whether anyone ranks `A` first to decide `B` vs `C`.
Intentionally violates IIA (used only as a checked counterexample). -/
def spoilerSWF : SWF 2 := fun P =>
  if (P 0).top = Cand.A || (P 1).top = Cand.A then
    Ranking.abc  -- A>B>C, so B>C
  else
    Ranking.cba  -- C>B>A, so C>B

def profilePair1 : Profile 2 := fun
  | ⟨0, _⟩ => Ranking.bac  -- top B, prefers B>C
  | ⟨1, _⟩ => Ranking.bac

def profilePair2 : Profile 2 := fun
  | ⟨0, _⟩ => Ranking.abc  -- top A, prefers B>C
  | ⟨1, _⟩ => Ranking.abc

theorem profiles_agree_on_BC :
    profilePair1.agreeOnPair profilePair2 .B .C := by
  intro i
  match i with
  | ⟨0, _⟩ => simp [profilePair1, profilePair2, Ranking.prefers, Ranking.rank]
  | ⟨1, _⟩ => simp [profilePair1, profilePair2, Ranking.prefers, Ranking.rank]

theorem spoiler_not_BC_pair1 :
    ¬ (spoilerSWF profilePair1).prefers .B .C := by
  native_decide

theorem spoiler_BC_pair2 :
    (spoilerSWF profilePair2).prefers .B .C := by
  native_decide

theorem spoiler_violates_IIA : ¬ IIA spoilerSWF := by
  intro hI
  have h := hI profilePair1 profilePair2 .B .C profiles_agree_on_BC
  have h2 := spoiler_BC_pair2
  have h1 := spoiler_not_BC_pair1
  exact h1 (h.mpr h2)

example (d : Fin 2) :
    Unanimity (dictatorialSWF 2 d) ∧ IIA (dictatorialSWF 2 d) :=
  ⟨dictatorial_unanimity 2 d, dictatorial_iia 2 d⟩

theorem two_axioms_possible :
    ∃ f : SWF 2, Unanimity f ∧ IIA f :=
  ⟨dictatorialSWF 2 0, dictatorial_unanimity 2 0, dictatorial_iia 2 0⟩

theorem three_axioms_impossible (f : SWF 2) : ¬ ArrowConditions f :=
  General.two_voters f

end Arrow
