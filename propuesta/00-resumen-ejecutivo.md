# Optimización de agenda ambulatoria
## Propuesta para una red de 8 clínicas

---

## El problema, reformulado

La reunión inicial identificó tres síntomas: 45 minutos de espera promedio, 30%
de ausencias sin aviso y tiempos muertos del personal médico.

**No son tres problemas. Son uno.**

Con el 30% de la agenda vacía, la demora se disolvería sola en los huecos. Que
ambos números convivan solo se explica por **sobreagendamiento**: la institución
agenda turnos más juntos que su duración real para cubrirse de las ausencias. Los
días en que los pacientes sí concurren, la sala de espera se satura.

Es una apuesta estadística contra el propio paciente, y la paga quien llegó
puntual.

Esta reformulación tiene una consecuencia directa sobre el plan: **reducir las
ausencias es lo que habilita dejar de sobreagendar, y eso es lo que reduce la
espera.** El orden de las intervenciones no es una preferencia metodológica; se
deriva del mecanismo.

---

## Resultado esperado

Simulación sobre una jornada completa de la red, con la misma población de
pacientes, las mismas duraciones de consulta y las mismas llegadas en todos los
escenarios. La única variable es la política aplicada.

| Indicador | Situación actual | Con la propuesta implementada |
|---|---|---|
| Espera media percibida | 30,7 min | **19,3 min** (−37%) |
| Espera en la franja 14–17 h | 34,2 min | **19,4 min** (−43%) |
| Percentil 90 de espera | 75 min | **42 min** |
| Pacientes atendidos dentro de los 15 min de su turno | 47% | **55%** |
| Ausencias sin aviso | 33% | **21%** |
| Cierre efectivo de la jornada | 20:00 | **19:00** |

**Contrapartida, declarada:** la propuesta reduce la capacidad nominal en
aproximadamente 56 consultas diarias al dejar de sobreagendar. Si la red tiene
lista de espera, esos turnos se reasignan y el costo tiende a cero. Si no la
tiene, es una decisión explícita entre volumen y experiencia, y así debe tomarse.

---

## Las tres intervenciones

### 1 · Pool de reasignación

Los consultorios de una misma especialidad dejan de operar como colas
independientes y pasan a atender como un recurso único, del mismo modo que una
entidad bancaria opera con fila única en lugar de una fila por caja.

No modifica la grilla de turnos ni los acuerdos con los profesionales. Es la
intervención de menor fricción y la de resultado más rápido.

**Efecto aislado: espera media de 30,7 a 23,7 minutos.**

### 2 · Confirmación activa

El paciente confirma su asistencia o avisa que no podrá concurrir, desde su
teléfono y con un toque. El aviso anticipado es más valioso que la asistencia:
libera el turno con tiempo suficiente para reasignarlo.

Se complementa con un evento de calendario generado al reservar, que actúa sobre
la principal causa de ausencia registrada en la literatura: el olvido.

### 3 · Rediseño de la grilla

Con las ausencias bajo control, el sobreagendamiento deja de ser necesario. El
factor de sobreagenda pasa a ser un parámetro por sede que el sistema recomienda
a partir del ausentismo efectivamente medido, en lugar de un valor heredado.

> **Las intervenciones 2 y 3 se despliegan juntas.** La simulación muestra que
> reducir ausencias sin rediseñar la grilla **empeora** la espera, de 23,7 a 27,4
> minutos: los pacientes recuperados ingresan en una agenda construida bajo el
> supuesto de que no concurrirían. Es un resultado contraintuitivo con
> consecuencias operativas concretas, y está documentado en el plan de
> implementación.

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

## Sobre los supuestos de este análisis

La reunión inicial aportó tres cifras. El resto de los parámetros del modelo
—volumen, capacidad instalada, duración de consulta, composición por
especialidad— **no fueron provistos y debieron asumirse.**

Cada supuesto está documentado con su fuente, su rango plausible y el efecto que
tendría sobre las conclusiones si el valor real difiere. El detalle completo se
encuentra en el anexo.

Los dos supuestos que más condicionan el resultado, y que constituyen las
primeras preguntas a responder:

1. **¿Existe lista de espera o demanda insatisfecha?** Determina si el rediseño
   de grilla tiene costo o es neutro.
2. **¿Cuántos consultorios por especialidad opera cada sede?** Determina el
   rendimiento de la intervención 1.

El modelo está parametrizado: ante un supuesto distinto, los resultados se
recalculan y se presentan actualizados.

---

## Índice de la propuesta

1. [Plan de implementación y riesgos](01-plan-implementacion.md)
2. [Propuesta de valor, compliance y diferenciadores](02-propuesta-valor.md)
3. [Caso de negocio](03-caso-de-negocio.md)
4. [Anexo: supuestos, fuentes y sensibilidad](anexo-supuestos.md)
