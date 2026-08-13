# Optimización de agenda ambulatoria
## Propuesta para una red de 8 clínicas

---

## La propuesta en una línea

Un sistema que **reasigna pacientes entre consultorios en tiempo real**, obtiene
confirmación anticipada de asistencia y rediseña la grilla en función del
ausentismo medido. **Reduce la espera del paciente entre un 30% y un 35%, sin
pérdida medible de volumen de atención.**

---

## Qué resuelve

| Indicador | Hoy | Con la solución | |
|---|---|---|---|
| **Espera a las 17 h**, el horario crítico | 57 min | **40 min** | **−30%** |
| Espera media de la franja 14–17 h | 48 min | **31 min** | −35% |
| Espera media de la jornada | 44 min | **30 min** | −32% |
| Percentil 90 — el paciente peor atendido | 104 min | **68 min** | −35% |
| Pacientes atendidos dentro de los 15 min de su turno | 35% | **42%** | +7 pts |
| Ausencias sin aviso | 30% | **20%** | −10 pts |
| Cierre efectivo de la jornada | 20:00 | **19:45** | −15 min |
| Consultas atendidas por día | 796 | **791** | *sin cambio significativo* |

**Sobre el volumen de atención.** Dejar de sobreagendar reduce la cantidad de
turnos ofrecidos, lo que podría suponer una pérdida de facturación. **La
simulación no la encuentra:** la diferencia es de 5 consultas diarias sobre una
dispersión de ±71 entre réplicas, es decir, no distinguible de cero.

La explicación es que el sobreagendamiento no agrega capacidad real: agrega
turnos que en un tercio de los casos nadie ocupa. Al reducir el ausentismo, la
**tasa de uso efectivo de la agenda pasa de 65% a 71%**, y ese aumento de
eficiencia compensa la reducción de turnos ofrecidos.

> *Los tres primeros indicadores miden lo mismo sobre distintos recortes horarios.
> Se reportan los tres para evitar que la mejora aparezca sobredimensionada al
> medirse únicamente sobre el peor tramo del día.*
>
> *Todos los valores son el promedio de 8 réplicas de la jornada completa. Se
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
| 6 min | 27 min | 44 min | 53 min | 41 min | **57 min** | 78 min |

A las 9 de la mañana la agenda está en horario. **Cada hora hereda el retraso de
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
el cambio comunicándoselo al paciente. **No modifica la grilla de turnos ni los
acuerdos con los profesionales**, por lo que es la intervención de menor fricción
y la de resultado más rápido.

**Efecto aislado: espera media de 44 a 35 minutos, sin modificar la agenda.**

### 2 · Confirmación activa

El paciente confirma su asistencia o avisa que no podrá concurrir, desde su
teléfono y con un toque. El aviso anticipado tiene más valor que la asistencia:
libera el turno con tiempo suficiente para reasignarlo.

Se complementa con un evento de calendario generado al reservar, que actúa sobre
la principal causa de ausencia registrada en la literatura: el olvido.

### 3 · Rediseño de la grilla

Con las ausencias bajo control, el sobreagendamiento deja de ser necesario. El
factor pasa a ser un parámetro por sede que el sistema recomienda a partir del
ausentismo efectivamente medido, en lugar de un valor heredado.

> **Las intervenciones 2 y 3 se despliegan juntas.** Reducir ausencias sin
> rediseñar la grilla **incrementa** la espera, de 35 a 45 minutos —borrando la
> ganancia completa de la intervención anterior—: los pacientes
> recuperados ingresan en una agenda construida bajo el supuesto de que no
> concurrirían. Es un resultado contraintuitivo con consecuencias operativas
> directas, desarrollado en el plan de implementación.

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
| 0 · Visibilidad y línea de base | 3–4 semanas | 1 sede piloto |
| 1 · Pool de reasignación | 4–6 semanas | Piloto + 2 sedes |
| 2 · Confirmación y rediseño de grilla | 8–10 semanas | Red completa |

**Total estimado: 15 a 20 semanas** hasta la red completa.

---

## Nota sobre el origen de las cifras

Los resultados provienen de simular la jornada completa de la red minuto a
minuto, aplicando en cada escenario una política distinta sobre la misma
estructura de sedes, consultorios y especialidades.

Las intervenciones que modifican la grilla de turnos generan necesariamente una
agenda distinta, por lo que la comparación entre escenarios no es exacta. Para
corregirlo, **cada escenario se ejecuta 8 veces con poblaciones distintas** y se
reporta el promedio junto con su dispersión. Una única corrida no permitiría
distinguir el efecto de una política del ruido propio de la generación.

El modelo está **calibrado contra la situación reportada**: arroja 40 minutos de
espera media de jornada de 44,1 minutos y 30% de ausencias, frente a los 45
minutos y 30% informados en la reunión. Esa correspondencia es lo que permite que las mejoras proyectadas
sean comparables y no declarativas.

La reunión aportó tres cifras; el resto de los parámetros —volumen, capacidad
instalada, duración de consulta, composición por especialidad— **no fueron
provistos y debieron asumirse.** Cada supuesto está documentado en el anexo con
su fuente, su rango y el efecto sobre las conclusiones si el valor real difiere.

Las dos preguntas cuya respuesta más modifica el resultado:

1. **¿Existe lista de espera o demanda insatisfecha?** Determina si el rediseño de
   grilla tiene costo o es neutro.
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
