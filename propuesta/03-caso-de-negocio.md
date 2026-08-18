# Caso de negocio

Los beneficios se calculan primero en consultas, horas y minutos, y después se pasan a dólares con los supuestos de la tabla siguiente, cada uno con su fuente y su rango. Todos los importes están en dólares estadounidenses. Los valores relevados en pesos se convirtieron a ARS 1.515 por dólar, cotización del Banco Nación al 15 de agosto de 2026, y se indican entre paréntesis donde la fuente es local.

## Supuestos económicos

| Parámetro | Valor | Fundamento |
|---|---|---|
| Facturación bruta por consulta | USD 33 (ARS 50.000) | Referencia: los aranceles éticos 2026 de los colegios médicos: consulta general USD 30 a 33 (ARS 46.000 a 49.500), especialista USD 41 (ARS 62.000) ([La Pampa](https://consejomedicolp.org.ar/honorarios-eticos-minimos/), [Santa Fe](https://colmedicosantafe1.org.ar/?page_id=393)). Se adopta un valor intermedio para una mezcla de especialidades. |
| Parte de la consulta que queda en la institución | 30%: USD 10 de los USD 33 | En consultorios privados el médico cobra un porcentaje de cada consulta que atiende. El reparto varía por institución y no hay dato público; se toma 70% para el médico y 30% para la clínica, que es un arreglo habitual y del lado bajo. Es el segundo dato que se le pide a la red. |
| Hora médica | USD 66 (ARS 100.000) | Valor intermedio entre los publicados por colegios médicos en 2026: USD 53 (ARS 80.475, La Pampa) y USD 91 (ARS 138.000, [Resolución 1108/2026](https://colemed8.org.ar/servicio/valor-hora-medica-colegio/)). |
| Costo del equipo | USD 3.000 por persona y mes, costo empresa (ARS 4.500.000) | Costo empresa de [un desarrollador senior en Argentina en 2026](https://teclab.edu.ar/tecnologia-y-desarrollo/cuanto-cobra-un-programador-en-argentina/): entre USD 2.000 y 4.000 por mes según experiencia y cargas sociales. Se toma el punto medio, USD 3.000. |
| Días operativos | 22 por mes | Jornada de lunes a viernes. |

## Beneficios

*Valores diarios para la red completa, alcance de las fases 0 a 2; lo que agrega y cuesta la fase 3 está en la tabla de retorno. La fila "con los liberados ocupados" supone que los turnos liberados con aviso se vuelven a dar.*

| Indicador | Hoy | Con la solución | Lectura |
|---|---|---|---|
| Turnos perdidos sin aviso | 368 | 213 | 155 turnos diarios menos se pierden sin aviso. De esos, 41 pasan a avisar con tiempo, 7 se atienden de más, y el resto (107) son turnos que ya no hace falta ofrecer: la agenda pasa de 1.220 a 1.110 turnos ofrecidos porque deja de sobreagendar para cubrir ausencias que ya no ocurren. |
| Turnos liberados con aviso | 60 | 101 | 41 turnos diarios adicionales que se pueden volver a dar. |
| Uso efectivo de la agenda, con los liberados ocupados | 69% | 81% | Los liberados con aviso pasan de 60 a 101 por día: **40 consultas adicionales por día** si se vuelven a dar. |
| Horas de consultorio libre con sala llena (Recuperables: con alguien de la misma especialidad esperando) | 43 h 21 recuperables | 24 h 0 recuperables | Hoy hay 43 horas por día de consultorio libre con gente esperando en la misma sede. 21 son con alguien de la misma especialidad esperando: esas las recupera la reasignación y valen **USD 1.390 por día** de hora médica. Las otras 22 son consultorio libre con gente de otra especialidad esperando; no se recuperan moviendo pacientes sino planificando la agenda entre especialidades, y quedan en 30 h con la fase 1 y 24 h con la fase 2. Si el profesional cobra por consulta, el que pierde ese tiempo es el profesional; para la clínica es capacidad para atender más, ya contada en la fila anterior. |
| Espera media del paciente | 45 min | 36 min | 36 con la fase 1 y 38 con la fase 2; 25 con la fase 3. Retiene pacientes. Se calcula más abajo; no entra en el retorno porque no se sabe cuántos pacientes pierde la red por año. |

## Cuánto vale en dólares lo que se recupera

De la tabla de arriba, lo único que se puede pasar a dólares con los datos que hay son las consultas adicionales. La cuenta, paso a paso:

1. Hoy, 60 turnos por día se liberan con aviso: el paciente avisa que no va. Con la confirmación desde el teléfono pasan a ser 101. Son **41 turnos más por día** que quedan libres con tiempo para dárselos a otro paciente.
2. Si hay quien ocupe esos lugares, se llenan: **40 consultas más por día** que hoy no se hacen. Se llenan agendando de antemano un poco más de lo que entra, sabiendo cuántos turnos se liberan con aviso cada día: una sobreagenda chica y medida, distinta de la de hoy, que se hace a ciegas para cubrir ausencias que nadie avisa. Si además hay lista de espera, mejor.
3. A la clínica le quedan **USD 10 por consulta** (el 30% de los USD 33 que factura; ver Supuestos económicos).
4. 40 consultas por día, 22 días por mes, 12 meses: 10.560 consultas por año. Por USD 10 cada una: **USD 106.000 por año**.

*40 consultas más por día, 22 días por mes, 12 meses, USD 10 por consulta para la clínica.*

| Consultas más por día | Le queda a la clínica por consulta | Por mes | Por año |
|---|---|---|---|
| 40 | USD 10 | USD 8.800 | **USD 106.000** |

**Todo esto vale si hay demanda para esos lugares**. No hace falta una lista de espera formal; alcanza con que la agenda se llene con días de anticipación, que es lo habitual en el país. Es el supuesto de menor confianza del análisis: no lo dio la red y no hay dato público. Si la agenda no se llena, los 40 turnos quedan vacíos, esta cifra es cero, y lo que la clínica gana es lo de las otras filas de la tabla: menos espera, que retiene pacientes, y menos tiempo de médico perdido. Esas dos se calculan aparte, más abajo.

## Cuánto vale retener pacientes

El paciente ambulatorio con cobertura cambia de prestador sin costo, y la espera es una causa documentada de ese cambio: en el informe anual de tiempos de espera de Vitals, [uno de cada cinco pacientes declara haber cambiado de médico por la espera](https://www.fiercehealthcare.com/practices/ppatients-switched-doctors-long-wait-times-vitals) y tres de cada diez haberse retirado de un turno sin atenderse. Es un dato de Estados Unidos: sirve para saber que el efecto existe y de qué tamaño es; no entra en el cálculo.

La cuenta es: pacientes activos de la red, por el porcentaje de ellos que la espera más corta retiene cada año, por el valor de cada paciente retenido. Ese valor tiene dos partes: el margen que deja por año y el CAC (costo de adquisición de un paciente nuevo: publicidad, comisiones a portales de turnos, convenios) que la clínica se ahorra de gastar en reemplazarlo.

> **Beneficio anual = pacientes activos de la red × % de pacientes retenidos por año × (margen anual por paciente + CAC)**

| Variable | Valor | Origen |
|---|---|---|
| Pacientes de la red | 161.000 por año | Derivado: 1.220 turnos diarios por 22 días por 12 meses son 322.000 turnos anuales; a 2 consultas por paciente y año (supuesto), 161.000 pacientes. |
| Lo que deja cada paciente por año | USD 20 | 2 consultas por año por USD 10 que quedan de cada una. |
| CAC (costo de adquisición de un paciente nuevo) | USD 60 | Es una aproximación. No hay dato argentino publicado; en Estados Unidos captar un paciente nuevo en atención primaria cuesta [entre USD 75 y 350](https://www.medesk.net/en/blog/patient-acquisition-cost-benchmarks/) (2026), es decir, entre una y dos veces lo que allá factura una consulta. Con la misma relación sobre los USD 33 de acá, USD 60. La red tiene el dato real: lo que gastó en el año en captar pacientes (publicidad, comisiones a portales de turnos, convenios) dividido por los pacientes nuevos que entraron. |
| % de pacientes retenidos por año | **Dato faltante** | Requiere la tasa de abandono anual de la red (pacientes activos que no vuelven) y la parte atribuible a la espera; el módulo la mide con la métrica de pacientes que vuelven. Sensibilidad con 1%, 1,5% y 2% de los pacientes activos. |

*Ejemplo con tres casos. Cada paciente retenido vale USD 80: USD 20 de margen anual más USD 60 de CAC. No se suma al retorno de la sección siguiente.*

| Pacientes retenidos por año (% de los activos) | Pacientes retenidos por año | Beneficio anual |
|---|---|---|
| 1% | 1.610 | USD 129.000 |
| 1,5% | 2.415 | USD 193.000 |
| 2% | 3.220 | USD 258.000 |

**El LTV de un paciente retenido es mayor que un año de margen.** Los USD 80 cuentan un solo año: USD 20 de margen más USD 60 de CAC. Pero un paciente que no se va sigue atendiéndose varios años; su LTV (valor durante toda su permanencia) es el margen anual por los años que se queda, más el CAC evitado. La permanencia media es un dato de la red que el módulo mide año a año con "pacientes que vuelven"; hasta tenerlo, el ejemplo usa un año como piso.

| Permanencia del paciente | LTV por paciente retenido | Beneficio anual reteniendo el 1,5% |
|---|---|---|
| 1 año (piso, el ejemplo de arriba) | USD 80 | USD 193.000 |
| 3 años | USD 120 | USD 290.000 |
| 5 años | USD 160 | USD 386.000 |

Con el escenario intermedio, la retención agrega un beneficio mayor que el directo (USD 193.000 contra 106.000), y más todavía si la permanencia supera el año. La institución dispone del dato para calcularlo con precisión: cuántos pacientes dejaron de atenderse en la red en el último año y, en la encuesta de la fase 0, qué proporción menciona la espera como motivo.

## Oferta económica de referencia

Lo que paga la institución. Precios de referencia para la red de ocho sedes; los definitivos se ajustan a las condiciones del pliego.

| Concepto | Alcance | Importe |
|---|---|---|
| Implantación | Única vez. Fases 0 a 3: línea de base, configuración del módulo, integración por HL7 y FHIR con los sistemas de la red, capacitación de los ocho equipos y despliegue por olas. | USD 25.000 |
| Licencia del módulo | Por sede y mes. Incluye cómputo, base de datos, respaldos, monitoreo, soporte y actualizaciones del módulo. | USD 500 por sede (USD 4.000 por mes para las ocho sedes; USD 48.000 por año) |
| Mensajería al paciente | A costo, sin margen. Dos mensajes de WhatsApp por turno (recordatorio y pedido de confirmación), 55.000 por mes, a USD 0,04 cada uno con la tarifa de Meta y el proveedor incluidos. El detalle está en el Anexo. | USD 2.200 por mes (USD 26.400 por año, variable con el volumen) |
| Pantallas de sala | Única vez. Televisor y reproductor en cada una de las ocho sedes. | USD 3.300 |
| Total primer año |  | **USD 102.700** |
| Total años siguientes |  | **USD 74.400 por año** |

**Comparación de precio con la oferta del mercado.** Las agendas con recordatorios se contratan en Argentina entre ARS 12.900 y 42.000 por cuenta y mes (USD 9 a 28), con 60 a 250 recordatorios incluidos y la mensajería adicional aparte, según los planes publicados por Turnito y SimpleTurno a agosto de 2026. Para ocho sedes, con una cuenta por profesional, representan entre USD 100 y 1.200 mensuales, más la mensajería que exceda los recordatorios incluidos. Esta propuesta cuesta USD 6.200 mensuales (USD 4.000 de licencia y USD 2.200 de mensajería a costo, 55.000 mensajes por mes). Es de otro orden porque cubre otra cosa: la gestión de la sala en tiempo real, la reasignación entre consultorios y el ajuste de la agenda, que ninguno de esos productos incluye. Una agenda con recordatorios cubre solo la confirmación y, aplicada sola, sin ajustar la agenda, la simulación muestra que la espera empeora de 36 a 51 minutos. La comparación relevante es entre el resultado que deja cada opción, no entre el precio de herramientas de alcance distinto.

## Retorno para la institución

*A la clínica le queda el 30% de cada consulta (USD 10) y paga la oferta de referencia. La retención toma un 1,5% de pacientes que dejan de irse por año, a USD 80 cada uno.*

| Concepto | Año 1 | Año 2 en adelante |
|---|---|---|
| Consultas adicionales: turnos liberados que se vuelven a dar | USD 106.000 | USD 106.000 |
| Consultas que cuesta la primera consulta más larga (fase 3) | USD −129.000 | USD −129.000 |
| Retención de pacientes, tomando un 1,5% | USD 193.000 | USD 193.000 |
| Implantación y pantallas | USD −28.300 |  |
| Licencia y mensajería | USD −74.400 | USD −74.400 |
| Resultado neto | **USD 67.300** | **USD 95.600** |

- **66%**: de retorno el primer año: lo que gana la clínica sobre lo que paga
- **4 meses**: para recuperar la implantación y las pantallas con lo que queda después de pagar la licencia
- **2,3 a 1**: gana la clínica por cada dólar que paga desde el segundo año

Sin contar la retención, las consultas adicionales (USD 106.000) no cubren lo que cuesta la primera consulta más larga (USD 129.000): la fase 3 se justifica por los pacientes que retiene, y por eso la fase 0 mide cuántos pacientes deja de ver la red y por qué. Si en esta red la clínica se queda con menos del 30% de cada consulta, o retiene menos del 1,5%, el retorno baja en proporción; son el segundo y el octavo dato de la lista de información requerida.

Los plazos se cuentan desde el inicio del proyecto, aunque el beneficio empieza recién con la fase 2. La retención de pacientes y el tiempo médico recuperado no están en la cuenta, y juegan a favor.

## Modelo de contratación y ajuste entre fases

La oferta económica es de precio fijo por licencia, que es lo habitual en una licitación. Lo que se propone distinto es que el plan no sea rígido: cada fase cierra con una revisión conjunta de lo medido, y lo que se observe en la práctica puede modificar la siguiente.

- **La fase 0 ajusta la fase 1:** qué consultorios forman pool en cada sede, los umbrales de alerta y la ganancia mínima para proponer un movimiento salen de la medición, no de valores por defecto.
- **La fase 1 ajusta la fase 2:** cuánto se deja de sobreagendar y en qué sedes depende de la tasa de ausencia que se mida con la confirmación activa, no de la del brief.
- **La fase 2 decide si hace falta una fase 3:** solo si la brecha entre turno agendado y duración real se confirma con datos propios se pone sobre la mesa el ajuste del turno, con su costo de volumen cuantificado.

Los criterios de salida de cada fase, medidos contra la línea de base, son el insumo de esa revisión: sirven para decidir qué se cambia, no para condicionar un pago. Si un supuesto del modelo no se sostiene en la práctica, se recalcula el caso con el dato real antes de avanzar.

## Por qué la primera consulta más larga está en el alcance

Agendar la primera consulta a 1,5 veces el turno de un control lleva la espera de 38 a 25 minutos y el percentil 90 de 84 a 60, a costa de 49 consultas diarias; con USD 10 por consulta, **USD 10.800 mensuales** menos de resultado neto. Alargar todos los turnos un 15% la lleva a 20 minutos, a costa de 89 consultas y USD 19.600 mensuales. Son las dos únicas medidas que cuestan consultas. La primera consulta más larga está en el alcance como fase 3 porque con lo que retiene se paga sola; alargar todos los turnos queda como decisión de la institución.

**Contra qué se compara ese costo.** Las 49 consultas diarias son USD 130.000 al año de resultado neto. Del otro lado está lo que la espera más corta retiene: pasar de 38 a 25 minutos sube del 37% al 49% la proporción de pacientes atendidos dentro de los 15 minutos, que es el umbral donde la literatura ubica el quiebre de satisfacción, y baja el peor caso (P90) de 84 a 60. Con la fórmula de retención de arriba (USD 80 por paciente retenido), la primera consulta más larga se paga sola si retiene **un 1% más de los pacientes activos por año** (1.610 pacientes, USD 129.000); con 0,5% cubre la mitad; con 1,5% la supera.

| Pacientes retenidos de más por bajar de 38 a 25 min (% de los activos) | Pacientes retenidos por año | Beneficio anual | Contra USD 130.000 de volumen |
|---|---|---|---|
| 0,5% | 805 | USD 64.000 | cubre la mitad |
| 1% | 1.610 | USD 129.000 | empata |
| 1,5% | 2.415 | USD 193.000 | lo supera |

Las 49 consultas y los 25 minutos dependen de un supuesto sin fuente local: que el 17% de los turnos sean primeras consultas. Con 10% el escenario da 28,7 minutos y cuesta 20 consultas; con 28%, la proporción del sistema público español, 19,3 minutos y 77 consultas; con 37%, la del Hospital General de México, 16,9 minutos y 104 consultas (ver Supuestos, en el Anexo). Un punto y medio está dentro de los órdenes de magnitud de la literatura (uno de cada cinco pacientes cambió de médico por la espera), pero no está demostrado para esta red, y depende de los USD 60 por paciente nuevo, que son una aproximación. Por eso la fase 0 mide las dos cosas: la brecha real entre turno y consulta, y la proporción de pacientes que vuelven a la red, antes y después, y con eso se fija el multiplicador de la primera consulta y se sigue el resultado.

# El módulo como producto: caso para Intuit Salud

La pestaña Negocio responde si a la red le conviene comprar. Esta sección responde una decisión previa de Intuit Salud: si el desarrollo se encara como un trabajo a medida para esta red o como un módulo de producto reutilizable del que esta red es el primer cliente. El análisis de mercado que sigue solo tiene sentido en el segundo caso.

## Dos formas de encarar el desarrollo

|  | Desarrollo a medida | Módulo de producto |
|---|---|---|
| Qué se construye | Lo mismo, pero configurado y entregado para esta red. | Lo mismo, diseñado desde el inicio para activarse en cualquier institución: parametrizable por sede, especialidad y umbrales, integrable por HL7 y FHIR con lo que cada una tenga. |
| Cómo se cobra a esta red | Precio único por el desarrollo y la implantación, USD 65.000 a 75.000 (costo de USD 47.500 más margen), y soporte anual aparte. Sin licencia. | Implantación de USD 25.000 más licencia de USD 500 por sede y mes. Es la oferta económica de referencia de la sección anterior. |
| Qué le conviene a la red | Paga más al inicio y menos después. Recupera la inversión en menos de un año igual. | Paga menos al inicio y una licencia recurrente. Recibe mejoras continuas del módulo. |
| Qué le conviene a Intuit | Cobra el desarrollo una vez. El conocimiento queda, pero no el ingreso. | El 65% del esfuerzo (desarrollo y diseño) se reutiliza en cada cliente siguiente. Se abre el mercado que se dimensiona a continuación. |

**Se recomienda el módulo de producto**, por tres razones: la mayor parte del esfuerzo es reutilizable, ningún oferente relevado cubre este segmento, y el mercado existe y se puede contar. La oferta a esta red se formuló en consecuencia. Si Intuit prefiriera el desarrollo a medida, la propuesta técnica no cambia; cambia la oferta económica y esta sección deja de aplicar.

## Tamaño del mercado

El Registro Federal de Establecimientos de Salud ([REFES, corte de diciembre de 2025](https://datos.salud.gob.ar/dataset/listado-establecimientos-de-salud-asentados-en-el-registro-federal-refes)) registra 36.047 establecimientos, de los cuales 23.186 son de financiamiento privado. Dentro de los privados, la tipología que corresponde exactamente al segmento de esta propuesta, *con atención médica diaria y con especialidades*, agrupa **6.860 establecimientos**. Se suman 2.122 clínicas y sanatorios privados con internación, que operan consultorios externos con la misma dinámica.

*Argentina, sector privado. El mercado se mide en sedes y en cuánto podrían recuperar esas sedes por año, tomando como referencia lo que recupera cada sede de esta red: USD 13.250 anuales. Ese valor no depende de lo que cobre Intuit Salud.*

|  | Definición | Sedes | Valor recuperable anual |
|---|---|---|---|
| TAM | Establecimientos privados con consultorios de especialidades: 6.860 ambulatorios y 2.122 con internación | 8.982 | USD 119 M |
| SAM | Los que tienen varios consultorios de la misma especialidad, condición para que la reasignación aplique: la totalidad de los que tienen internación y un 35% de los ambulatorios, supuesto a validar con el detalle del registro | 4.500 | USD 60 M |
| SOM a tres años | 3% del SAM, alcanzable con la red de esta propuesta, dos pilotos por año en redes comparables y venta directa a instituciones medianas | 135 | USD 1,8 M |

Ese valor es lo que las clínicas pueden recuperar; no es lo que factura Intuit Salud. Intuit cobra la licencia: a USD 6.000 por sede y año, 135 sedes son USD 810.000 anuales. Ese es el número que se proyecta en la tabla de adopción.

El sector público, con 11.892 establecimientos provinciales y municipales que operan consultorios externos, no se incluye en el TAM porque compra con procesos y plazos distintos. Constituye una segunda etapa.

## Crecimiento del mercado

El mercado de salud digital en América Latina se estimó en USD 5.755 millones en 2025 con una tasa de crecimiento anual compuesta del **9,5%** proyectada a 2035 ([Informes de Expertos](https://www.informesdeexpertos.com/informes/mercado-de-salud-digital-en-america-latina)). El segmento de salud inteligente en la región crece al **13%** anual a 2030, y [Argentina es el país con mayor tasa de crecimiento proyectada de la región](https://www.grandviewresearch.com/horizon/outlook/smart-healthcare-market/latin-america). El componente de software, en particular, crece al **17,7%** anual a 2031 ([Mordor Intelligence](https://www.mordorintelligence.ar/industry-reports/digital-health-market)).

El mercado crece, pero eso no dice cuántas sedes va a sumar este módulo: un producto nuevo crece por los clientes que consigue. Por eso la proyección de abajo cuenta sedes que se suman cada año, y no aplica una tasa de crecimiento. Que el mercado crezca juega a favor: en tres años habrá más de las 4.500 sedes de hoy.

## Proyección de adopción e ingresos

La tabla estima cuántas sedes usarían el módulo al cierre de cada año y cuánto facturaría Intuit Salud por licencias si todas ellas pagaran el año completo, a USD 6.000 por sede y año. Es un supuesto de ritmo comercial, no una previsión: sirve para dimensionar el producto, no para comprometer ventas.

*Facturación por licencia a régimen, es decir con todas las sedes de ese año pagando doce meses. No incluye la mensajería, que se factura a costo.*

| Año | De dónde salen las sedes | Sedes acumuladas | Facturación anual por licencia |
|---|---|---|---|
| 1 | La red de esta propuesta (8 sedes) más dos pilotos en redes de tamaño similar, de 4 sedes cada uno. | 16 | USD 96.000 |
| 2 | Se suman cinco redes comparables de 8 sedes (40) y ventas sueltas a instituciones medianas (4). | 60 | USD 360.000 |
| 3 | Se alcanza el 3% del mercado accesible (SAM de 4.500 sedes), sumando 75 sedes más entre redes e instituciones medianas. | 135 | USD 810.000 |

## Costo para Intuit Salud y economía del producto

*Costo interno del primer despliegue, a USD 3.000 por persona y mes, USD 17,30 la hora, según la tabla de horas del plan de implementación.*

| Concepto | Horas | Costo |
|---|---|---|
| Desarrollo del módulo (reutilizable) | 1.330 | USD 23.000 |
| Diseño (reutilizable) | 260 | USD 4.500 |
| Responsable de producto (reutilizable en su mayor parte) | 350 | USD 6.000 |
| Implantación, medición y capacitación en la red (por cliente) | 810 | USD 14.000 |
| Total primer despliegue | 2.750 | **USD 47.500** |
| Infraestructura del módulo |  | USD 500 a 1.000 por mes |

Con la oferta de referencia, la primera red paga USD 25.000 por la implantación (un servicio: medir, configurar, integrar y capacitar; cubre los USD 14.000 que cuesta hacerlo) y USD 48.000 por año de licencia por usar el módulo, que sigue siendo de Intuit Salud. Entre las dos cosas, el primer año entran USD 73.000 contra USD 47.500 de costo: el desarrollo reutilizable (USD 33.500) queda cubierto con el primer cliente. Desde el segundo, cada sede nueva cuesta USD 2.000 de implantación más un poco de infraestructura, y paga USD 6.000 por año de licencia. Pero eso no es todo el costo: hay que sostener soporte, venta y mejoras del módulo, que crecen con la cantidad de sedes. La tabla siguiente los incluye.

## Resultado del módulo a tres años

*Estimación con la trayectoria de adopción de la tabla anterior (16, 60 y 135 sedes acumuladas), USD 3.000 por persona y mes, implantación cobrada a USD 3.125 por sede (la proporción de la oferta de referencia) y con costo de USD 2.000 por sede. Las sedes que entran en un año pagan en promedio medio año de licencia ese año; los años siguientes, completo. La mensajería queda afuera porque se factura a costo.*

| Concepto | Año 1 | Año 2 | Año 3 |
|---|---|---|---|
| Sedes nuevas / acumuladas | 16 / 16 | 44 / 60 | 75 / 135 |
| Ingreso por implantación | USD 50.000 | USD 137.500 | USD 234.400 |
| Ingreso por licencia | USD 48.000 | USD 228.000 | USD 585.000 |
| Ingresos | **USD 98.000** | **USD 365.500** | **USD 819.400** |
| Desarrollo inicial y evolución del módulo (2.600 horas al año desde el segundo, 3.100 en el tercero) | USD 60.000 | USD 45.000 | USD 54.000 |
| Implantación (USD 2.000 por sede) | USD 32.000 | USD 88.000 | USD 150.000 |
| Soporte (1.000 / 2.100 / 4.200 horas al año) | USD 18.000 | USD 36.000 | USD 72.000 |
| Venta y preventa (1.000 / 2.100 / 3.100 horas al año) | USD 18.000 | USD 36.000 | USD 54.000 |
| Responsable de producto (1.000 horas al año) | USD 18.000 | USD 18.000 | USD 18.000 |
| Infraestructura | USD 9.000 | USD 24.000 | USD 48.000 |
| Costos | **USD 155.000** | **USD 247.000** | **USD 396.000** |
| Resultado del año | **USD −57.000** | **USD 118.500** | **USD 423.400** |
| Resultado acumulado | USD −57.000 | USD 61.500 | USD 484.900 |
| Horas de implantación necesarias (110 por sede) | 1.800 | 4.900 | 8.400 |

**Lectura.** El módulo pierde USD 57.000 el primer año, recupera esa pérdida durante el segundo y en el tercero deja como resultado cerca de la mitad de lo que factura. Lo difícil no es el software: es armar el equipo de implantación (de 1.800 a 8.400 horas al año en tres años) y vender a redes medianas por licitación, que lleva tiempo.

## Qué pasa con las instituciones chicas

La reasignación entre consultorios, que es lo que ningún oferente relevado ofrece, requiere al menos dos consultorios de la misma especialidad en la sede. En un centro con un consultorio por especialidad el módulo queda reducido a confirmación activa, ajuste de la agenda y vista de paciente, y en ese recorte compite de frente, y por precio, con las agendas con recordatorios. Por eso esos establecimientos quedan fuera del SAM y no se los cuenta en la adopción. Si en el futuro se decidiera atenderlos, sería con una versión reducida y otro precio, y sería otro caso de negocio.

## Lo que hay que validar antes de invertir en el producto

- La proporción de establecimientos con varios consultorios por especialidad, que define el SAM. El REFES no informa cantidad de consultorios; requiere cruce con habilitaciones provinciales o una muestra propia de establecimientos.
- El ritmo comercial del año 2, que es el supuesto más sensible del resultado a tres años: cinco redes por licitación en doce meses exige capacidad de preventa desde el primer año.
- La disposición a pagar de las redes medianas, distinta de la de una red de ocho sedes con dirección de operaciones centralizada.
- Cuánto cuesta realmente implantar cada sede cuando son muchas: eso decide el resultado del producto, más que el desarrollo.
