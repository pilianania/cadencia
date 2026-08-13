# Supuestos del análisis

> Esta sección va **al frente** de la propuesta, no en un apéndice.
>
> El brief describe una operación con tres números duros —45 minutos de espera,
> 30% de ausencias, 8 sedes— y nada más. Todo el resto del análisis se apoya en
> supuestos. Declararlos es lo que permite discutirlos.
>
> **Todo supuesto lleva su fuente.** Donde no existe fuente pública lo decimos con
> esas palabras en lugar de disfrazarlo de estimación: un supuesto declarado como
> tal se puede discutir, uno disfrazado se descubre en la reunión.
>
> Cada supuesto indica además **qué cambia en la conclusión si el valor real es otro**.
> Los parámetros viven en `lib/supuestos.ts` y el modelo se recalcula con
> `npm run analisis`: si en la reunión discuten un número, se cambia y se muestra
> el resultado nuevo en el momento.

---

## 0. Jurisdicción — el supuesto que más arrastra

**El brief no dice en qué país opera la red.** Menciona HIPAA, que es normativa
de Estados Unidos, pero describe una operación sin otras señales geográficas.

**Asumimos Argentina.**

Es el supuesto de mayor alcance porque arrastra tres cosas a la vez: el marco
regulatorio aplicable, el orden de magnitud de los valores económicos y la
estrategia de canal para los recordatorios.

| Si la jurisdicción es | Qué cambia |
|---|---|
| **Argentina** (asumido) | Aplica Ley 25.326 de Protección de Datos Personales (datos de salud = sensibles, arts. 2 y 7) y Ley 26.529 de Derechos del Paciente. HIPAA **no es vinculante**, pero lo adoptamos como estándar de diseño. |
| **Estados Unidos** | HIPAA pasa a ser obligación legal, no elección de diseño. Los valores económicos cambian un orden de magnitud. La arquitectura no cambia. |
| **Otro país de LATAM** | Hay que mapear la ley local de protección de datos. La estructura del caso de negocio se sostiene. |

**Por qué esto es una fortaleza y no una debilidad:** diseñamos contra el estándar
más exigente de los dos. Si la respuesta es Estados Unidos, ya cumplimos. Si es
Argentina, cumplimos de sobra. Un proveedor que copió una sección de compliance
con la palabra "HIPAA" no puede decir lo mismo.

---

## 1. Operación

### 1.1 Volumen y capacidad

| | |
|---|---|
| **Asumido** | 1.371 turnos/día en la red · 42 consultorios · 171 turnos por sede |
| **Rango** | 900 – 1.800 turnos/día · 24 – 60 consultorios |
| **Base** | Derivado de los supuestos 1.2 y 1.3. El brief solo dice "8 clínicas ambulatorias". La capacidad se calibró para que la **utilización quede apenas por debajo de 1**, que es el régimen congestionado-pero-estable que describe la Directora: por encima de 1 la cola crecería sin techo y habría pacientes atendiéndose a las 22:00 |
| **Confianza** | Media |

**Sensibilidad — medida, y no es lo intuitivo.**

Lo que gobierna el resultado no es el tamaño de la red sino su **utilización**: la
relación entre demanda y capacidad. Comprobado sobre el simulador:

| Configuración | Espera base | Con las 3 fases | Mejora |
|---|---|---|---|
| Red completa (8 sedes, 1.371 turnos, 42 consultorios) | 30,7′ | 19,3′ | **−37%** |
| Subconjunto más congestionado (4 sedes, 690 turnos, 21 consultorios) | 39,5′ | 19,4′ | **−51%** |
| Una sede con la **misma** capacidad y **la mitad** de la demanda | 56,8′ | — | la espera cae sola a **4,2′** |

Tres lecturas:

1. **El beneficio absoluto sí escala con el volumen.** Media red, la mitad de los
   minutos ahorrados.
2. **El porcentaje de mejora no depende del tamaño, depende de la congestión.**
   Cuanto más congestionada la sede, más hay para recuperar.
3. **Sin congestión no hay nada que optimizar.** Si la red tuviera capacidad de
   sobra, la espera se resolvería sola y este proyecto no haría falta.

Lo que se sostiene ante un error de volumen es **el orden de las fases** y la
dirección de la conclusión, no la magnitud del porcentaje.

### 1.2 Duración de la consulta

| | |
|---|---|
| **Asumido** | 15 / 20 / 25 / 30 minutos según especialidad |
| **Fuente** | La duración media de la consulta ambulatoria en Argentina se ubica [en torno a los 15 minutos](https://infomed.com.ar/consulta-medica-cuanto-dura-en-promedio/), y los nomencladores toman **20 minutos** como referencia operativa. Ver también el [estudio sobre estimación del tiempo de consulta ambulatoria en clínica médica](https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0034-98872013000300012) |
| **Confianza** | **Alta** |

### 1.3 Sobrecarga: cuánto excede la consulta real al turno agendado ⭐

| | |
|---|---|
| **Asumido** | 1,1 – 1,3× la duración agendada |
| **Confianza** | **Media-alta** — convergencia de fuentes independientes, ninguna concluyente por sí sola |

**Base — cuatro fuentes de distinto tipo, porque ninguna alcanza sola:**

| Tipo | Fuente | Qué aporta |
|---|---|---|
| Gremial, especialidad | [Sociedad Argentina de Cardiología](https://www.lanacion.com.ar/sociedad/crisis-sanitaria-mas-de-30-asociaciones-medicas-avalan-la-aplicacion-de-un-honorario-minimo-federal-nid21092023/) | Al **70%** se le exige dar turnos de **10–15 min**; consideran necesarios **20–30**. Brecha declarada: **1,5–2×** |
| Gremial, federal | [COMRA](https://misionesonline.net/2026/04/20/pami-comra-afiliados-crisis/) (Confederación Médica de la República Argentina) | Turnos a tres meses o más y cartillas que pierden profesionales: **la congestión es sistémica, no de una institución** |
| Sectorial | [INFOMED](https://infomed.com.ar/consulta-medica-cuanto-dura-en-promedio/) | Media ambulatoria en torno a **15 min**; rara vez supera los **20** aun en escenarios favorables |
| Académica | [Estimación del tiempo de consulta ambulatoria en clínica médica](https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0034-98872013000300012) (SciELO) · [Estudio en consulta externa, 26 profesionales de 11 subespecialidades, Hospital El Cruce](https://rasp.msal.gov.ar/rasp/articulos/vol13/AO_GarciaMunitis44.pdf) (Revista Argentina de Salud Pública, Ministerio de Salud, 2021) | Miden duración de consulta y tiempo de espera como variables reales en entorno ambulatorio argentino |

**Honestidad sobre las fuentes:** la de cardiología es de **una** especialidad y es
gremial, o sea que tiene incentivo a declarar que necesita más tiempo del que le
dan. Por eso no la usamos sola ni tomamos su magnitud. Lo que sostiene el supuesto
es la **convergencia**: cuatro fuentes de naturaleza distinta —gremial, sectorial,
académica— apuntan en la misma dirección, y modelamos por debajo de todas ellas.

**Por qué importa:** este es el motor de toda la cascada. Si la consulta durara
exactamente lo agendado no habría deriva, y el problema que describe el brief no
existiría. La demora no nace de la impuntualidad ni de las ausencias: nace de que
**cada consulta llega tarde a la siguiente**.

**Modelamos 1,1–1,3× cuando la evidencia gremial sugiere 1,5–2×.** Elegimos
deliberadamente el extremo bajo: subestimamos el problema y, por lo tanto, también
el beneficio. El caso real es probablemente mejor que el que presentamos.

### 1.4 Jornada

| | |
|---|---|
| **Asumido** | 08:00 – 18:00 corrido (10 h) |
| **Fuente** | Asunción. El brief no lo menciona |
| **Confianza** | Media |

**Sensibilidad:** una jornada partida con corte al mediodía reiniciaría parcialmente
la cascada y bajaría la deriva acumulada. Cambia la forma de la curva, no la
dirección del resultado.

### 1.5 Profundidad del pool por especialidad ⚠️

| | |
|---|---|
| **Asumido** | 95% de los consultorios comparte especialidad con otro de la misma sede |
| **Rango** | 25% – 100% |
| **Fuente** | **Ninguna. Es el supuesto más débil del modelo y lo declaramos como tal.** Se apoya solo en el razonamiento de que un centro con 4–6 consultorios no sostiene 6 especialidades distintas de tiempo completo: concentra en las de mayor demanda y las duplica. **No encontramos estadística pública** de composición por especialidad en centros ambulatorios argentinos |
| **Confianza** | **Baja** |

**Sensibilidad — crítica para la fase 1.** El motor de reasignación solo mueve
pacientes entre consultorios de la misma especialidad. Sin pares no hay a dónde
mover a nadie y **la fase 1 vale cero**.

Esto no es teórico: la primera versión de nuestro simulador sorteaba especialidades
al azar, casi ningún consultorio quedaba con par, y el motor no encontraba un solo
movimiento posible. Hubo que corregir el modelo.

Si la red está fragmentada, el valor se corre íntegramente a las fases 2 y 3, que
**no dependen de la estructura de la oferta**. El plan no se cae; cambia de qué
palanca viene la mejora.

---

### 1.6 Qué dice la evidencia sobre espera y satisfacción

Miramos las dos direcciones: lo que respalda la tesis y lo que la contradice.

#### A favor — y con un hallazgo que cambia el diseño del producto

El estudio [*Influencia del tiempo de espera en la satisfacción de pacientes y
acompañantes*](https://www.elsevier.es/es-revista-revista-calidad-asistencial-256-articulo-influencia-del-tiempo-espera-satisfaccion-S1134282X1500007X)
(Revista de Calidad Asistencial, Hospital de Figueres, 285 respuestas) encuentra:

| Hallazgo | Dato |
|---|---|
| Relación inversa espera–satisfacción | ρ = −0,242 en triaje · **ρ = −0,304 en la visita médica** · p < 0,001 |
| **Umbral de 15 minutos** | Quienes esperaron **menos de 15 min** estuvieron significativamente más satisfechos |
| **Informar al paciente mejora la satisfacción** | **p = 0,001** |
| Brecha entre espera real y percibida | Triaje: **5,9 min reales → 16,7 min percibidos** (2,8×) |

**Las últimas dos filas son las importantes, y validan decisiones que ya habíamos
tomado por criterio:**

1. **El umbral de 15 minutos que usa el motor de alertas no era arbitrario.** Lo
   habíamos fijado tomando el objetivo implícito del brief; resulta ser el mismo
   punto donde la literatura detecta el quiebre de satisfacción.

2. **Informar es una palanca en sí misma, con efecto medido.** El paciente
   sobreestima su espera casi 3 a 1. Eso significa que **decirle cuánto va a
   esperar reduce la espera percibida sin reducir la espera real** — y es
   incomparablemente más barato que agregar consultorios.

   Es la justificación empírica de la vista de paciente: la ventana estimada, el
   aviso de demora con disculpa, la comunicación del cambio de consultorio. No
   son gestos de cortesía: son la intervención con mejor relación
   costo-resultado de toda la propuesta.

Como referencias adicionales, la [Revista de Calidad Asistencial y estudios en
consulta externa latinoamericana](http://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0120-55522023000200810)
analizan el punto de equilibrio entre duración de consulta y tiempo de espera, y
trabajos en la región atribuyen alrededor de **23% de la insatisfacción del
usuario directamente al tiempo de espera**.

#### En contra — y por qué no aplica

Un supuesto solo está bien fundado si buscamos también lo que lo contradice.

El estudio del [Hospital El Cruce publicado en la Revista Argentina de Salud
Pública](https://rasp.msal.gov.ar/rasp/articulos/vol13/AO_GarciaMunitis44.pdf)
(423 encuestas, consulta externa, 2021) midió el **tiempo de espera en minutos**
como variable predictora de satisfacción y encontró que **ninguna de las variables
analizadas —incluida la espera— se asoció significativamente con peor evaluación**.
La mediana de satisfacción fue 10 sobre 10; solo 3 de 423 personas puntuaron por
debajo de 7.

Tomado literalmente, eso diría que reducir la espera no mejora la satisfacción y
que este proyecto no sirve.

**Por qué no aplica a este caso, y hay que poder decirlo:**

1. **Efecto techo.** Con mediana 10 y menos del 1% de respuestas negativas no hay
   varianza que explicar. El estudio no demuestra que la espera no importe:
   demuestra que en esa muestra no hubo insatisfacción que atribuirle a nada.
2. **Población cautiva.** Es un hospital público de alta complejidad que atiende
   a más de dos millones de habitantes del conurbano sur, articulando con más de
   200 centros de atención primaria. **Un paciente sin alternativa puntúa alto
   igual.** La red del brief es ambulatoria y compite: el paciente con obra social
   que espera 45 minutos se cambia de prestador, y el costo de cambiar es casi cero.

3. **Midió satisfacción GLOBAL, no satisfacción con la espera.** Y son cosas
   distintas: hay estudios que reportan **95% de satisfacción global y, en la
   misma muestra, 26% de usuarios no satisfechos con el tiempo de espera**. La
   pregunta global promedia todo —el trato, la resolución clínica, la limpieza— y
   la espera queda diluida. Preguntar "¿qué nota le pone al médico?" no es
   preguntar "¿cuánto le molestó esperar?".

**Los dos estudios no se contradicen: miden cosas distintas.** El de Figueres
pregunta específicamente por la espera y encuentra correlación significativa. El
de El Cruce pregunta por el profesional, en una población sin alternativa, y
encuentra un techo.

**Y refuerza el argumento comercial:** la experiencia importa exactamente en la
medida en que el paciente pueda irse. En un hospital público no se mide; en una
red ambulatoria privada es retención.

**Consecuencia para el proyecto:** la métrica de satisfacción que hay que
instrumentar en fase 0 **no es un NPS global**, que va a dar bien y no va a
mover nunca. Es una pregunta específica sobre la espera, comparable contra la
línea de base.

---

## 2. Conducta del paciente

### 2.1 Tasa de ausencia sin aviso ✅

| | |
|---|---|
| **Asumido** | 30% |
| **Rango** | 23% – 34% |
| **Fuente** | Reportado por la Directora en la reunión. Consistente con [Giunta et al., Hospital Italiano de Buenos Aires / CONICET](https://bicyt.conicet.gov.ar/fichas/produccion/8748547), que estima 23–34% en un sistema de salud argentino |
| **Confianza** | **Alta** |

**Sensibilidad:** es el dato mejor respaldado del modelo — el número que dio el
cliente cae dentro del rango publicado en literatura académica argentina. Mueve el
tamaño del premio, no la dirección de la conclusión.

Como referencia adicional, un [hospital municipal argentino reportó 16,64% en
consultorios externos](https://laopinion.com.ar/hospital-este-ano-se-dieron-mas-de-47-mil-turnos-para-consultorios-externos-y-hubo-un-1664-de-ausentismo/):
la dispersión entre instituciones es real y depende de la población atendida.

### 2.2 Efectividad de los recordatorios

| | |
|---|---|
| **Asumido** | 35% de reducción sobre la tasa de ausencia |
| **Rango** | 20% – 50% |
| **Fuente** | Extremo conservador de la literatura. El [estudio de la UNLP sobre efecto del recordatorio de turnos](http://sedici.unlp.edu.ar/bitstream/handle/10915/57981/Documento_completo.pdf?sequence=1) y la evidencia recopilada por [OSPAT](https://www.ospat.com.ar/blog/realmente-sirven-los-mensajes-recordatorios-de-turnos-medicos/) muestran reducción significativa con SMS y llamado telefónico, **no con email** |
| **Confianza** | Media |

**Elegimos deliberadamente el extremo conservador.** Los proveedores comerciales
publican reducciones de 50% a 80%, pero son datos propios sin revisión independiente:
**no los usamos**. Preferimos prometer 35% y superarlo.

**Sensibilidad:** si la cartera de pacientes es mayoritariamente adulta mayor con
baja penetración de smartphone, el efecto puede caer por debajo del rango. Es una
pregunta abierta para el cliente.

---

## 3. Economía

### 3.1 Por qué el modelo NO está en pesos

**Decisión de modelado:** el análisis trabaja en **unidades físicas** —consultas,
horas-consultorio, minutos de espera— y monetiza recién al final, con un único
parámetro de conversión que aporta el cliente.

Dos razones:

1. **Inflación.** Un caso de negocio expresado en pesos se vence en un trimestre.
   Uno expresado en consultas recuperadas y horas de consultorio liberadas sigue
   siendo válido, y se re-monetiza cambiando un solo número.

2. **No tenemos el dato correcto y no queremos inventarlo.** Los aranceles éticos
   mínimos que publican los colegios médicos provinciales —por ejemplo el [Consejo
   Superior Médico de La Pampa](https://consejomedicolp.org.ar/honorarios-eticos-minimos/),
   con $49.500 para consulta general y $62.000 para especialista— son un **piso
   gremial**, no lo que una institución efectivamente percibe de una obra social,
   que suele estar considerablemente por debajo. Los [colegios de Santa Fe](https://colmedicosantafe1.org.ar/?page_id=393)
   y [Córdoba](https://cmpc.org.ar/nuevos-aranceles-minimos-de-caracter-etico/)
   publican tablas equivalentes, actualizadas trimestralmente por inflación.

Usar el arancel ético como ingreso **sobreestimaría el caso de negocio**. Preferimos
entregar el resultado en unidades físicas y que el cliente aplique su propio valor,
que es el único correcto.

### 3.2 Existencia de lista de espera 🔴

| | |
|---|---|
| **Asumido** | Sí, hay demanda insatisfecha |
| **Confianza** | **Baja** — el brief no lo menciona |

**Este es el supuesto que más mueve el caso de negocio.**

La fase 3 reduce la agenda en **56 consultas/día** para dejar de sobreagendar.

- **Con lista de espera:** esos turnos se rellenan con demanda existente. El costo
  tiende a cero y la mejora de experiencia **sale gratis**.
- **Sin lista de espera:** es una pérdida real de facturación, y hay que presentarla
  como un intercambio explícito entre volumen y experiencia.

La misma propuesta pasa de "venta obvia" a "decisión difícil" según cuál sea la
respuesta. **Es la segunda pregunta que hay que hacer.**

---

## 4. Preguntas abiertas para el cliente

Ordenadas por cuánto cambia la respuesta. Preguntar bien vale más que adivinar bien.

1. **¿En qué país opera la red?** El brief menciona HIPAA y el marco aplicable cambia.
2. **¿Cuánto percibe la institución por consulta ambulatoria**, neto de lo que va al profesional?
3. **¿Tienen lista de espera?** Define si liberar un turno vale algo.
4. **¿Cuántos consultorios por especialidad hay en cada sede?** Define cuánto rinde la reasignación.
5. **¿Qué edad promedio tiene la cartera y por qué canal la contactan hoy?** Define si los recordatorios funcionan.
6. **¿Qué sistema usan además de las planillas?** Es el principal riesgo de integración.
7. **¿El paciente que falta vuelve a pedir turno?** Si reagenda, la pérdida es un corrimiento, no una baja.

---

## 5. Qué NO es un supuesto

Para que quede claro qué está medido y qué está asumido, estos resultados salen
del simulador y son reproducibles con `npm run analisis`:

| Resultado | Valor |
|---|---|
| Espera media | 30,7′ → 19,3′ (−37%) |
| Espera en la franja 14–17 h | 34,2′ → 19,4′ (−43%) |
| Percentil 90 de espera | 75′ → 42′ |
| Pacientes atendidos dentro de los 15′ de su turno | 47% → 55% |
| Consultas por día | 868 → 812 (−56) |

Estos números son **consecuencia** de los supuestos de arriba, no supuestos en sí
mismos. Cambiar un supuesto los cambia; el modelo los recalcula.
