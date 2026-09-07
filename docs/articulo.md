# Agregar preferencias: el teorema de Arrow, Lean y simulaciones

## 1. El problema

Un grupo tiene que elegir. Cada persona ordena las opciones: candidatas a un cargo, proyectos de un presupuesto, sabores de helado. ¿Cómo pasar de muchos rankings individuales a una decisión colectiva?

La intuición dice que debería existir un procedimiento "justo". Kenneth Arrow demostró en 1951 que, bajo un diseño preciso (rankings estrictos, una función que produce un ranking social, y tres axiomas razonables), esa esperanza choca con un teorema de imposibilidad cuando hay al menos tres alternativas.

Este texto no pretende asustar con la frase "la democracia es imposible". El teorema acota un marco. Fuera de ese marco hay métodos útiles; dentro, hay tensiones inevitables. Acá combinamos tres formas de mirar el mismo hecho:

1. Una explicación en prosa para lectores cultos.
2. Definiciones y comprobaciones en Lean 4 (`lean/`).
3. Simulaciones en el [sitio](../web/index.html) para ver cómo se comportan pluralidad, Borda, minimax, IRV, approval y score.

## 2. El modelo

Fijemos un conjunto de candidatos, digamos `{A, B, C}`. Cada votante entrega un **ranking** estricto: un orden total. Un **perfil** es la lista de rankings de todos los votantes.

Una **función de bienestar social** (social welfare function, SWF) toma un perfil y devuelve un ranking social. No solo elige un ganador: ordena todas las alternativas.

Eso ya es una decisión de diseño. Muchas elecciones reales solo necesitan un ganador. Arrow estudia el caso más exigente: un orden social completo.

## 3. Tres axiomas

### Unanimidad (Pareto débil)

Si todo el mundo prefiere `X` a `Y`, el ranking social también lo hace. Si nadie defiende lo contrario, la sociedad no debería inventar un gusto colectivo disidente.

### Independencia de alternativas irrelevantes (IIA)

La comparación social entre `X` e `Y` solo depende de cómo cada votante compara `X` e `Y`. Si alguien cambia de opinión sobre un tercero `Z`, eso no debería dar vuelta el veredicto entre `X` e `Y`.

IIA es el axioma más discutido. Suena limpio, pero elimina mucha información que métodos como Borda usan (los puntajes relativos).

### No dictadura

No hay un votante cuya preferencia estricta se copie siempre al ranking social, pase lo que pase con el resto.

## 4. Qué dice Arrow (y qué no)

**Teorema (Arrow, versión estricta para rankings).** Con al menos tres candidatos y al menos dos votantes, no existe una SWF que cumpla unanimidad, IIA y no dictadura a la vez.

Qué **no** dice:

- No dice que votar sea inútil.
- No dice que todo método sea igual de malo.
- No prohíbe elegir un solo ganador con reglas que relajan IIA, o que no producen un orden social completo, o que usan boletas que no son rankings (approval, puntajes).

La lectura útil: si pedís demasiadas virtudes a la vez en el marco ranking-SWF, el sistema se rompe. Entonces hay que elegir qué virtudes priorizar.

## 5. Puente a Lean

En `lean/Arrow/` formalizamos candidatos, los seis rankings posibles sobre tres alternativas, perfiles y SWF.

- `Pref.lean` y `Axioms.lean`: el vocabulario (unanimidad, IIA, dictador).
- `Finite3.lean`: comprobamos que la dictadura cumple unanimidad e IIA, y que una regla "con spoiler" viola IIA (ejemplo mecánico del axioma).
- `Canonical.lean`: el perfil de cinco votantes con ciclo de Condorcet `A>B`, `B>C`, `C>A`, el mismo escenario que carga el botón **Canónico** del sitio.
- `General.lean`: el enunciado clásico `no ArrowConditions` para todo `n >= 2`, dejado como **residual documentado** (estrategia del votante pivotal, Yu 2012). El artículo no finge que esa prueba larga ya está cerrada en la máquina; sí deja el enunciado preciso para seguir formalizando.

Compilar:

```bash
cd lean && lake build
```

## 6. Métodos que relajan algo

| Método | Idea | Qué suele soltar |
|--------|------|------------------|
| Pluralidad | Solo cuenta el primero | IIA (efecto spoiler) |
| Borda | Puntos según el puesto | IIA |
| Minimax | Minimiza la peor derrota pairwise | A veces otras propiedades Condorcet |
| IRV | Eliminación del último | IIA; monotonicidad en algunos casos |
| Approval | Aprobar un subconjunto | Sale del marco ranking puro |
| Score / range | Puntajes numéricos | Sale del marco ranking puro |

Approval y score no son contraejemplos de Arrow: cambian el tipo de boleta. Por eso el sitio los incluye como **escapes**, no como refutaciones.

## 7. Simulaciones: cómo medimos "voluntad"

No hay un utilitarismo objetivo escondido detrás de Arrow. Para comparar métodos igual usamos proxies honestos:

1. **Eficiencia de Condorcet**: cuando existe un candidato que gana todos los mano a mano, ¿lo elige el método?
2. **Regret utilitario**: en un modelo espacial 1D (votantes y candidatos en una recta), cada uno tiene utilidades latentes; medimos cuánto se pierde frente al maximizador de la suma.
3. **Estrés tipo IIA**: agregamos un candidato spoiler al final de los rankings y vemos si cambia el ganador entre los originales.
4. **Top mayoritario**: ¿el ganador vence a todos por mayoría pairwise?

El modelo **impartial culture** sortea rankings uniformes (duro, poco realista). El **espacial 1D** es más interpretable para "voluntad del grupo" en un eje izquierda-derecha o similar.

Nada de eso "demuestra" cuál método es el correcto. Sí muestra trade-offs visibles: por ejemplo, minimax suele ir bien en Condorcet; pluralidad sufre spoilers; approval/score con utilidades latentes pueden bajar el regret porque usan más información.

## 8. El escenario canónico

Cinco votantes:

1. A > B > C  
2. A > B > C  
3. B > C > A  
4. B > C > A  
5. C > A > B  

Mayoría: A vence a B (3-2), B vence a C (4-1), C vence a A (3-2). Hay ciclo: no hay ganador de Condorcet. Pluralidad empata A y B en primeros puestos (2 cada uno). Distintos métodos desempatan distinto. Es el laboratorio mínimo donde se siente la tensión que el teorema vuelve inevitable en el caso general.

## 9. Cierre

Arrow no cierra el debate político: lo organiza. Obliga a declarar el marco (qué boleta, qué salida, qué axiomas) y a aceptar que el diseño tiene costos.

La formalización en Lean obliga a no mezclar definiciones. La simulación obliga a mirar magnitudes, no solo existencias. Juntas son una buena mesa de trabajo para estudiar agregación de preferencias sin magia ni cinismo.

## Lecturas

Ver [bibliografia.md](bibliografia.md).
