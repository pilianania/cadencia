# Plan de implementación

## Criterio de ordenamiento

El análisis descompone el problema en tres palancas y mide el efecto aislado de
cada una. Esa descomposición es analítica: **no constituye una secuencia de
despliegue.**

| Escenario simulado | Media de la jornada | A las 17 h | Ausencias sin aviso |
|---|---|---|---|
| Situación actual | 45 min | **56 min** | 32% |
| + Pool de reasignación | 36 min | 45 min | 32% |
| + Confirmación activa, sin ajustar la agenda | **51 min** | 67 min | 22% |
| + Ajuste de la agenda, conservando el volumen | 38 min | 48 min | 21% |

*Promedio de 64 réplicas de la jornada completa. La diferencia entre 36 y 38
minutos está dentro del error del modelo.*

Por qué la fase 1 va antes: es la única palanca que baja la espera por sí
sola. La fase 2 sin la fase 1 deja la espera en 47 minutos (peor que hoy) y
los recordatorios solos en 59: la reasignación es lo que absorbe la
variabilidad de llegadas, y su ganancia es lo que la fase 2 protege. Además no
modifica la agenda ni los acuerdos con los profesionales, y no depende de que
los pacientes adopten nada.

> **El modelo está calibrado contra la cifra reportada.** La media de la jornada
> en la situación actual es de 45 minutos, en línea con los 45 informados. La
> columna de las 17 horas muestra el pico, 56 minutos, que es el momento en que
> se concentran los reclamos.
>
> Ambos indicadores conducen a la misma conclusión sobre el orden de las fases.

Implementar la confirmación activa y detenerse allí **incrementa la espera por
encima de la situación actual**: los pacientes recuperados ingresan en una agenda
construida bajo el supuesto de que no concurrirían. Ajustar la agenda a la vez
protege la ganancia de la reasignación y baja las ausencias con el mismo volumen
de consultas.

En consecuencia, el plan contempla **tres fases**. La confirmación activa y el
ajuste de la agenda constituyen una única decisión y se despliegan en conjunto.
Separarlas produce un retroceso medible en el momento en que el proyecto debe
acreditar resultados.

---

## Fase 0 · Visibilidad y línea de base

**Duración estimada:** 3 a 4 semanas · **Alcance:** una sede piloto

La red no dispone hoy de medición: la agenda opera sobre teléfono y planillas
compartidas. Esta fase no compromete mejora; compromete **información**.

### Entregables

- Tablero operativo en la sede piloto: agenda del día, estado de turnos, alertas
- Línea de base operativa: espera percibida, espera atribuible, percentil 90,
  ausencias, ocupación, tiempo muerto
- Línea de base de satisfacción y sus causas
- Vista consolidada para la Dirección de Operaciones

### Estudio de línea de base

Medir minutos no es suficiente. Sin una medición previa de la insatisfacción y
sus causas, al cierre del proyecto será posible acreditar que la espera se
redujo, pero no que la experiencia mejoró — que es el objetivo planteado en la
reunión inicial.

Se replica el diseño del [estudio publicado en la Revista Argentina de Salud
Pública](https://rasp.msal.gov.ar/rasp/articulos/vol13/AO_GarciaMunitis44.pdf),
con tres adaptaciones:

| | Estudio de referencia | Adaptación |
|---|---|---|
| Instrumento | CAHPS, validado internacionalmente | El mismo, para permitir comparación contra literatura publicada |
| Pregunta principal | Satisfacción global con el profesional | Satisfacción **específica con la espera**, además de la global |
| Aplicación | Post-visita en sala | Igual, con encuestador ajeno al sector |

**Fundamento de la adaptación:** un instrumento de satisfacción global arroja
valores altos y estables que no reflejan variaciones en la espera. El propio
estudio de referencia lo evidencia —mediana de 10 sobre 10— y existen trabajos
que reportan 95% de satisfacción global junto a 26% de insatisfacción específica
con el tiempo de espera en la misma muestra.

**Cómo se mide, en concreto.**

- *Línea de base (fase 0, sede piloto).* Encuesta presencial al salir de la
  consulta, hecha por una persona ajena a recepción, a todos los pacientes que
  acepten durante dos semanas hasta juntar 400 casos (el estudio de
  referencia usó 423). Tres preguntas cerradas y una abierta: satisfacción con
  la espera de hoy (0 a 10), cuánto cree que esperó (minutos), satisfacción con
  la atención (0 a 10), y qué cambiaría. Se registra junto con la espera real
  que el módulo midió para ese turno, sin nombre: número de turno y sede.
- *En operación (desde la fase 1, continua).* Las mismas dos primeras preguntas
  desde el teléfono, cuando el módulo registra que la consulta terminó, con
  respuesta de un toque; se responde en menos de un minuto y no se repite más
  de una vez por mes al mismo paciente. Cada respuesta queda unida a la espera
  real de ese turno: por eso se puede reportar, por sede y por período,
  satisfacción media, espera percibida contra espera real y proporción de
  pacientes que califican la espera con 7 o más.
- *Corrección del sesgo de quién responde.* Una vez por trimestre se repite la
  encuesta presencial en sala sobre una muestra chica (100 casos por sede)
  para comparar con lo que llega por teléfono; si difieren, se ajusta el peso de
  las respuestas telefónicas.
- *Qué se mira.* No el puntaje global, que la literatura muestra alto y estable,
  sino la satisfacción específica con la espera y su relación con la espera real
  y percibida. Es la métrica que permite comparar la espera medida con la que el paciente
  percibe.

### Relevamiento de causas de ausencia

**Canal principal: mensaje en la aplicación o WhatsApp**, dentro de las dos horas
posteriores al turno no concurrido. Una pregunta, respuesta de un toque:

> No pudimos verte hoy a las 10:30. ¿Qué pasó?
> Me olvidé · Me surgió algo · No me sentía bien · No pude llegar · Otro
>
> ¿Querés que te demos otro turno? Sí / No por ahora

El llamado telefónico se descarta como canal principal por costo y escalabilidad;
se reserva para el caso en que la cartera resulte mayoritariamente adulta mayor.

El relevamiento tiene **doble retorno**: releva la causa y recupera el turno en
el mismo mensaje. Constituye además una validación manual del mecanismo de la
fase 2 antes de construirlo.

**Control de sesgo de no respuesta.** El paciente que no concurrió es también el
menos propenso a responder un mensaje. Relevando únicamente por ese canal se
mediría la conducta del segmento que sí lee mensajes, que es precisamente aquel
en el que la confirmación activa resulta efectiva.

Para corregirlo, una muestra reducida de no respondedores se contacta
telefónicamente y se contrasta la distribución de causas. Si coincide, el canal
digital es representativo. Si difiere, la fase 2 rendirá menos en un segmento
identificable y dimensionable.

### Criterios de salida

- [ ] Dos semanas de datos operativos consistentes en la sede piloto
- [ ] Estudio de satisfacción con muestra suficiente y causas codificadas
- [ ] Causas de ausencia relevadas localmente
- [ ] Tasa de recuperación de turno por mensaje medida
- [ ] Sesgo de no respuesta contrastado
- [ ] Composición por especialidad relevada en cada sede
- [ ] Recepción opera el tablero sin asistencia

### Fundamento de la fase

Tres supuestos de confianza baja —composición por especialidad, causas de
insatisfacción y causas de ausencia— determinan de qué palanca proviene el
resultado. Relevarlos requiere tres semanas.

Sin esa medición inicial no hay forma de demostrar la mejora ni de decidir con
datos qué ajustar en las fases siguientes: cualquier cifra posterior se puede
discutir.

---

## Fase 1 · Pool de reasignación

**Duración estimada:** 4 a 6 semanas · **Alcance:** piloto y dos sedes adicionales

Los consultorios de una misma especialidad dejan de operar como colas
independientes y pasan a atender como un recurso único.

**Efecto medido:** espera media de 45 a 36 minutos (−20%). Percentil 90 de 106 a
82 minutos. Pacientes atendidos dentro de los 15 minutos de 34% a 40%.

No modifica la agenda de turnos ni los acuerdos con los profesionales. Es la fase
de menor fricción organizacional y de resultado más rápido, razón por la cual
antecede a las de mayor impacto.

### Entregables

- Motor de reasignación con plan sugerido y ejecución asistida
- Vista de paciente: estimación por ventana en su teléfono
- Pantalla de sala de espera
- Comunicación automática del cambio de consultorio

### Criterios de salida

- [ ] Tasa de aceptación de las sugerencias por parte de recepción superior al 60%
- [ ] Reducción de espera igual o superior al 15% contra línea de base
- [ ] Sin incidentes de continuidad de atención derivados de reasignaciones

---

## Fase 2 · Confirmación activa y ajuste de la agenda

**Duración estimada:** 8 a 10 semanas · **Alcance:** red completa

Ambas intervenciones se despliegan en conjunto, por el fundamento expuesto al
inicio.

**a) Confirmación activa.** El paciente confirma su asistencia o informa que no
podrá concurrir. El aviso anticipado tiene mayor valor que la asistencia: libera
el turno con tiempo suficiente para reasignarlo. Se complementa con un evento de
calendario generado en el momento de la reserva.

**b) Ajuste de la agenda.** Con las ausencias bajo control, el sobreagendamiento
deja de ser necesario. El factor pasa a ser un parámetro por sede que el sistema
recomienda a partir del ausentismo medido.

**Efecto medido:** la espera media se mantiene en el nivel de la fase 1 (de 36 a
38 minutos, diferencia dentro del error del modelo) y las ausencias sin aviso
bajan de 32% a 21% con el mismo volumen de consultas. Los turnos perdidos sin
aviso pasan de 368 a 213 por día; los liberados con aviso, de 60 a 101, y quedan
disponibles para la lista de espera.

**Qué protege esta fase:** los recordatorios sin ajustar la agenda llevan la
espera de 36 a 51 minutos, peor que hoy. El ajuste de la agenda evita ese
retroceso y consolida la ganancia de la fase 1.

**Sobre el volumen:** las consultas atendidas pasan de 786 a 793 por día sobre
una dispersión de ±68 entre réplicas, es decir, no distinguible de cero. Se
ofrecen menos turnos (de 1.220 a 1.110) pero se atienden los mismos, porque
dejan de perderse. El uso efectivo de la agenda pasa de 64% a 71%.

**Por qué no menos:** bajar por debajo de los 36 a 38 minutos cuesta turnos. Sin ninguna
sobreagenda la espera queda en 31 minutos con 3,5% menos de consultas (28 por día);
con la primera consulta más larga, en 25 con 6% menos (49 por día); con ambas, en
21 con 9% menos (70 por día); alargando todos los turnos, en 17 con 11% menos (89
por día). La primera consulta más larga es la fase 3 y se paga con los pacientes que
retiene; la fase 0 mide cuánto dura de verdad la primera consulta para fijar el
multiplicador. Las otras son decisiones de la institución, no parte del
compromiso.

### Criterios de salida

- [ ] Ausentismo por debajo del 22%
- [ ] Espera media que no supere la de la fase 1 en ninguna sede (sin retroceso)
- [ ] Ocupación de consultorio sin caída superior a 3 puntos

---

## Métricas que acompañan al producto

El análisis se apoya en supuestos declarados; el producto los reemplaza por
datos propios y los sigue mientras opera. Estas son las métricas que el módulo
registra de forma continua, desde qué fase existen y para qué sirven. Todas se
ven en la vista Por período, en la red y en cada sede, por día, mes y año; las que el
prototipo no puede simular figuran ahí como pendientes.

| Métrica | Qué mide | De dónde sale | Desde | Para qué sirve |
|---|---|---|---|---|
| Espera media, percentil 90 y proporción atendida dentro de los 15 minutos | La demora del paciente respecto de su hora, en total y por sede | Registro de llegada, inicio y fin de cada consulta | Fase 0 | Es el indicador del contrato con el paciente; los 15 minutos son el umbral de satisfacción de la literatura |
| Ausencias sin aviso y turnos liberados con aviso | Cuántos turnos se pierden y cuántos se recuperan a tiempo | Desenlace de cada turno | Fase 0 | Mide el efecto de la confirmación y alimenta la lista de espera |
| Uso efectivo de la agenda | Consultas atendidas sobre turnos ofrecidos | Agenda y desenlaces | Fase 0 | Muestra que ajustar la agenda no pierde volumen |
| Consultorio libre con sala llena | Horas de consultorio sin paciente mientras hay gente esperando, separando si hay alguien de la misma especialidad (recuperable reasignando) o solo de otras (se resuelve planificando la agenda), y su costo | Estado de consultorios y sala minuto a minuto | Fase 0 | Es la capacidad que recupera la reasignación |
| Sobreagendamiento | Minutos de turno ofrecidos sobre minutos de consultorio disponibles, por especialidad y sede | Agenda tal como está armada | Fase 0 | El análisis asume 10% (1,10 minutos de turno por minuto disponible); es la palanca de la fase 2 y define cuánto se ajusta la agenda sin perder volumen |
| Proporción de primeras consultas, por especialidad | Qué parte de los turnos es primera consulta | La pregunta al reservar el turno | Fase 0 | Reemplaza el supuesto del 17% del análisis y dimensiona el turno diferenciado |
| Duración real de la consulta sobre el turno agendado, por especialidad y por tipo (primera consulta o control) | Cuánto más dura la consulta que el turno agendado | Inicio y fin de cada consulta | Fase 0 (por sede en las fases 0 y 1; por profesional recién cuando el equipo médico lo acuerde) | Decide si conviene el turno diferenciado y cuánto |
| Reasignaciones propuestas, ofrecidas y aceptadas, y minutos ahorrados | Cuánto propone el motor y cuánto aceptan recepción y pacientes | Motor de reasignación y respuestas | Fase 1 | Criterio de salida de la fase 1 (aceptación superior al 60%) y ajuste de la ganancia mínima |
| Confirmaciones enviadas y respondidas, y avisos de inasistencia | Cuántos pacientes responden y cuántos avisan que no van | Mensajes y respuestas | Fase 2 | Mide la palanca que baja las ausencias y calibra cuánto se puede dejar de sobreagendar |
| Pacientes que vuelven | Proporción de los pacientes atendidos en un período que vuelven a atenderse en la red dentro de una ventana (12 meses por defecto, porque un paciente activo hace 2 consultas por año; configurable por especialidad), por sede | Registro de turnos del propio módulo (el mismo paciente, otra consulta) | Fase 0, con el primer valor completo al año | Mide la retención y permite ver si al bajar la espera vuelven más pacientes; es el dato para decidir si conviene resignar turnos por menos espera |
| Satisfacción con la espera | Cómo califica el paciente su espera (0 a 10) y cuánto cree que esperó, unido a la espera real de ese turno | Dos preguntas desde el teléfono al terminar la consulta; encuesta presencial en la fase 0 y una muestra trimestral para corregir sesgo (ver "Cómo se mide") | Fase 0, repetida por período | Permite comparar la espera medida con la que el paciente percibe |

## Estrategia de despliegue

**Tres olas: una sede piloto, dos sedes, cinco sedes.**

La red opera en zonas heterogéneas —CABA, Zona Norte, Zona Sur, Zona Oeste y La
Plata— con volúmenes que en el modelo varían entre 88 y 233 turnos diarios. Un
despliegue simultáneo presupone una homogeneidad operativa que no ha sido
verificada.

Criterio de selección de la sede piloto: **volumen intermedio y problema visible.**
Una sede con buen desempeño no permite observar el efecto; una sede en situación
crítica confunde el efecto de la solución con el de normalizar una excepción.

---

# Riesgos y mitigación

Ordenados por exposición.

## R1 · Despliegue parcial de la fase 2

| | |
|---|---|
| Probabilidad | Alta |
| Impacto | Alto: retroceso medido de 36 a 51 minutos, peor que la situación actual, que anula la ganancia de la fase 1 |
| Mitigación | Confirmación activa y ajuste de la agenda constituyen una única fase con un único criterio de salida |

Es un riesgo de gobierno del proyecto, no técnico. La presión por anticipar la
componente de menor complejidad técnica es previsible, y el efecto está
cuantificado.

## R2 · Composición fragmentada por especialidad

| | |
|---|---|
| Probabilidad | Media — supuesto de confianza baja |
| Impacto | Alto — la fase 1 no produce resultado |
| Mitigación | Se releva en fase 0, antes de comprometer el resultado de la fase 1. Ante una composición fragmentada, el valor se recompone sobre las fases 0 y 2, que no dependen de la estructura de la oferta |

## R3 · Integración con sistemas existentes

| | |
|---|---|
| Probabilidad | Alta — no se dispone de información sobre el stack actual |
| Impacto | Medio-alto — puede duplicar plazos |
| Mitigación | La fase 0 incorpora descubrimiento técnico. La arquitectura opera de forma autónoma: la integración optimiza la carga de datos, no condiciona el funcionamiento |

## R4 · Resistencia del equipo médico

| | |
|---|---|
| Probabilidad | Media-alta |
| Impacto | Alto |
| Mitigación | Durante las fases 0 y 1 los indicadores se reportan por sede, nunca por profesional. El acceso a la vista por consultorio permanece en el equipo operativo |

La visualización del corrimiento por consultorio admite lectura como instrumento
de control individual. La eventual conversación sobre desempeño individual
corresponde a la institución y es posterior a la adopción de la herramienta.

## R5 · Baja adopción por parte de recepción

| | |
|---|---|
| Probabilidad | Media |
| Impacto | Alto — la solución queda instalada sin uso |
| Mitigación | El motor no le agrega trabajo a recepción: las ofertas de cambio salen solas al teléfono del paciente y el que decide es él. Lo que recepción sí usa se diseñó para el mostrador: cada alerta dice qué hacer y el plan no propone intercambios cruzados entre consultorios. La tasa de aceptación de los pacientes se monitorea como indicador de producto |

## R6 · Baja penetración digital de la cartera

| | |
|---|---|
| Probabilidad | Media |
| Impacto | Medio — debilita la fase 2 |
| Mitigación | Se releva en el piloto antes de escalar. Canal múltiple con degradación: aplicación, WhatsApp, SMS, llamado. El supuesto de efectividad ya corresponde al extremo conservador de la literatura |

## R7 · Conectividad intermitente

| | |
|---|---|
| Probabilidad | Media |
| Impacto | Medio |
| Mitigación | Operación degradada local: el tablero conserva el estado de la jornada en el dispositivo y sincroniza al restablecerse la conexión. La solución no puede resultar menos confiable que la planilla que reemplaza |

## R8 · Exposición de datos de salud

| | |
|---|---|
| Probabilidad | Baja |
| Impacto | Alto — regulatorio y reputacional |
| Mitigación | Minimización por diseño. Las superficies compartidas —pantalla de sala, evento de calendario— no exponen identidad ni especialidad. Detalle en la propuesta de valor |

---

## Horas de trabajo

El proyecto completo son unas **2.750 horas de trabajo**, repartidas así por
perfil y por fase. Es lo que se cotiza; cuántas personas las hacen y en cuánto
tiempo se decide con la institución.

| Perfil | Fase 0 | Fase 1 | Fase 2 | Total |
|---|---|---|---|---|
| Responsable de producto | 70 | 100 | 180 | 350 |
| Desarrollo | 210 | 400 | 720 | 1.330 |
| Diseño | 70 | 100 | 90 | 260 |
| Implantación y capacitación | 70 | 200 | 540 | 810 |
| **Total** | **420** | **800** | **1.530** | **2.750** |

Desarrollo concentra la mitad; implantación crece con las fases porque el
trabajo pasa de construir el módulo a ponerlo en marcha en ocho sedes con
equipos y costumbres distintas. El responsable de producto suma 350 horas, un
día y medio por semana: decide prioridades, valida con la institución y
destraba, y en un proyecto de este tamaño no ocupa más.

## Plazo

**15 a 20 semanas** para las fases 0 a 2, más 2 a 3 de la fase 3, como
propuesta: la información inicial no fija fecha. Lo fijo son las 2.750 horas;
la fase 3 no suma horas de desarrollo. Con más tiempo, menos horas por
semana (30 semanas son 90 por semana en vez de 150); con menos tiempo,
más horas por semana hasta 12 semanas, porque la fase 0 necesita al menos
tres semanas de datos reales y el despliegue por olas requiere que cada sede
se estabilice antes de abrir la siguiente.
