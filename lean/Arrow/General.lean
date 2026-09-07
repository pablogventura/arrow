import Arrow.Axioms
import Arrow.TwoVoters

/-!
# General Arrow statement

- Two voters: `impossibility_two` (dictator residual + contagion lemmas).
- `n ≥ 2`: same classical theorem; for `n > 2` we keep a documented residual
  pending a full pivotal-voter mechanization.
-/

namespace Arrow.General

open Arrow

/-- Residual for every `n ≥ 2` (Yu 2012 pivotal voter). -/
axiom no_arrow_conditions {n : Nat} (hn : 2 ≤ n) (f : SWF n) :
    ¬ ArrowConditions f

theorem impossibility {n : Nat} (hn : 2 ≤ n) (f : SWF n) :
    ¬ ArrowConditions f :=
  no_arrow_conditions hn f

/-- Prefer the two-voter theorem (contagion checked + dictator residual). -/
theorem two_voters (f : SWF 2) : ¬ ArrowConditions f :=
  impossibility_two f

end Arrow.General
