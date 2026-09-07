import Arrow.Pref

/-!
# Arrow axioms
-/

namespace Arrow

def Unanimity {n : Nat} (f : SWF n) : Prop :=
  ∀ (P : Profile n) (x y : Cand),
    P.unanimousPref x y → (f P).prefers x y

def IIA {n : Nat} (f : SWF n) : Prop :=
  ∀ (P Q : Profile n) (x y : Cand),
    P.agreeOnPair Q x y →
      ((f P).prefers x y ↔ (f Q).prefers x y)

def IsDictator {n : Nat} (f : SWF n) (d : Fin n) : Prop :=
  ∀ (P : Profile n) (x y : Cand),
    (P d).prefers x y → (f P).prefers x y

def NonDictatorial {n : Nat} (f : SWF n) : Prop :=
  ∀ d : Fin n, ¬ IsDictator f d

def ArrowConditions {n : Nat} (f : SWF n) : Prop :=
  Unanimity f ∧ IIA f ∧ NonDictatorial f

def dictatorialSWF (n : Nat) (d : Fin n) : SWF n := fun P => P d

theorem dictatorial_unanimity (n : Nat) (d : Fin n) :
    Unanimity (dictatorialSWF n d) := fun _ _ _ h => h d

theorem dictatorial_iia (n : Nat) (d : Fin n) :
    IIA (dictatorialSWF n d) := fun _ _ _ _ hAgree => hAgree d

theorem dictatorial_isDictator (n : Nat) (d : Fin n) :
    IsDictator (dictatorialSWF n d) d := fun _ _ _ h => h

end Arrow
