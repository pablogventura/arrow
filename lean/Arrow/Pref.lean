/-!
# Preferences and profiles (three alternatives)
-/

namespace Arrow

inductive Cand where
  | A | B | C
  deriving DecidableEq, Repr, Inhabited

inductive Ranking where
  | abc | acb | bac | bca | cab | cba
  deriving DecidableEq, Repr, Inhabited

def Ranking.rank : Ranking → Cand → Nat
  | .abc, .A => 0 | .abc, .B => 1 | .abc, .C => 2
  | .acb, .A => 0 | .acb, .C => 1 | .acb, .B => 2
  | .bac, .B => 0 | .bac, .A => 1 | .bac, .C => 2
  | .bca, .B => 0 | .bca, .C => 1 | .bca, .A => 2
  | .cab, .C => 0 | .cab, .A => 1 | .cab, .B => 2
  | .cba, .C => 0 | .cba, .B => 1 | .cba, .A => 2

def Ranking.prefers (r : Ranking) (x y : Cand) : Prop :=
  r.rank x < r.rank y

instance (r : Ranking) (x y : Cand) : Decidable (r.prefers x y) :=
  inferInstanceAs (Decidable (_ < _))

theorem Ranking.prefers_irrefl (r : Ranking) (x : Cand) : ¬ r.prefers x x := by
  simp [Ranking.prefers]

theorem Ranking.prefers_asymm (r : Ranking) {x y : Cand}
    (h : r.prefers x y) : ¬ r.prefers y x := by
  simp [Ranking.prefers] at *; omega

theorem Ranking.prefers_total (r : Ranking) {x y : Cand} (hne : x ≠ y) :
    r.prefers x y ∨ r.prefers y x := by
  have : r.rank x ≠ r.rank y := by
    intro heq
    have : x = y := by
      cases r <;> cases x <;> cases y <;> simp [Ranking.rank] at heq ⊢
    exact hne this
  simp [Ranking.prefers]
  omega

theorem Ranking.prefers_trans (r : Ranking) {x y z : Cand}
    (hxy : r.prefers x y) (hyz : r.prefers y z) : r.prefers x z := by
  simp [Ranking.prefers] at *; omega

def Ranking.top : Ranking → Cand
  | .abc | .acb => .A
  | .bac | .bca => .B
  | .cab | .cba => .C

/-- The candidate distinct from two distinct ones. -/
def Cand.third : Cand → Cand → Cand
  | .A, .B | .B, .A => .C
  | .A, .C | .C, .A => .B
  | .B, .C | .C, .B => .A
  | .A, .A | .B, .B | .C, .C => .A

def Ranking.chain : Cand → Cand → Cand → Ranking
  | .A, .B, .C => .abc
  | .A, .C, .B => .acb
  | .B, .A, .C => .bac
  | .B, .C, .A => .bca
  | .C, .A, .B => .cab
  | .C, .B, .A => .cba
  | .A, .B, .A => .abc | .A, .A, .B => .abc | .A, .A, .C => .abc
  | .A, .C, .A => .abc | .A, .C, .C => .abc | .A, .A, .A => .abc | .A, .B, .B => .abc
  | .B, .A, .A => .bac | .B, .A, .B => .bac | .B, .B, .A => .bac | .B, .B, .C => .bac
  | .B, .C, .B => .bca | .B, .C, .C => .bca | .B, .B, .B => .bac
  | .C, .A, .A => .cab | .C, .A, .C => .cab | .C, .B, .B => .cba | .C, .B, .C => .cba
  | .C, .C, .A => .cab | .C, .C, .B => .cba | .C, .C, .C => .cab

theorem Ranking.chain_xy {x y z : Cand} (hxy : x ≠ y) (hyz : y ≠ z) (hxz : x ≠ z) :
    (Ranking.chain x y z).prefers x y := by
  cases x <;> cases y <;> cases z <;> simp [Ranking.chain, Ranking.prefers, Ranking.rank] at *

theorem Ranking.chain_yz {x y z : Cand} (hxy : x ≠ y) (hyz : y ≠ z) (hxz : x ≠ z) :
    (Ranking.chain x y z).prefers y z := by
  cases x <;> cases y <;> cases z <;> simp [Ranking.chain, Ranking.prefers, Ranking.rank] at *

theorem Ranking.chain_xz {x y z : Cand} (hxy : x ≠ y) (hyz : y ≠ z) (hxz : x ≠ z) :
    (Ranking.chain x y z).prefers x z := by
  cases x <;> cases y <;> cases z <;> simp [Ranking.chain, Ranking.prefers, Ranking.rank] at *

def Profile (n : Nat) := Fin n → Ranking

def SWF (n : Nat) := Profile n → Ranking

def Profile.unanimousPref {n : Nat} (P : Profile n) (x y : Cand) : Prop :=
  ∀ i : Fin n, (P i).prefers x y

def Profile.agreeOnPair {n : Nat} (P Q : Profile n) (x y : Cand) : Prop :=
  ∀ i : Fin n, (P i).prefers x y ↔ (Q i).prefers x y

end Arrow
