import Arrow.Axioms

/-!
# General Arrow statement (documented residual)

The pedagogical modules check definitions, dictatorship, an IIA violation, and
the canonical Condorcet cycle. The classical theorem for every `n ≥ 2` is
recorded here as a named residual so the article can cite a precise Lean
proposition without pretending the full pivotal-voter argument is finished.
-/

namespace Arrow.General

open Arrow

/-- Residual: Arrow's impossibility for three alternatives and `n ≥ 2` voters.

Proof strategy (Yu 2012, one-shot pivotal voter):

1. Swap `A` and `B` voter by voter starting from unanimous `A > B`; the first
   voter who flips the social order is `(A,B)`-pivotal.
2. With a third alternative `C`, that pivot dictates every pair involving `A`.
3. All pair-pivots coincide, yielding a single dictator.
4. Hence `Unanimity ∧ IIA → ¬ NonDictatorial`.

References: Yu (2012); Geanakoplos (2005); Barberà (1980).
Public Lean developments with complete proofs include ChihChengLiang/arrow
and DominikPeters/SocialChoiceLean (cited in `docs/bibliografia.md`). -/
axiom no_arrow_conditions {n : Nat} (hn : 2 ≤ n) (f : SWF n) :
    ¬ ArrowConditions f

/-- Same statement packaged as the impossibility theorem. -/
theorem impossibility {n : Nat} (hn : 2 ≤ n) (f : SWF n) :
    ¬ ArrowConditions f :=
  no_arrow_conditions hn f

/-- Corollary used from `Finite3`. -/
theorem two_voters (f : SWF 2) : ¬ ArrowConditions f :=
  impossibility (by decide) f

end Arrow.General
