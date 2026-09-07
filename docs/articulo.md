# El spoiler no es un bug raro

Hay una escena que se repite en cada elección con más de dos opciones serias. Dos candidaturas se pelean el centro. Aparece un tercero, cercano a una de ellas. No gana. A veces ni llega lejos. Pero alcanza para partir el voto de un bando y entregar la victoria al otro. La bronca pública habla de "votos robados", de "el sistema está roto", de traiciones tácticas. Kenneth Arrow, en 1951, mostró algo más incómodo y más preciso: bajo un diseño concreto, **no existe** una regla que tome los rankings de cada persona, produzca un ranking colectivo, y cumpla a la vez tres virtudes que suenan de sentido común.

Eso no dice que "la democracia es imposible". Dice que ese combo de exigencias no entra en una sola máquina. El resto es diseño: qué virtudes priorizar, qué tipo de boleta usar, y qué estamos dispuestos a sacrificar.

Esta nota tiene tres capas que se miran entre sí:

1. Una explicación del teorema sin jerga de entrada.
2. Un [sitio interactivo](https://pablogventura.github.io/arrow/) para romper perfiles con las manos.
3. Un puente a una formalización en Lean 4 (código que una máquina puede verificar), con honestidad sobre qué está cerrado y qué no.

Si preferís empezar jugando: abrí el sitio, tocá **Canónico**, y recién después volvé al texto.

## Qué problema estamos resolviendo

Un grupo tiene que decidir. Cada persona ordena las opciones: candidatas a un cargo, proyectos de un presupuesto, sabores de helado, papers que merecen un premio. La pregunta ingenua es: ¿cómo pasar de muchos órdenes individuales a una decisión colectiva "justa"?

La intuición dice que debería existir un procedimiento decente. Contamos, sumamos, eliminamos al último, premiamos segundos puestos. Arrow estudia una versión exigente del problema: no solo elegir un ganador, sino producir un **ranking social completo**. Quién queda primero, segundo, tercero. Eso se llama **función de bienestar social** (social welfare function, SWF).

Esa exigencia ya es una decisión de diseño. Muchas elecciones reales solo necesitan un ganador. Arrow mira el caso más fuerte: un orden colectivo sobre todas las alternativas. Si ni siquiera ahí se pueden sostener tres axiomas a la vez, el mensaje es estructural, no anecdótico.

Fijemos notación mínima. Hay candidatos, digamos `{A, B, C}`. Cada votante entrega un **ranking** estricto: un orden total sin empates. Un **perfil** es la lista de rankings de todos. La SWF toma un perfil y devuelve un ranking social.

## Tres virtudes que no conviven

Pedimos tres cosas:

### 1. Unanimidad

Si todo el mundo prefiere `X` a `Y`, el ranking social también. Si nadie defiende lo contrario, la sociedad no debería inventar un gusto colectivo disidente. Es la versión débil de Pareto: no ignores un acuerdo total.

### 2. Independencia de alternativas irrelevantes (IIA)

La comparación social entre `X` e `Y` solo depende de cómo cada votante compara `X` e `Y`. Si alguien cambia de opinión sobre un tercero `Z`, o si entra o sale un candidato que no gana, eso no debería dar vuelta el veredicto entre `X` e `Y`.

IIA es el axioma más discutido. Suena limpio: "no mezcles peras con manzanas". También elimina mucha información. Métodos como Borda usan los puestos relativos de todo el ranking; IIA les dice, en esencia, que eso es trampa conceptual. El spoiler de la pluralidad es, en buena medida, IIA rompiéndose en público: el mano a mano entre dos cambios porque aparece un tercero.

### 3. No dictadura

No hay un votante cuya preferencia estricta se copie siempre al ranking social, pase lo que pase con el resto. Si siempre ganara lo que quiere Ana, aunque el resto diga lo contrario, Ana es dictadora en el sentido técnico del teorema. No hace falta que Ana sea mala persona: el axioma prohíbe ese diseño.

### El teorema

**Teorema de Arrow (versión estricta para rankings).** Con al menos tres candidatos y al menos dos votantes, no existe una SWF que cumpla unanimidad, IIA y no dictadura a la vez.

La prueba clásica (hay varias; una muy corta es la de Yu, 2012) identifica un votante **pivotal**: alguien cuyo cambio de opinión, en un momento preciso, da vuelta el orden social entre un par. Después muestra que ese pivote, por contagio entre pares cuando hay una tercera alternativa, termina dictando todas las comparaciones. Unanimidad e IIA empujan hacia un dictador; el tercer axioma dice que eso no vale. Choque.

## Qué dice Arrow (y qué no)

Qué **no** dice:

- No dice que votar sea inútil.
- No dice que todos los métodos sean iguales.
- No prohíbe elegir un solo ganador con reglas que relajan IIA.
- No prohíbe boletas que no son rankings (approval, puntajes).
- No resuelve, por sí solo, qué sistema "debería" usar un país.

La lectura útil: si pedís demasiadas virtudes a la vez en el marco ranking-SWF, el sistema se rompe. Entonces hay que elegir. La pluralidad prioriza simplicidad y sacrifica IIA. Los métodos Condorcet priorizan los mano a mano y aceptan otras rarezas. Approval y score cambian la pregunta: ya no estamos en el mismo teorema.

## Un laboratorio mínimo

Cinco votantes, tres candidatos:

1. A > B > C  
2. A > B > C  
3. B > C > A  
4. B > C > A  
5. C > A > B  

Contemos los mano a mano:

- A vs B: los votantes 1, 2 y 5 prefieren A; 3 y 4 prefieren B. Gana A (3-2).
- B vs C: 1, 2, 3 y 4 prefieren B; solo 5 prefiere C. Gana B (4-1).
- C vs A: 3, 4 y 5 prefieren C; 1 y 2 prefieren A. Gana C (3-2).

Hay un **ciclo de Condorcet**: A vence a B, B vence a C, C vence a A. No existe alguien que gane todos los duelos. Cualquier método que elija un "ganador" acá está, de algún modo, cortando el ciclo con un criterio extra.

¿Qué hace cada familia?

**Pluralidad.** Solo mira el primero: A, A, B, B, C. Empate 2-2-1 entre A y B. El desempate por etiqueta (como en nuestra simulación) elige A. Ese desempate ya es política disfrazada de aritmética.

**Borda.** Asigna puntos por puesto (con 3 candidatos: 2, 1, 0). Suma todo el ranking. En este perfil gana B: B aparece segundo en las boletas de A y sigue fuerte en las suyas.

**Minimax / Copeland.** Miran los mano a mano. Minimax elige a quien pierde menos feo su peor duelo. Copeland suma victorias menos derrotas. En el canónico, ambos apuntan a A en nuestra implementación (A pierde un duelo, pero el patrón de márgenes lo favorece frente a otras lecturas).

**IRV.** Elimina al que va último en primeras preferencias y reasigna. Acá C sale primero; después el recuento entre A y B define.

**Approval / score via ranking.** Usan más información que un solo "tachito". No son contraejemplos de Arrow: se salen del marco. En el sitio, el botón **Utilidades (escape)** muestra la diferencia: mismas personas, pero approval y score leen números, no solo el orden.

En el interactivo, **Canónico** carga exactamente este perfil. Es el mismo que verifica el módulo Lean `Canonical`. Tres capas, un solo ejemplo.

## Una escena de spoiler (IIA en carne viva)

Supongamos, en otra elección, que sin el candidato C la sociedad (o el método) declara A > B. Entra C, que no gana, pero parte el voto de A. De pronto el método declara B > A. Las preferencias individuales entre A y B no cambiaron: solo cambió el entorno. Eso es una violación de IIA. La pluralidad lo hace todo el tiempo. No es un "error de implementación": es el método respondiendo a una pregunta distinta ("quién tiene más primeros") que no es la pregunta de IIA ("cómo queda A contra B mirando solo A vs B").

Arrow no te obliga a amar IIA. Te obliga a admitir el costo si la abandonás.

## Qué hacen los métodos (y qué sueltan)

| Método | Pregunta que hace | Qué suele soltar |
|--------|-------------------|------------------|
| Pluralidad | Quién tiene más primeros | IIA (spoiler) |
| Borda | Cuántos puntos por puesto | IIA |
| Minimax | Quién pierde menos feo mano a mano | Otras propiedades, según el caso |
| Copeland | Victorias pairwise menos derrotas | Empates y detalles de ciclo |
| IRV | Eliminar al último de a uno | IIA; a veces monotonía |
| Approval | A quién apruebo | Sale del marco ranking puro |
| Score | Qué puntaje le pongo | Sale del marco ranking puro |

No hay método "el correcto" en abstracto. Hay métodos que optimizan distintas preguntas. La tabla es un mapa de costos, no un ranking moral.

## Números, no magia

En el sitio hay un panel Monte Carlo. Genera muchos perfiles al azar y mide proxies honestos:

1. **Eficiencia de Condorcet.** Cuando existe un candidato que gana todos los mano a mano, ¿lo elige el método?
2. **Regret utilitario.** En un modelo espacial 1D (votantes y candidatos en una recta; la utilidad es menos la distancia), ¿cuánto se pierde frente a maximizar la suma de utilidades?
3. **Estrés tipo IIA.** Metemos un candidato spoiler en un puesto fuerte para parte del electorado: ¿cambia el ganador entre los originales?
4. **Top mayoritario.** ¿El ganador vence a todos por mayoría pairwise?

Dos modelos de preferencias:

- **Impartial culture:** cada ranking es igualmente probable. Es un estrés teórico, poco realista, útil para ver roturas.
- **Espacial 1D:** más interpretable ("izquierda-derecha", un eje de gusto). Las utilidades latentes permiten hablar de regret sin pretender que el mundo sea 1D.

Corrida de referencia (espacial 1D; 200 corridas; 25 votantes; semilla 7):

| Método | Eficiencia Condorcet | Regret medio | Cambio tipo IIA |
|--------|---------------------:|-------------:|----------------:|
| Pluralidad | 28.5% | 0.73 | 0% |
| Borda | 91% | 0.01 | 18% |
| Minimax | 100% | 0.01 | 0.5% |
| Copeland | 100% | 0.01 | 0% |
| IRV | 49.5% | 0.53 | 0% |
| Approval | 82.5% | 0.06 | 15.5% |
| Score (via ranking) | 91% | 0.01 | 18% |

Lectura cuidadosa: minimax y Copeland clavan Condorcet cuando existe; pluralidad e IRV sufren. Borda y score (inducido del ranking) se parecen porque, en esta implementación, el score via ranking usa los mismos puntajes que Borda: el escape de verdad aparece cuando hay utilidades libres (botón **Utilidades**). La columna IIA no mide el axioma formal de Arrow al pie de la letra: es un estrés operativo con un spoiler insertado. Sirve para ver sensibilidad, no para cerrar un juicio filosófico.

No hay "voluntad verdadera" escondida detrás de la tabla. Hay trade-offs visibles. Eso ya es mucho más que un slogan.

Los CSV reproducibles viven en `results/` del [repo](https://github.com/pablogventura/arrow). En el sitio podés repetir la corrida, cambiar semilla y exportar.

## Una prueba que se puede chequear (con matices)

Además del texto y las simulaciones, el proyecto formaliza partes del argumento en Lean 4, un asistente de pruebas. La máquina no se impresiona con la prosa: o el paso está justificado, o no.

Qué está chequeado hoy:

- Definiciones: candidatos, los seis rankings sobre tres alternativas, perfiles, SWF, axiomas.
- La dictadura cumple unanimidad e IIA.
- Una regla concreta "con spoiler" viola IIA (contraejemplo mecánico).
- El perfil canónico del ciclo (márgenes pairwise) coincide con el demo.
- Lemas de **contagión**: si un votante decide el par `(A,B)` en el desacuerdo canónico, también decide `(A,C)`.

Qué queda como residual documentado:

- El paso final del argumento de Yu (el pivote se vuelve dictador pleno) y el caso general con muchos votantes. Está enunciado en Lean como axioma nombrado, con referencia, sin fingir que la mecanización está cerrada.

Esa honestidad importa. La divulgación a veces vende "demostramos todo en la computadora" cuando en realidad hay un `sorry` escondido. Acá el residual se declara. El valor del puente Lean no es la victoria total: es obligar a no mezclar definiciones, y a separar lo verificado de lo narrado.

Código: [github.com/pablogventura/arrow](https://github.com/pablogventura/arrow). Compilar: `cd lean && lake build`.

## Entonces, ¿qué hacemos con esto?

Tres actitudes posibles, todas legítimas si se declaran:

1. **Relajar IIA.** Aceptar que el entorno de candidatos importa. Diseñar métodos que usen más información (Borda, Condorcet) y explicar los costos.
2. **Cambiar la boleta.** Approval y score preguntan otra cosa. Arrow no las condena igual porque no viven en su marco.
3. **Bajar la exigencia de salida.** A veces alcanza un ganador, no un ranking social completo. El teorema se vuelve menos asfixiante; aparecen otros teoremas (por ejemplo sobre estrategia), pero ese es otro capítulo.

En todos los casos, el spoiler deja de ser un accidente moral y pasa a ser un síntoma de diseño. La pelea útil no es "el sistema es fraudulento" versus "el sistema es sagrado". Es: ¿qué pregunta queremos que responda la boleta?

## Cierre

Arrow no cierra el debate político: lo organiza. Obliga a declarar el marco (qué boleta, qué salida, qué axiomas) y a aceptar costos. Se puede estudiar con un perfil de cinco personas, con mil perfiles al azar, y con una prueba que una máquina mira por encima del hombro.

Si querés pelearte con el teorema, mejor hacerlo con las manos en un perfil concreto que con un slogan.

Probá el canónico: [pablogventura.github.io/arrow](https://pablogventura.github.io/arrow/).

---

Pablo Ventura (FaMAF).

Lecturas: Arrow, *Social Choice and Individual Values* (1951/1963); Geanakoplos (2005), "Three brief proofs of Arrow's Impossibility Theorem"; Yu (2012), "A one-shot proof of Arrow's impossibility theorem". Más referencias en [bibliografia.md](bibliografia.md).
