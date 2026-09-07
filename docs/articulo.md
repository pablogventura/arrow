# El spoiler no es un bug raro

Hay una escena que se repite en cada elección con más de dos opciones serias. Aparece un tercero. No gana. Pero alcanza para dar vuelta el resultado entre los otros dos. La bronca pública habla de "votos robados", de "el sistema está roto". Kenneth Arrow, en 1951, mostró algo más incómodo: bajo un diseño preciso, **no existe** una regla que agregue rankings individuales en un ranking colectivo y cumpla a la vez tres virtudes que suenan obvias.

Eso no dice que "la democracia es imposible". Dice que ese combo de exigencias no entra en una sola máquina. El resto es diseño: qué virtudes priorizar, y con qué tipo de boleta.

Podés jugarlo acá: [simulaciones Arrow](https://pablogventura.github.io/arrow/).

## Tres virtudes que no conviven

Imagina candidatos A, B y C. Cada persona entrega un orden estricto. Una **función de bienestar social** no solo elige un ganador: ordena a todos.

Pedimos:

1. **Unanimidad.** Si todo el mundo prefiere X a Y, el orden social también.
2. **Independencia de alternativas irrelevantes (IIA).** El veredicto entre X e Y solo depende de cómo cada quien compara X e Y. Un tercero Z no debería dar vuelta esa pelea.
3. **No dictadura.** Nadie tiene veto permanente: su gusto no se copia siempre al ranking social.

**Teorema de Arrow.** Con al menos tres candidatos y al menos dos votantes, no hay regla que cumpla las tres a la vez.

IIA es la más discutida. Suena limpia. También es la que castiga a métodos como Borda, que usan todo el ranking. El spoiler de la pluralidad es, en buena medida, IIA rompiéndose en público.

## Un laboratorio mínimo

Cinco votantes, tres candidatos:

1. A > B > C  
2. A > B > C  
3. B > C > A  
4. B > C > A  
5. C > A > B  

Mano a mano: A vence a B, B vence a C, C vence a A. **Ciclo de Condorcet**: no hay alguien que gane todos los duelos. Pluralidad mira solo el primero (dos A, dos B, un C) y desempatar ya es política disfrazada de aritmética. Borda, minimax, Copeland e IRV responden distinto porque leen el mismo perfil con otra pregunta.

En el sitio, el botón **Canónico** carga exactamente ese perfil (el mismo que verifica el código Lean del proyecto).

## Qué hacen los métodos (y qué sueltan)

| Método | Pregunta que hace | Qué suele soltar |
|--------|-------------------|------------------|
| Pluralidad | Quién tiene más primeros | IIA (spoiler) |
| Borda | Cuántos puntos por puesto | IIA |
| Minimax / Copeland | Cómo les va mano a mano | Otras propiedades, según el caso |
| IRV | Eliminar al último de a uno | IIA; a veces monotonía |
| Approval | A quién apruebo | Sale del marco ranking puro |
| Score | Qué puntaje le pongo | Sale del marco ranking puro |

Approval y score **no refutan** Arrow: cambian la boleta. Por eso en el interactivo hay un botón **Utilidades (escape)**: mismas personas, pero approval/score leen números, no solo el orden.

## Números, no magia

En un modelo espacial 1D (votantes y candidatos en una recta; 200 corridas, 25 votantes, semilla 7) se ve el trade-off típico:

| Método | Eficiencia Condorcet | Regret medio | Cambio tipo IIA |
|--------|---------------------:|-------------:|----------------:|
| Pluralidad | 28.5% | 0.73 | 0% |
| Borda | 91% | 0.01 | 18% |
| Minimax | 100% | 0.01 | 0.5% |
| Copeland | 100% | 0.01 | 0% |
| IRV | 49.5% | 0.53 | 0% |
| Approval | 82.5% | 0.06 | 15.5% |
| Score (via ranking) | 91% | 0.01 | 18% |

Métodos tipo Condorcet (minimax, Copeland, Borda) clavan alto cuando existe ganador de Condorcet y bajan el regret utilitario; pluralidad e IRV sufren más. No hay "voluntad verdadera" escondida: hay proxies. El valor está en ver magnitudes.

Detalle reproducible en el repo (`results/spatial_seed7_n200.csv`) y en el panel Monte Carlo del sitio.

## Una prueba que se puede chequear

Además del texto y las simulaciones, el proyecto formaliza en Lean 4 el vocabulario (preferencias, axiomas), muestra que la dictadura salva unanimidad e IIA, exhibe una regla que viola IIA, y fija el ciclo canónico. La imposibilidad clásica (Yu 2012: votante pivotal) está enunciada; la contagión pairwise para dos votantes está chequeada; el paso final a dictador sigue como residual documentado. No es postureo de "todo demostrado en la máquina": es un puente entre divulgación y formalización.

Código: [github.com/pablogventura/arrow](https://github.com/pablogventura/arrow).

## Cierre

Arrow no cierra el debate: lo organiza. Obliga a declarar el marco (qué boleta, qué salida, qué axiomas) y a aceptar costos. El spoiler deja de ser un accidente moral y pasa a ser un síntoma de diseño.

Si querés pelearte con el teorema, mejor hacerlo con las manos en un perfil concreto que con un slogan.

---

Pablo Ventura (FaMAF). Lecturas: Arrow (1951); Geanakoplos (2005); Yu (2012). Ver [bibliografia.md](bibliografia.md).
