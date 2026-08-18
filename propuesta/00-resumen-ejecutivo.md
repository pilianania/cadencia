# Optimización de agenda ambulatoria
## Propuesta para una red de 8 clínicas

---

## La propuesta en una línea

Un sistema que **reasigna pacientes entre consultorios en tiempo real**, obtiene
confirmación anticipada de asistencia y ajusta la agenda en función del
ausentismo medido. **Reduce la espera del paciente de 45 a 36 minutos sin
resignar turnos y baja las ausencias sin aviso de 30% a 21%.** Con la primera
consulta agendada con más tiempo (fase 3) la espera baja a 25 minutos: cuesta 6%
de las consultas y se paga con los pacientes que retiene. Bajar más (17 alargando
todos los turnos) lo decide la institución con datos propios.

---

## Qué resuelve

| Indicador | Hoy | Fase 1: reasignación | Fase 2: confirmación y agenda ajustada | Fase 3: primera consulta más larga |
|---|---|---|---|---|
| **Espera a las 17 h**, el horario crítico | 56 min | **45 min** (−20%) | **48 min** | 33 min |
| Espera media de la franja 14 a 17 h | 48 min | **37 min** (−23%) | **40 min** | 26 min |
| Espera media de la jornada | 45 min | **36 min** (−20%) | **38 min** | 25 min |
| Percentil 90, el paciente peor atendido | 106 min | **82 min** (−23%) | **84 min** | 60 min |
| Pacientes atendidos dentro de los 15 min de su turno | 34% | **40%** | **37%** | 49% |
| Ausencias sin aviso | 30% | sin cambio | **21%** | 21% |
| Cierre efectivo de la jornada | 20:06 | 20:01 | **19:55** | 19:38 |
| Turnos ofrecidos por día | 1.220 | 1.220 | 1.110 (−9%) | 1.038 (−15%) |
| Consultas atendidas por día | 786 | 790 | **793** (*sin cambio significativo*) | 744 (−6%) |

*Turnos ofrecidos es lo que hay en la agenda; consultas atendidas, lo que
efectivamente ocurre. Hoy, de 1.220 turnos ofrecidos, 368 se pierden sin aviso
y 60 se liberan con aviso: se atienden 786. Con la fase 2 se ofrecen menos
turnos (1.110), pero se atienden los mismos (793), porque dejan de perderse.*

*La espera de la fase 2 (38 minutos) no es distinta de la de la fase 1 (36):
la diferencia cabe dentro del error del modelo. Lo que agrega la fase 2 es
bajar las ausencias de 30% a 21% con el mismo volumen de consultas y proteger
la ganancia de la fase 1: los recordatorios sin ajustar la agenda dejan la
espera en 51 minutos, peor que hoy.*

**Por qué no menos.** Con la ocupación actual, cada minuto de espera por debajo
de 36 cuesta turnos: sin ninguna sobreagenda la espera baja a 31 minutos con 3%
menos de consultas; la primera consulta agendada a 1,5 veces el turno de un
control la baja a 25 con 6% menos; las dos cosas juntas, a 21 con 9% menos;
alargar todos los turnos un 15% la baja a 20 con 11% menos. Ninguna
intervención sobre la agenda lleva la espera media de la jornada a la media
ambulatoria del país (15 minutos) sin resignar volumen, porque la causa es
que la consulta dura más que el turno. Las fases 1 y 2 no tocan el volumen. La
primera consulta más larga es la fase 3: cuesta USD 129.000 al año en consultas
y se paga con la retención: alcanza con que la espera más corta retenga un 1%
más de los pacientes activos por año (USD 129.000, contando USD 20 que deja cada
paciente por año y USD 60 que cuesta traer uno nuevo); tomando 1,5%, sobra.
Alargar todos los turnos queda como decisión de la institución. El detalle está
en el caso de negocio.

La única palanca que bajaría de 38 sin resignar turnos es que la consulta
real dure menos. El modelo lo mide como sensibilidad (5% menos, un minuto de
veinte, llevaría la espera a 30; 10%, a 23; 15%, a 17), pero no se promete: la
evidencia sobre asistentes de transcripción muestra menos tiempo de
documentación y menos desgaste del profesional, no consultas más cortas.

**Sobre el volumen de atención.** Dejar de sobreagendar reduce la cantidad de
turnos ofrecidos, lo que podría suponer una pérdida de facturación. **La
simulación no la encuentra:** la diferencia es de 7 consultas diarias sobre una
dispersión de ±68 entre réplicas, es decir, no distinguible de cero.

La explicación es que el sobreagendamiento no agrega capacidad real: agrega
turnos que en un tercio de los casos nadie ocupa. Al reducir el ausentismo, la
**tasa de uso efectivo de la agenda pasa de 64% a 71%**, y ese aumento de
eficiencia compensa la reducción de turnos ofrecidos.

> *Los tres primeros indicadores miden lo mismo sobre distintos recortes horarios.
> Se reportan los tres para evitar que la mejora aparezca sobredimensionada al
> medirse únicamente sobre el peor tramo del día.*
>
> *Todos los valores son el promedio de 64 réplicas de la jornada completa. Se
> reporta la dispersión entre réplicas para distinguir un efecto real de una
> diferencia que cabe dentro del error del modelo.*

---

## Por qué esta solución y no otra

La reunión inicial identificó tres síntomas: 45 minutos de espera, 30% de
ausencias sin aviso y tiempos muertos del personal médico.

**No son tres problemas. Son uno.**

Con el 30% de la agenda vacía, la demora se disolvería en los huecos. Que ambos
números convivan solo se explica por **sobreagendamiento**: la institución agenda
turnos más juntos que su duración real para cubrirse de las ausencias. Los días
en que los pacientes concurren, la sala se satura. Es una apuesta estadística
contra el propio paciente, y la paga quien llegó puntual.

De ahí se deriva el orden de las intervenciones, que no es una preferencia
metodológica: **reducir las ausencias es lo que habilita dejar de sobreagendar, y
eso es lo que reduce la espera.**

### Y la espera no es constante: es una cascada

| 08:00 | 10:00 | 12:00 | 13:00 | 15:00 | 17:00 | 18:00 |
|---|---|---|---|---|---|---|
| 6 min | 29 min | 44 min | 54 min | 44 min | **56 min** | 80 min |

Al abrir, la agenda está en horario. **Cada hora hereda el retraso de
la anterior y la jornada nunca se recupera dentro del día.**

Esto cambia dónde conviene intervenir: no se trata de acelerar la atención, sino
de **interrumpir el corrimiento antes del mediodía**, que es una intervención
considerablemente más barata que ampliar la capacidad instalada.

---

## Las tres intervenciones

### 1 · Pool de reasignación

Los consultorios de una misma especialidad dejan de operar como colas
independientes y pasan a atender como un recurso único, del mismo modo que una
entidad bancaria opera con fila única en lugar de una fila por caja.

El sistema detecta el desbalance, propone qué pacientes conviene mover y ejecuta
el cambio comunicándoselo al paciente. **No modifica la agenda de turnos ni los
acuerdos con los profesionales**, por lo que es la intervención de menor fricción
y la de resultado más rápido.

**Efecto aislado: espera media de 45 a 36 minutos, sin modificar la agenda.**

### 2 · Confirmación activa

El paciente confirma su asistencia o avisa que no podrá concurrir, desde su
teléfono y con un toque. El aviso anticipado tiene más valor que la asistencia:
libera el turno con tiempo suficiente para reasignarlo.

Se complementa con un evento de calendario generado al reservar, que actúa sobre
la principal causa de ausencia registrada en la literatura: el olvido.

### 3 · Ajuste de la agenda

Con las ausencias bajo control, el sobreagendamiento deja de ser necesario. El
factor pasa a ser un parámetro por sede que el sistema recomienda a partir del
ausentismo efectivamente medido, en lugar de un valor heredado.

**Efecto conjunto de 2 y 3: las ausencias sin aviso bajan de 30% a 21% con el
mismo volumen de consultas, y la espera se mantiene en la de la fase 1 (38
minutos frente a 36, una diferencia dentro del error del modelo).**

> **Las intervenciones 2 y 3 se despliegan juntas.** Reducir ausencias sin
> ajustar la agenda **incrementa** la espera, de 36 a 51 minutos, y la deja peor
> que hoy: los pacientes recuperados ingresan en una agenda construida bajo el
> supuesto de que no concurrirían. Es un resultado contraintuitivo con
> consecuencias operativas directas, desarrollado en el plan de implementación.

---

## Además de reducir la espera, reduce cuánto pesa

El paciente **sobreestima su espera en una proporción cercana a 3 a 1**: en la
literatura, esperas reales de 6 minutos se perciben como 17. Y la evidencia
muestra que **informar al paciente mejora la satisfacción de forma significativa**
(p = 0,001), con independencia de la duración efectiva.

Por eso la solución no se limita al tablero interno. Incluye:

- **Ventana estimada de atención en el teléfono del paciente**, actualizada en
  tiempo real, con aviso explícito cuando hay demora
- **Pantalla de sala de espera** con el estado de los llamados
- **Comunicación automática** cuando se reasigna a un paciente, explicando el motivo

Es la intervención con mejor relación costo-resultado de la propuesta: **reduce la
espera percibida sin consumir capacidad instalada.**

## La espera cuesta pacientes

Además de satisfacción, la espera cuesta pacientes. El paciente ambulatorio con
cobertura cambia de prestador sin costo, y la espera es una causa documentada de
esa pérdida (*churn*): en el informe anual de tiempos
de espera de Vitals, uno de cada cinco pacientes declara haber cambiado de médico
por la espera y tres de cada diez haberse retirado de un turno sin atenderse. Es
un dato de Estados Unidos, usado como orden de magnitud. Para esta red, con unos
161.000 pacientes activos, retener un 1% más por año son 1.610
pacientes. El módulo lo mide desde el primer día (el mismo
paciente, otra consulta); comparado antes y después de bajar la espera, es la
medida de retención.

---

## Qué se entrega

| Componente | Destinatario |
|---|---|
| Tablero operativo por sede | Recepción y coordinación |
| Vista consolidada de la red | Dirección de Operaciones |
| Motor de reasignación con plan sugerido | Recepción |
| Vista de paciente en su teléfono | Paciente |
| Pantalla de sala de espera | Sala |
| Comparador de escenarios | Dirección |

---

## Plazos

| Fase | Duración | Alcance |
|---|---|---|
| 0 · Visibilidad y línea de base | 3 a 4 semanas | 1 sede piloto |
| 1 · Pool de reasignación | 4 a 6 semanas | Piloto + 2 sedes |
| 2 · Confirmación y ajuste de la agenda | 8 a 10 semanas | Red completa |
| 3 · Primera consulta más larga | 2 a 3 semanas | Red completa |

**Total estimado: 17 a 23 semanas** hasta la red completa.

---

## Nota sobre el origen de las cifras

Los resultados provienen de simular la jornada completa de la red minuto a
minuto, aplicando en cada escenario una política distinta sobre la misma
estructura de sedes, consultorios y especialidades.

Las intervenciones que modifican la agenda de turnos generan necesariamente una
jornada distinta, con otros pacientes, por lo que la comparación entre escenarios no es exacta. Para
corregirlo, **cada escenario se ejecutó 64 veces con poblaciones distintas** y se
reporta el promedio junto con su dispersión. Una única corrida no permitiría
distinguir el efecto de una política del ruido propio de la generación; con 8
réplicas, el error estándar era del mismo orden que el efecto que se quería
medir, y por eso se subió a 64.

El modelo está **calibrado contra la situación reportada**: arroja 45 minutos
de espera media de jornada y 32% de ausencias, frente a los 45 minutos y 30%
informados en la reunión. Esa correspondencia es lo que permite que las mejoras
proyectadas sean comparables y no declarativas.

La reunión aportó tres cifras; el resto de los parámetros (volumen, capacidad
instalada, duración de consulta, composición por especialidad) **no fueron
provistos y debieron asumirse.** Cada supuesto está documentado en el anexo con
su fuente, su rango y el efecto sobre las conclusiones si el valor real difiere.

Las dos preguntas cuya respuesta más modifica el resultado:

1. **¿Existe lista de espera o demanda insatisfecha?** Determina si los turnos
   liberados con aviso se convierten en consultas adicionales o no; es el único
   beneficio valorizado del caso de negocio.
2. **¿Cuántos consultorios por especialidad opera cada sede?** Determina el
   rendimiento de la intervención 1.

El modelo está parametrizado: ante un supuesto distinto, los resultados se
recalculan.

---

## Índice de la propuesta

1. [Plan de implementación y riesgos](01-plan-implementacion.md)
2. [Propuesta de valor, compliance y diferenciadores](02-propuesta-valor.md)
3. [Caso de negocio](03-caso-de-negocio.md)
4. [Anexo: supuestos, fuentes y sensibilidad](anexo-supuestos.md)
