# Propuesta de valor

---

## 1 · Cómo se reduce específicamente el tiempo de espera

La espera no se reduce con una medida sino con cuatro mecanismos que operan sobre
causas distintas. Se detallan por separado porque cada uno tiene un costo, un
plazo y un riesgo diferentes.

### Mecanismo 1 — Eliminar el tiempo muerto con sala llena

**Causa que ataca:** un consultorio queda libre mientras hay pacientes esperando
en la misma sede por la misma especialidad. Hoy nadie lo detecta porque cada
consultorio administra su propia cola.

**Cómo:** los consultorios de una especialidad se tratan como un recurso único. Al
liberarse uno, el sistema identifica al paciente de mayor espera acumulada en toda
la sede y propone el movimiento.

**Efecto medido:** espera media de la jornada de 32,1 a 23,4 minutos. Percentil 90
de 78 a 55. En el pico de las 17 horas, de 40 a 30 minutos.

*La media de la jornada es inferior a los 45 minutos reportados porque incorpora
las primeras horas, en las que la agenda opera en horario. El detalle de la curva
figura en el mecanismo siguiente.*

**Sin modificar la agenda ni los acuerdos con los profesionales.**

### Mecanismo 2 — Interrumpir la cascada antes de que se propague

**Causa que ataca:** cada consulta que excede su duración empuja a la siguiente.
El retraso se acumula durante toda la jornada y nunca se recupera.

| 08:00 | 10:00 | 12:00 | 13:00 | 15:00 | 17:00 | 18:00 |
|---|---|---|---|---|---|---|
| 5 min | 22 min | 35 min | 43 min | 29 min | 40 min | 60 min |

**Cómo:** el sistema detecta el corrimiento por consultorio en el momento en que
se produce y alerta con una acción concreta —reasignar, avisar, priorizar—
ordenada por minutos evitables, no por antigüedad.

**Consecuencia económica:** intervenir a las 11 de la mañana evita el retraso de
toda la tarde. Ampliar capacidad instalada para absorber el pico de las 17 horas
cuesta un orden de magnitud más y no ataca la causa.

### Mecanismo 3 — Dejar de sobreagendar

**Causa que ataca:** la agenda se construye asumiendo un 30% de inasistencia. Los
días en que los pacientes concurren, la sala se satura.

**Cómo:** primero se reduce el ausentismo mediante confirmación activa; recién
entonces el factor de sobreagenda puede bajar. El sistema lo recomienda por sede a
partir del ausentismo efectivamente medido, no de un valor heredado.

**Efecto acumulado con los tres mecanismos:** espera media de 32,1 a 20,2 minutos
(−37%). Franja de la tarde de 32,9 a 19,8 (−40%).

**El orden es obligatorio.** Reducir el ausentismo sin rediseñar la grilla lleva la
espera de 23,4 a 30,7 minutos: los pacientes recuperados ingresan en una agenda
construida bajo el supuesto de que no concurrirían.

### Mecanismo 4 — Reducir la espera percibida, que es la que se recuerda

**Causa que ataca:** el paciente no mide su espera, la estima. Y la sobreestima.

En la literatura, esperas reales de 5,9 minutos se perciben como 16,7 — una
relación cercana a 3 a 1. El mismo trabajo encuentra que **informar al paciente
mejora significativamente su satisfacción (p = 0,001)**, con independencia de la
duración efectiva de la espera.

**Cómo:**

- **Ventana estimada en el teléfono**, no una hora exacta. Una hora exacta es una
  promesa que la institución no controla: depende de la duración de la consulta
  anterior, que es información clínica. Incumplirla deteriora más la confianza que
  no haberla dado.
- **Aviso explícito de la demora**, con reconocimiento. El corrimiento ya existe;
  ocultarlo solo cambia el momento en que el paciente se entera.
- **Comunicación del cambio de consultorio**, con su motivo. Un cambio silencioso
  es indistinguible de un error para quien lo vive.
- **Pantalla de sala** con el estado de los llamados.

**Es el mecanismo de mejor relación costo-resultado de la propuesta: no consume
capacidad instalada.**

---

## 2 · Qué más determina la experiencia del paciente

El objetivo planteado fue *"mejorar la experiencia del paciente"*, que es más
amplio que reducir la espera. La literatura sobre satisfacción en consulta externa
identifica varios determinantes. Se los ordena por lo que esta solución puede
efectivamente modificar.

### Lo que la solución modifica directamente

| Determinante | Intervención |
|---|---|
| Tiempo de espera real | Mecanismos 1 a 3 |
| Tiempo de espera percibido | Mecanismo 4 |
| Información recibida durante la espera | Ventana estimada y aviso de demora |
| Fricción administrativa | Confirmación y reprogramación desde el teléfono, sin llamar |

### Lo que modifica indirectamente

**Demora en conseguir turno.** Es un determinante de peso y un problema sistémico
documentado: en Argentina hay especialidades con turnos a tres meses. Cada
ausencia sin aviso es un turno que quedó vacío mientras alguien lo esperaba.

La confirmación activa convierte parte de esas ausencias en avisos anticipados,
que **liberan el turno con tiempo suficiente para reasignarlo**. En el modelo, los
turnos liberados con aviso pasan de 5,5% a 9,4% de la agenda.

Cuantificar la reducción del tiempo hasta obtener turno requiere conocer la
demanda insatisfecha de la red, dato que no fue provisto.

**Continuidad de atención.** No es algo que la solución mejore; es algo que **no
debe romper**. Por eso la reasignación opera únicamente dentro de la misma
especialidad, el sistema propone en lugar de ejecutar, y la decisión final
permanece en recepción, que conoce los casos en que el paciente debe ver a su
profesional habitual.

### Lo que la solución NO modifica

Se enuncia explícitamente para acotar el alcance del compromiso:

| Determinante | Por qué queda fuera |
|---|---|
| **Calidad de la relación médico-paciente** | La literatura la identifica como el determinante más fuerte de la satisfacción, por encima de aspectos técnicos. Depende del profesional y del tiempo de consulta disponible, no del sistema de agenda |
| Resolución clínica del motivo de consulta | Fuera del alcance |
| Confort e infraestructura de la sala | Fuera del alcance |
| Trato del personal | La herramienta puede reducir la fricción que lo tensiona; no lo determina |

**Una advertencia que corresponde hacer:** si la insatisfacción de esta red se
origina principalmente en la relación médico-paciente o en la duración de la
consulta, esta solución mejorará los indicadores operativos sin mover
significativamente la satisfacción global.

Por esa razón el estudio de línea de base de la fase 0 releva **causas** y no solo
puntajes. Determinar el peso relativo de cada factor antes de comprometer
resultados es parte del trabajo, no una salvedad contractual.

---

## 3 · Compliance y protección de datos de salud

### Marco aplicable

El brief menciona HIPAA sin especificar el país de operación. Asumiendo
**Argentina**, el marco vinculante es:

| Norma | Alcance |
|---|---|
| **Ley 25.326** de Protección de Datos Personales | Los datos de salud son **datos sensibles** (arts. 2 y 7). Su tratamiento requiere consentimiento y finalidad determinada |
| **Ley 26.529** de Derechos del Paciente | Confidencialidad de la historia clínica; derecho de acceso del titular |

**HIPAA no resulta vinculante en Argentina.** Aun así, **la solución se diseñó
contra sus estándares**, por dos razones: es el marco más exigente de los dos, y
la jurisdicción es un supuesto no confirmado. Si la respuesta fuera Estados
Unidos, no habría retrabajo.

### El principio de diseño: minimización por superficie

La protección de datos no se resuelve con una política ni con un cifrado: se
resuelve decidiendo, **para cada pantalla, qué es lo mínimo que necesita mostrar.**

Un dato de salud no se filtra solamente en una base vulnerada. Se filtra cuando
una pantalla de sala muestra *"María Gómez — Endocrinología"* frente a treinta
personas, o cuando un evento de calendario que dice *"Oncología"* aparece en la
agenda compartida con el trabajo.

**Cada superficie del sistema tiene un nivel de exposición distinto y recibe un
tratamiento distinto:**

| Superficie | Quién la ve | Qué muestra | Qué nunca muestra |
|---|---|---|---|
| **Tablero de recepción** | Personal autorizado, pantalla no visible al público | Nombre, especialidad, profesional, estado | Documento, teléfono |
| **Pantalla de sala** | Cualquier persona presente | Código de turno y consultorio | Nombre, especialidad, cualquier dato identificatorio |
| **Teléfono del paciente** | El paciente, autenticado | Su turno completo | Datos de otros pacientes |
| **Evento de calendario** | Quien acceda al calendario del paciente | *"Turno médico · sede"* | Especialidad, profesional |
| **Vista de red** | Dirección de Operaciones | Indicadores agregados por sede | Datos individuales de pacientes |

El caso del calendario ilustra el criterio: es una superficie que **el paciente
comparte sin advertirlo** —con su pareja, con su equipo de trabajo, con quien
tenga acceso al dispositivo—. El detalle clínico permanece detrás de un enlace
autenticado.

### Otras decisiones de compliance

- **Código de turno no reversible a la identidad.** El código que se muestra en
  sala se deriva del horario del turno; no permite reconstruir quién es el
  paciente.
- **Métricas por sede, no por profesional**, durante las fases 0 y 1. El
  desempeño individual del profesional es un dato laboral sensible cuya gestión
  corresponde a la institución.
- **Minimización de retención.** El sistema requiere el detalle individual durante
  la jornada; a partir del cierre, los indicadores operativos se conservan
  agregados.
- **Trazabilidad de acceso.** Toda consulta a datos identificatorios queda
  registrada, requisito para acreditar cumplimiento ante una eventual auditoría.

---

## 4 · Diferenciadores

### 4.1 Conocemos el orden correcto, y está medido

La secuencia natural de implementación —empezar por los recordatorios, que es lo
técnicamente más simple— **empeora el indicador que la institución quiere
mejorar**: lleva la espera de 23,4 a 30,7 minutos.

Es un resultado contraintuitivo que solo aparece al simular la interacción entre
las palancas. Una propuesta que ofrezca recordatorios automáticos como primera
entrega producirá un retroceso medible en el segundo mes, que es cuando se evalúa
la continuidad del proyecto.

**Este es el diferenciador principal y es verificable:** el modelo está disponible
para su ejecución.

### 4.2 Atacamos la espera percibida, no solo la real

La espera se sobreestima en una relación cercana a 3 a 1, e informar al paciente
mejora la satisfacción de forma significativa **con independencia de la duración
efectiva**.

Una solución centrada exclusivamente en el tablero interno deja sin aprovechar la
intervención más barata disponible. La vista de paciente no es un complemento: es
el mecanismo con mejor relación costo-resultado de la propuesta.

### 4.3 El sistema propone; la persona decide

La reasignación automática es técnicamente más simple y operativamente peor. Mover
a un paciente puede ser incorrecto por razones que el sistema no observa:
continuidad con su profesional, un estudio pendiente en otra sala, un acompañante.

El plan de reasignación además **excluye movimientos cruzados entre consultorios**
aunque resulten óptimos en minutos, porque un plan que se contradice a sí mismo es
ilegible en el mostrador. Se sacrifica aproximadamente un tercio de los movimientos
posibles a cambio de que el sistema se utilice.

Un sistema que reordena la sala sin explicación se desactiva en una semana.

### 4.4 Compliance como decisión de producto

La protección de datos de salud se resolvió **por superficie**, no mediante una
sección del contrato. Es verificable en el prototipo: la pantalla de sala no
muestra nombres, el evento de calendario no incluye especialidad.

### 4.5 Los supuestos están declarados, y el modelo se recalcula

Cada parámetro que no fue provisto figura con su fuente, su rango y el efecto que
tendría sobre las conclusiones si el valor real difiere. Donde no existe fuente
pública, se indica expresamente.

Ante un supuesto distinto, el modelo se recalcula y los resultados se presentan
actualizados en la misma reunión.

### 4.6 Sabemos qué no resuelve

La sección 2 de este documento enumera los determinantes de la satisfacción sobre
los que esta solución no opera, incluido el más importante según la literatura.

Acotar el compromiso antes de firmarlo es una condición para poder **contratar por
resultado**, que es lo que la línea de base de la fase 0 habilita.

---

## 5 · Resumen

| Dimensión | Resultado |
|---|---|
| Espera media de la jornada | −37% |
| Espera en la franja de la tarde | −40% |
| Percentil 90 | de 78 a 48 minutos |
| Pacientes atendidos dentro de los 15 min | de 43% a 54% |
| Ausencias sin aviso | de 31% a 21% |
| Uso efectivo de la agenda | de 63% a 72% |
| Volumen de atención | sin variación significativa |
| Cierre de la jornada | una hora antes |
