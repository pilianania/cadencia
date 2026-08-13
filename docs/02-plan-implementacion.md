# Plan de implementación

## Una distinción previa, porque cambia el plan

El análisis de escenarios descompone el problema en tres palancas y mide cada una
por separado. **Eso es una herramienta analítica, no una secuencia de despliegue.**

El simulador muestra algo que obliga a agrupar:

| Escenario | Espera media |
|---|---|
| Hoy | 30,7′ |
| + Reasignación | 23,7′ |
| + Recordatorios, **sin desagendar** | **27,4′** ⚠️ |
| + Desagendar | 19,3′ |

**Implementar recordatorios y detenerse ahí empeora la espera.** Los pacientes
recuperados entran en una grilla que se armó asumiendo que no iban a venir.

Por eso el plan tiene **tres fases, no cuatro**: confirmación y desagendado son
una sola decisión y se despliegan juntas. Separarlas produce un retroceso medible
justo cuando el proyecto tiene que mostrar resultados.

> Un competidor que ofrezca "recordatorios por WhatsApp" como quick win va a
> empeorar el número que el cliente quiere bajar. Y lo va a hacer en el mes 2,
> que es cuando se evalúa si el proyecto sigue.

---

## Fase 0 · Visibilidad y línea de base
**Duración estimada:** 3–4 semanas · **Alcance:** 1 sede piloto

No se puede optimizar lo que no se mide, y hoy la red no mide: la agenda vive en
teléfono y planillas. Esta fase no promete mejora, promete **saber**.

**Entregables**
- Tablero operativo en la sede piloto: agenda del día, estado de turnos, alertas
- Línea de base medida: espera percibida, espera atribuible, P90, ausencias, ocupación, tiempo muerto
- Vista de red para la Dirección de Operaciones

**Criterio de salida** — sin esto no se avanza:
- [ ] 2 semanas de datos limpios en la sede piloto
- [ ] La espera medida coincide con la percibida por el equipo (si no, el modelo está mal)
- [ ] **Profundidad de pool medida**: cuántos consultorios comparten especialidad por sede
- [ ] Recepción usa el tablero sin asistencia

**Por qué esta fase existe:** el supuesto de profundidad de pool tiene confianza
baja y determina si la fase 1 rinde. Medirlo cuesta 3 semanas; equivocarse cuesta
el proyecto.

---

## Fase 1 · Pool de reasignación
**Duración estimada:** 4–6 semanas · **Alcance:** piloto + 2 sedes

Los consultorios de una misma especialidad dejan de funcionar como colas
independientes y pasan a atender como un pool único. Es la misma razón por la que
un banco tiene una fila única en vez de una por caja.

**Efecto medido:** espera media 30,7′ → 23,7′ (−23%). P90 75′ → 58′.

**No toca la grilla de turnos ni los contratos con los profesionales.** Es la fase
de menor fricción organizacional y la que da resultado más rápido, por eso va
primero — aunque no sea la de mayor impacto.

**Entregables**
- Motor de reasignación con plan sugerido y ejecución de un clic
- Vista de paciente: teléfono con ventana estimada + pantalla de sala sin nombres
- Comunicación automática del cambio de consultorio

**Criterio de salida**
- [ ] Tasa de aceptación de sugerencias por recepción > 60% *(si no le creen al motor, el problema no es el algoritmo)*
- [ ] Reducción de espera ≥ 15% contra línea de base
- [ ] Cero incidentes de continuidad de atención por reasignación

---

## Fase 2 · Confirmación y rediseño de grilla
**Duración estimada:** 8–10 semanas · **Alcance:** red completa

Las dos palancas van juntas, por lo dicho arriba.

**a) Confirmación activa** — recordatorio con confirmación o aviso de ausencia.
Avisar vale más que asistir: libera el turno con tiempo para la lista de espera.

**b) Rediseño de grilla** — con las ausencias bajo control ya no hace falta
sobreagendar. El factor de sobreagenda pasa a ser un parámetro por sede que el
sistema recomienda a partir del ausentismo medido, no un número fijo heredado.

**Efecto medido (acumulado):** espera media 30,7′ → 19,3′ (−37%). Franja 14–17 h
34,2′ → 19,4′ (−43%). P90 75′ → 42′. La jornada cierra en horario.

**Costo explícito:** 56 consultas/día menos de capacidad nominal. Si hay lista de
espera se rellenan y el costo tiende a cero. **Este número hay que ponerlo sobre
la mesa, no en el apéndice.**

**Criterio de salida**
- [ ] Ausentismo por debajo del 22%
- [ ] Espera media por debajo de 20′ en al menos 6 de las 8 sedes
- [ ] Ocupación de consultorio no cae más de 3 puntos

---

## Estrategia de despliegue: por olas, no simultáneo

**8 sedes, 3 olas.** Una sede piloto, luego 2, luego las 5 restantes.

El brief describe ocho sedes en zonas distintas —CABA, Zona Norte, Sur, Oeste, La
Plata— con volúmenes que en nuestro modelo van de 88 a 233 turnos/día. **No son
ocho copias de la misma clínica.** Un despliegue simultáneo asume una homogeneidad
operativa que nadie verificó.

Criterio para elegir la sede piloto: **volumen medio y problema visible**. Ni la
mejor (no muestra nada) ni la peor (confunde el efecto del producto con el efecto
de arreglar un desastre).

---

# Riesgos y mitigación

Ordenados por exposición, no por probabilidad.

## 🔴 R1 · Desplegar la confirmación sin rediseñar la grilla
| | |
|---|---|
| **Probabilidad** | Alta — es el atajo que todos quieren tomar |
| **Impacto** | Alto — retroceso medido de 23,7′ a 27,4′ |
| **Mitigación** | Las dos palancas se despliegan como una sola fase, con un solo criterio de salida. Está en el plan por diseño, no por prudencia. |

El riesgo no es técnico, es de gobierno del proyecto: alguien va a proponer
"soltemos los recordatorios ya, que es lo fácil". La respuesta está medida.

## 🔴 R2 · Pool fragmentado
| | |
|---|---|
| **Probabilidad** | Media — supuesto de confianza baja |
| **Impacto** | Alto — la fase 1 no rinde |
| **Mitigación** | Se mide en fase 0, **antes** de comprometer el resultado de la fase 1. Si la red está fragmentada, el valor se recompone sobre las fases 0 y 2, que no dependen de la estructura de la oferta. |

## 🟠 R3 · Integración con el sistema existente
| | |
|---|---|
| **Probabilidad** | Alta — no sabemos qué usan además de las planillas |
| **Impacto** | Medio-alto — puede duplicar el plazo |
| **Mitigación** | Fase 0 arranca con descubrimiento técnico. La arquitectura funciona **standalone**: el tablero no requiere integración para dar valor, la integración mejora la carga de datos pero no la habilita. |

## 🟠 R4 · Rechazo del equipo médico
| | |
|---|---|
| **Probabilidad** | Media-alta |
| **Impacto** | Alto — sin los profesionales no hay proyecto |
| **Mitigación** | El carril de deriva hace visible cuánto se atrasa cada consultorio. Eso se lee fácil como herramienta de control individual. **Durante fases 0 y 1 las métricas se reportan por sede, nunca por profesional**, y el acceso a la vista de consultorio queda en el equipo operativo. La conversación sobre desempeño individual, si llega, es del cliente y es posterior. |

Este riesgo es el más subestimado. La herramienta es técnicamente inocua y
políticamente sensible.

## 🟠 R5 · Recepción no confía en el motor y vuelve a la planilla
| | |
|---|---|
| **Probabilidad** | Media |
| **Impacto** | Alto — el producto queda instalado y sin uso |
| **Mitigación** | El sistema **propone y no ejecuta**: recepción decide. El plan no genera intercambios cruzados aunque sean óptimos en minutos, porque un plan ilegible destruye la confianza. Se mide tasa de aceptación de sugerencias como métrica de producto, no de vanidad. |

## 🟡 R6 · Baja penetración digital de la cartera
| | |
|---|---|
| **Probabilidad** | Media |
| **Impacto** | Medio — debilita la fase 2 |
| **Mitigación** | Se mide en el piloto antes de escalar. Canal múltiple con degradación: WhatsApp → SMS → llamado. El supuesto de 35% de reducción ya es el extremo conservador de la literatura. |

## 🟡 R7 · Conectividad intermitente en sedes
| | |
|---|---|
| **Probabilidad** | Media |
| **Impacto** | Medio — un mostrador paralizado es peor que una planilla |
| **Mitigación** | Operación degradada local: el tablero mantiene el estado del día en el dispositivo y sincroniza al recuperar conexión. **Nunca puede quedar peor que la planilla que reemplaza.** |

## 🟡 R8 · Exposición de datos de salud
| | |
|---|---|
| **Probabilidad** | Baja |
| **Impacto** | Alto — regulatorio y reputacional |
| **Mitigación** | Minimización por diseño: las pantallas públicas no muestran nombres, el vínculo persona–especialidad nunca se expone en sala. Ver sección de compliance. |

---

## Equipo y esfuerzo estimado

| Rol | Fase 0 | Fase 1 | Fase 2 |
|---|---|---|---|
| Product Owner | 50% | 50% | 50% |
| Desarrollo | 1,5 | 2 | 2 |
| Diseño | 0,5 | 0,5 | 0,25 |
| Implantación / capacitación | 0,5 | 1 | 1,5 |

**Duración total estimada: 15 a 20 semanas** hasta red completa en fase 2.

La implantación crece fase a fase mientras el desarrollo se mantiene estable: el
problema deja de ser construir y pasa a ser **hacer que ocho equipos distintos
cambien cómo trabajan**. Subdimensionar esa línea es la forma más común de que un
proyecto correcto fracase.
