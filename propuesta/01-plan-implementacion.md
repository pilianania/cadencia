# Plan de implementación

## Criterio de ordenamiento

El análisis descompone el problema en tres palancas y mide el efecto aislado de
cada una. Esa descomposición es analítica: **no constituye una secuencia de
despliegue.**

| Escenario simulado | Media de la jornada | A las 17 h |
|---|---|---|
| Situación actual | 32,1 min ±4,4 | **40 min** |
| + Pool de reasignación | 23,4 min ±4,4 | 30 min |
| + Confirmación activa, sin rediseñar la grilla | **30,7 min** ±5,5 | 38 min |
| + Rediseño de grilla | 20,2 min ±1,4 | 27 min |

*Promedio de 8 réplicas de la jornada completa.*

> **Por qué la media de la jornada no es 45 minutos.** La cifra reportada
> corresponde al pico de la tarde, que es cuando se generan los reclamos, no al
> promedio del día. El modelo arroja 40 minutos a las 17 horas y 60 a las 18,
> mientras que a las 9 de la mañana la agenda opera en horario. La media de la
> jornada es necesariamente inferior porque incorpora las primeras horas.
>
> Se utiliza la media para comparar escenarios porque es el indicador más
> estable; la columna de las 17 horas permite el contraste con la experiencia
> reportada. Ambas conducen a la misma conclusión sobre el orden de las fases.

Implementar la confirmación activa y detenerse allí **incrementa la espera**: los
pacientes recuperados ingresan en una agenda construida bajo el supuesto de que
no concurrirían.

En consecuencia, el plan contempla **tres fases**. La confirmación activa y el
rediseño de grilla constituyen una única decisión y se despliegan en conjunto.
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

La línea de base es además la condición para **contratar por resultado**: sin
medición previa con instrumento validado, toda mejora posterior queda sujeta a
apreciación.

---

## Fase 1 · Pool de reasignación

**Duración estimada:** 4 a 6 semanas · **Alcance:** piloto y dos sedes adicionales

Los consultorios de una misma especialidad dejan de operar como colas
independientes y pasan a atender como un recurso único.

**Efecto medido:** espera media de 32,1 a 23,4 minutos. Percentil 90 de 78 a 55
minutos.

No modifica la grilla de turnos ni los acuerdos con los profesionales. Es la fase
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

## Fase 2 · Confirmación activa y rediseño de grilla

**Duración estimada:** 8 a 10 semanas · **Alcance:** red completa

Ambas intervenciones se despliegan en conjunto, por el fundamento expuesto al
inicio.

**a) Confirmación activa.** El paciente confirma su asistencia o informa que no
podrá concurrir. El aviso anticipado tiene mayor valor que la asistencia: libera
el turno con tiempo suficiente para reasignarlo. Se complementa con un evento de
calendario generado en el momento de la reserva.

**b) Rediseño de grilla.** Con las ausencias bajo control, el sobreagendamiento
deja de ser necesario. El factor pasa a ser un parámetro por sede que el sistema
recomienda a partir del ausentismo medido.

**Efecto acumulado:** espera media de 32,1 a 20,2 minutos (−37%). Franja 14–17 h
de 32,9 a 19,8 minutos (−40%). Percentil 90 de 78 a 48 minutos. La jornada cierra
en horario.

**Sobre el volumen:** la reducción es de 9 consultas diarias sobre una dispersión
de ±71 entre réplicas, es decir, no distinguible de cero. La tasa de uso efectivo
de la agenda pasa de 63% a 72%, compensando la reducción de turnos ofrecidos.

### Criterios de salida

- [ ] Ausentismo por debajo del 22%
- [ ] Espera media por debajo de 20 minutos en al menos 6 de las 8 sedes
- [ ] Ocupación de consultorio sin caída superior a 3 puntos

---

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
| Impacto | Alto — retroceso medido de 23,4 a 30,7 minutos |
| Mitigación | Confirmación activa y rediseño de grilla constituyen una única fase con un único criterio de salida |

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
| Mitigación | El sistema propone y no ejecuta: la decisión permanece en recepción. El plan de reasignación excluye movimientos cruzados entre consultorios, que resultan ilegibles en el mostrador. La tasa de aceptación de sugerencias se monitorea como indicador de producto |

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

## Equipo y dedicación estimada

| Rol | Fase 0 | Fase 1 | Fase 2 |
|---|---|---|---|
| Product Owner | 50% | 50% | 50% |
| Desarrollo | 1,5 | 2 | 2 |
| Diseño | 0,5 | 0,5 | 0,25 |
| Implantación y capacitación | 0,5 | 1 | 1,5 |

**Duración total estimada: 15 a 20 semanas** hasta red completa.

La dedicación de implantación crece a lo largo del proyecto mientras la de
desarrollo permanece estable. Responde a que el eje del trabajo se desplaza de la
construcción hacia la adopción por parte de ocho equipos con prácticas
establecidas y heterogéneas.
