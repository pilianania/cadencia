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

**Efecto medido:** espera media de la jornada de 45 a 36 minutos (−20%).
Percentil 90 de 106 a 82. En el pico de las 17 horas, de 56 a 45 minutos. Hoy
hay 43 horas diarias de consultorio libre con gente esperando en la red; 21 son
con alguien de la misma especialidad y la reasignación las lleva a cero. Las
otras 22 (un cardiólogo libre mientras esperan pacientes de dermatología) no se
recuperan moviendo pacientes: se resuelven planificando la agenda entre
especialidades, y el módulo las mide aparte para que se vean.

**Sin modificar la agenda ni los acuerdos con los profesionales.**

### Mecanismo 2 — Interrumpir la cascada antes de que se propague

**Causa que ataca:** cada consulta que excede su duración empuja a la siguiente.
El retraso se acumula durante toda la jornada y nunca se recupera.

| 08:00 | 10:00 | 12:00 | 13:00 | 15:00 | 17:00 | 18:00 |
|---|---|---|---|---|---|---|
| 6 min | 29 min | 44 min | 54 min | 44 min | 56 min | 80 min |

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

**Efecto medido:** la espera media se mantiene en el nivel del mecanismo 1 (de
36 a 38 minutos, diferencia dentro del error del modelo) y las ausencias sin
aviso bajan de 30% a 21% con el mismo volumen de consultas: se ofrecen menos
turnos (de 1.220 a 1.110 por día) pero se atienden los mismos, porque dejan de
perderse. Los turnos liberados con aviso pasan de 60 a 101 por día.

**Efecto acumulado con los tres mecanismos:** espera media de 45 a 36 minutos
(−20%) sin resignar turnos, y ausencias sin aviso de 30% a 21%. Bajar de ahí
cuesta turnos: 31 minutos sin ninguna sobreagenda (3,5% menos de consultas), 25 con
la primera consulta más larga (6% menos), 21 con ambas (9% menos), 17 alargando
todos los turnos (11% menos). Cada escalón es una decisión de la institución con
el costo a la vista.

**El orden es obligatorio.** Reducir el ausentismo sin ajustar la agenda lleva la
espera de 36 a 51 minutos, peor que hoy, anulando la ganancia completa del
mecanismo anterior: los pacientes recuperados ingresan en una agenda construida
bajo el supuesto de que no concurrirían.

### Mecanismo 4 — Reducir la espera percibida, que es la que se recuerda

**Causa que ataca:** el paciente no mide su espera, la estima. Y la sobreestima.

En la literatura, esperas reales de 5,9 minutos se perciben como 16,7, una
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

Y lo que está en juego detrás de la experiencia es la **pérdida de pacientes**
(*churn*): el paciente con cobertura cambia de prestador sin costo, y la espera
es una causa documentada de ese cambio (uno de cada cinco pacientes en el informe
de Vitals). La reducción de espera se traduce en retención, que el caso de negocio
valoriza y que el módulo mide con la proporción de pacientes que vuelven a la
red.

### Lo que modifica indirectamente

**Demora en conseguir turno.** Es un determinante de peso y un problema sistémico
documentado: en Argentina hay especialidades con turnos a tres meses. Cada
ausencia sin aviso es un turno que quedó vacío mientras alguien lo esperaba.

La confirmación activa convierte parte de esas ausencias en avisos anticipados,
que **liberan el turno con tiempo suficiente para reasignarlo**. En el modelo, los
turnos liberados con aviso pasan de 60 a 101 por día en la red: alrededor de 40
consultas adicionales por día si hay lista de espera.

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

### Arquitectura multitenant y anonimización en la base de datos

El módulo se ofrece como producto para más de una institución, así que se
diseña desde el inicio como **multitenant**: una misma instalación atiende a
varias instituciones sin que los datos de una sean alcanzables desde otra.

- **Aislamiento por institución en la base.** Cada fila lleva el identificador
  de la institución y la base aplica políticas de acceso por fila: una consulta
  ejecutada en el contexto de una institución no puede devolver datos de otra,
  aunque el código de la aplicación tenga un error. Dentro de la institución,
  las sedes son ámbitos de permiso.
- **Claves de cifrado por institución.** Los datos identificatorios se cifran
  con una clave propia de cada institución. Dar de baja a un cliente es
  destruir su clave.
- **Instancia dedicada como opción.** Si el pliego exige que los datos no
  compartan infraestructura con terceros o residan en el país, la misma
  aplicación se despliega en una instancia propia. Cambia el despliegue, no el
  código.

Dentro de cada institución, la base separa lo que identifica a la persona de
lo que describe la operación:

- **Seudonimización.** Nombre, documento y teléfono viven en una tabla aparte,
  cifrada, y el resto del sistema los referencia por un identificador interno
  sin significado. Los eventos de turno (agendado, llegó, pasó a consulta,
  esperó tanto, se reasignó) guardan solo ese identificador.
- **Anonimización para el análisis.** Los indicadores de gerencia y cualquier
  análisis se calculan sobre datos sin identificar y agregados por sede. El
  detalle individual se elimina al cierre de la jornada.
- **El asistente clínico no guarda audio ni transcripción.** Solo el borrador
  que el profesional revisa y firma va a la historia clínica de la
  institución. El módulo no conserva contenido clínico.
- **Sin datos identificatorios en registros técnicos.** Los registros de
  aplicación y de auditoría guardan el identificador interno, nunca nombre ni
  documento.

---

## 4 · Diferenciadores

### 4.1 Conocemos el orden correcto, y está medido

La secuencia natural de implementación —empezar por los recordatorios, que es lo
técnicamente más simple— **empeora el indicador que la institución quiere
mejorar**: lleva la espera de 36 a 51 minutos, peor que la situación actual,
anulando la ganancia previa.

Es un resultado contraintuitivo que solo aparece al simular la interacción entre
las palancas. Una propuesta que ofrezca recordatorios automáticos como primera
entrega producirá un retroceso medible en el segundo mes, que es cuando se evalúa
la continuidad del proyecto.

**Este es el diferenciador principal y es verificable:** el modelo está disponible
para su ejecución, con 64 réplicas por escenario.

### 4.2 Atacamos la espera percibida, no solo la real

La espera se sobreestima en una relación cercana a 3 a 1, e informar al paciente
mejora la satisfacción de forma significativa **con independencia de la duración
efectiva**.

Una solución centrada exclusivamente en el tablero interno deja sin aprovechar la
intervención más barata disponible. La vista de paciente no es un complemento: es
el mecanismo con mejor relación costo-resultado de la propuesta.

### 4.3 El sistema ofrece; el paciente decide

Mover pacientes de lista sin preguntarles es técnicamente más simple y
operativamente peor: reasignar es cambiar de médico, y si al paciente le importa
seguir con el suyo solo él lo sabe. Por eso el sistema no mueve a nadie: le ofrece
el cambio en su teléfono, en una ventana breve, y él decide. Nadie aprueba la
oferta antes: el consultorio libre no espera a que alguien mire el tablero y
recepción no carga con un paso más. Lo que el sistema no puede saber solo (un
paciente en tratamiento que tiene que verlo su médico, un estudio a revisar con ese
profesional) se marca una vez en el turno como "no reasignable" y queda afuera del
motor.

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

Acotar el compromiso antes de firmarlo, y saber de dónde viene la insatisfacción
antes de prometer resolverla, es lo que la línea de base de la fase 0 habilita.

---

## 5 · Resumen

| Dimensión | Resultado |
|---|---|
| Espera media de la jornada | de 45 a 36 min (−20%) con la reasignación; 38 al cierre del plan, dentro del error |
| Espera en la franja de la tarde | de 48 a 37 min; 40 al cierre del plan |
| Percentil 90 | de 106 a 82 minutos; 84 al cierre del plan |
| Pacientes atendidos dentro de los 15 min | de 34% a 40%; 37% al cierre del plan |
| Ausencias sin aviso | de 30% a 21% |
| Turnos liberados con aviso | de 60 a 101 por día |
| Uso efectivo de la agenda | de 64% a 71% |
| Volumen de atención | sin variación significativa |

*Promedio de 64 réplicas por escenario. "Al cierre del plan" es la fase 2
(confirmación activa y ajuste de la agenda); su diferencia con la fase 1 está
dentro del error del modelo. Bajar de ahí cuesta turnos: 31 minutos con 3,5% menos
de consultas, 25 con 6% menos.*
