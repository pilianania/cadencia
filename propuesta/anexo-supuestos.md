# Anexo · Supuestos, fuentes y sensibilidad

La reunión inicial aportó tres cifras: 45 minutos de espera promedio, 30% de
ausencias sin aviso y 8 sedes. El resto de los parámetros del modelo debió
asumirse.

Este anexo documenta cada supuesto con su fuente, su rango plausible y el efecto
sobre las conclusiones si el valor real difiere. Donde no existe fuente pública
disponible, se indica expresamente en lugar de presentarlo como estimación.

El modelo está parametrizado: modificar un supuesto recalcula el resultado.

---

## 0 · Jurisdicción

**Asumido: Argentina.**

El brief menciona HIPAA, normativa de los Estados Unidos, pero no especifica el
país de operación. Es el supuesto de mayor alcance: condiciona el marco
regulatorio, el orden de magnitud de los valores económicos y la estrategia de
canal para las comunicaciones al paciente.

| Jurisdicción | Marco aplicable |
|---|---|
| **Argentina** (asumido) | Ley 25.326 de Protección de Datos Personales — los datos de salud son sensibles (arts. 2 y 7). Ley 26.529 de Derechos del Paciente. HIPAA no resulta vinculante |
| Estados Unidos | HIPAA vinculante. Los valores económicos cambian de orden de magnitud. La arquitectura no se modifica |
| Otro país de la región | Requiere mapeo de la normativa local de protección de datos. La estructura del caso de negocio se mantiene |

**La solución se diseñó contra el estándar más exigente de los dos.** Las
decisiones de minimización de datos descritas en la propuesta de valor cumplen
HIPAA aunque no resulte obligatorio, de modo que la respuesta a esta pregunta no
genera retrabajo.

---

## 1 · Operación

### 1.1 Volumen y capacidad instalada

| | |
|---|---|
| Asumido | 1.220 turnos ofrecidos por día · 42 consultorios · 152 turnos por sede |
| Rango | 900 a 1.800 turnos/día · 24 a 60 consultorios |
| Fuente | Derivado de los supuestos 1.2 y 1.3. El brief indica únicamente "8 clínicas ambulatorias" |
| Confianza | Media |

La capacidad se calibró de modo que la utilización resultante quede
inmediatamente por debajo de 1. Es el régimen congestionado pero estable que
describe la situación reportada: por encima de 1, la cola crecería sin límite y
la jornada se extendería varias horas más allá del cierre.

**Sensibilidad.** El resultado no está gobernado por el tamaño de la red sino
por su nivel de utilización:

| Configuración | Espera base | Con la propuesta | Mejora |
|---|---|---|---|
| Red completa *(64 réplicas)* | 45 min | 36 min con la fase 1 (38 con la fase 2, dentro del error) | −20% |
| Subconjunto de mayor congestión | mayor | similar | mayor |
| Capacidad constante con demanda reducida a la mitad | la espera desciende sin intervención alguna | | |

- El beneficio absoluto escala con el volumen.
- El porcentaje de mejora depende del nivel de congestión, no del tamaño.
- Sin congestión no hay optimización posible: el problema se resolvería solo.

Ante un error en la estimación de volumen, lo que se mantiene es el **orden de
las intervenciones** y la dirección del resultado.

### 1.2 Duración de la consulta

| | |
|---|---|
| Asumido | 15 / 20 / 25 / 30 minutos según especialidad |
| Fuente | La duración media de la consulta ambulatoria en Argentina se ubica [en torno a los 15 minutos](https://infomed.com.ar/consulta-medica-cuanto-dura-en-promedio/); los nomencladores toman 20 minutos como referencia operativa. Referencia académica: [estimación del tiempo de consulta ambulatoria en clínica médica](https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0034-98872013000300012) |
| Confianza | Alta |

### 1.3 Exceso de la consulta real sobre el turno agendado

| | |
|---|---|
| Asumido | ~1,3 × la duración agendada como sobrecarga sistemática; con los desbordes ocasionales (12% de las consultas) la duración real media resulta de 31 minutos por turno de 20, es decir 1,5× observado |
| Confianza | Media-alta, por convergencia de fuentes |
| Rol en el modelo | **Es el parámetro de calibración.** Se ajustó contra el dato duro del brief —45 minutos de espera promedio—, no al revés |

**Es el mecanismo que origina la cascada de demoras.** Si la consulta se ajustara
exactamente a su duración agendada no habría corrimiento, y el problema reportado
no existiría. La demora no se origina en la impuntualidad ni en las ausencias: se
origina en que cada consulta llega tarde a la siguiente.

| Tipo de fuente | Referencia | Aporte |
|---|---|---|
| Gremial, por especialidad | [Sociedad Argentina de Cardiología](https://www.lanacion.com.ar/sociedad/crisis-sanitaria-mas-de-30-asociaciones-medicas-avalan-la-aplicacion-de-un-honorario-minimo-federal-nid21092023/) | Al 70% de los profesionales se le requieren turnos de 10 a 15 min; consideran necesarios 20 a 30. Brecha implícita: 1,5 a 2× |
| Gremial, federal | [COMRA](https://misionesonline.net/2026/04/20/pami-comra-afiliados-crisis/) | Turnos a tres meses y cartillas con pérdida de profesionales: la congestión es sistémica |
| Sectorial | [INFOMED](https://infomed.com.ar/consulta-medica-cuanto-dura-en-promedio/) | Media en torno a 15 min; rara vez supera los 20 |
| Académica | [Rev. Argentina de Salud Pública, Hospital El Cruce](https://rasp.msal.gov.ar/rasp/articulos/vol13/AO_GarciaMunitis44.pdf) — 26 profesionales, 11 subespecialidades | Mide duración de consulta y tiempo de espera en entorno ambulatorio local |

La fuente gremial corresponde a una única especialidad y proviene de una parte
con interés en el resultado, por lo que no se utiliza de forma aislada ni se
adopta su magnitud.

**Cómo se fijó el valor.** Este es el único parámetro que se calibró: se ajustó
hasta que la espera media del modelo, promediada sobre 64 réplicas, reprodujera
los 45 minutos informados por la institución. El multiplicador de calibración
quedó en 1,66 sobre el exceso de referencia de cada especialidad, lo que equivale
a una sobrecarga sistemática de aproximadamente 1,3× sobre la duración agendada.
Ese valor **queda por debajo del 1,5 a 2× que implica la evidencia gremial**, de
modo que la calibración no fuerza el parámetro fuera de su rango respaldado: lo
aproxima desde abajo.

Que un dato aportado por el cliente y una fuente sectorial independiente converjan
sobre el mismo parámetro es la validación más fuerte disponible en este análisis.

### 1.3 bis · Proporción de primeras consultas y cuánto más duran

| | |
|---|---|
| Asumido | 17% de los turnos son primera consulta. Duran 1,35 veces la media; los controles, 0,93 veces. Los dos factores están elegidos para que la duración media no cambie (0,17 × 1,35 + 0,83 × 0,93 = 1): el supuesto agrega heterogeneidad, no sobrecarga |
| Rango | 10% a 37% de primeras consultas |
| Fuente | En consultorios médicos ambulatorios de Estados Unidos, la encuesta nacional [NAMCS 2019 (tabla 8)](https://www.cdc.gov/nchs/data/ahcd/namcs_summary/2019-namcs-web-tables-508.pdf) mide que los pacientes nuevos son el **16,8%** de las visitas (12,5% en atención primaria, 21,7% en especialidades quirúrgicas, 20,6% en especialidades médicas): es el entorno más parecido a una red ambulatoria privada y coincide con el valor adoptado. En sistemas hospitalarios con derivación la proporción es mayor: [28,1% en la atención especializada del Sistema Nacional de Salud español en 2024](https://www.sanidad.gob.es/estadEstudios/sanidadDatos/tablas/tabla25.htm) (20,8% a 46,3% según la comunidad) y 37% en el [Hospital General de México en 2025](https://hgm.salud.gob.mx/interna/dirgral/descargas/Infor-Ene-Mar-2025_01-07-25.pdf). Sin dato argentino publicado: el registro de consultorio externo distingue "primera vez" y "ulterior", así que la institución dispone del dato |
| Confianza | Media: coincide con la referencia ambulatoria; el valor propio de la red se mide en la fase 0 |
| Rol en el modelo | Solo afecta el escenario de la primera consulta más larga. Los otros escenarios no dependen de él: la duración media se conserva para cualquier proporción, y la fase 2 da entre 37 y 38 minutos con 10%, 17%, 28% o 37% (diferencias dentro del error) |

Sensibilidad medida (`npm run analisis`, 64 réplicas), escenario de la primera
consulta agendada a 1,5 veces el turno, sobre la fase 2:

| Primeras consultas | Espera sin el ajuste (fase 2) | Espera con primera consulta más larga | P90 | Atendidos ≤15′ | Consultas por día | Turnos que cuesta |
|---|---|---|---|---|---|---|
| 10% | 37,2 min | 28,7 min | 66 min | 45% | 773 | −20 |
| **17% (supuesto)** | 37,7 min | **25,3 min** | **60 min** | **49%** | **744** | **−49** |
| 28% (SNS español) | 37,8 min | 19,3 min | 47 min | 58% | 716 | −77 |
| 37% (Hosp. General de México) | 38,4 min | 16,9 min | 42 min | 62% | 689 | −104 |

El punto de partida no cambia con la proporción (la duración media de la
consulta se conserva por construcción); lo que cambia es a cuántos turnos les
llega el turno más largo. Cuantas más primeras consultas tenga la red, más vale
el turno diferenciado y más turnos cuesta: con la proporción española la espera
media queda en 19 minutos a costa de un 10% de las consultas; con la mexicana,
en 17 a costa de un 13%. La pérdida de turnos es la magnitud más ruidosa del
modelo (las consultas por día varían ±68 entre réplicas). Por eso el dato se
mide en la fase 0, por especialidad, junto con la duración real de una primera
consulta frente a la de un control.

### 1.4 Extensión de la jornada

| | |
|---|---|
| Asumido | 08:00 a 18:00 corrido |
| Fuente | Sin fuente. Asunción operativa |
| Confianza | Media |

Una jornada partida reiniciaría parcialmente la cascada al mediodía y reduciría
el corrimiento acumulado. Modifica la forma de la curva, no la dirección del
resultado.

### 1.4 bis · Cuánto se sobreagenda hoy

| | |
|---|---|
| Asumido | La agenda ofrece un 10% más de minutos de consultorio de los que hay: 1.220 turnos ofrecidos por día contra 1.100 que entrarían al turno nominal. En el modelo, el paso entre turnos se acorta para cubrir un 35% de la tasa de ausencia (con 30% de ausencias, turnos cada 18 minutos en vez de cada 20) |
| Rango | 5% a 20% |
| Fuente | Sin dato de la red. Se deduce del brief: 30% de ausencias, tiempos muertos y 45 minutos de espera solo conviven si se sobreagenda para cubrirse. En la fase 2 se ajusta la agenda al ausentismo medido; con un 10% de sobreagenda residual se conserva el volumen (1.110 ofrecidos, 1,01 minutos de turno por minuto disponible); sin ninguna, 1.073 ofrecidos y 0,96 |
| Confianza | Media |
| Rol en el modelo | Define cuántos turnos se dejan de ofrecer en la fase 2 (1.220 → 1.110) y por lo tanto cuánto se protege la ganancia de la fase 1. Con más sobreagenda real hay más que ajustar y más riesgo de retroceso si no se ajusta; con menos, al revés |

Se mide en la fase 0 con la agenda tal como está armada hoy: minutos de turno
ofrecidos sobre minutos de consultorio disponibles, por especialidad y por
sede. Es una de las métricas que el módulo sigue de forma continua.

### 1.5 Profundidad del pool por especialidad ⚠️

| | |
|---|---|
| Asumido | 95% de los consultorios comparte especialidad con otro de la misma sede |
| Rango | 25% a 100% |
| Fuente | **Sin fuente pública.** No se identificó estadística disponible sobre composición por especialidad en centros ambulatorios argentinos |
| Confianza | Baja |

El razonamiento que lo sustenta es que un centro con 4 a 6 consultorios no
sostiene seis especialidades distintas a tiempo completo: concentra en las de
mayor demanda y las duplica.

**Sensibilidad — determinante para la intervención 1.** El motor de reasignación
opera únicamente entre consultorios de la misma especialidad. Sin pares
disponibles, la intervención no produce movimientos y su rendimiento es nulo.

Si la red presenta una composición fragmentada, el valor se traslada íntegramente
a las intervenciones 2 y 3, que no dependen de la estructura de la oferta. El
plan se sostiene; cambia el origen de la mejora.

**Es el primer dato a relevar en la fase 0.**

---

## 2 · Conducta del paciente

### 2.1 Tasa de ausencia sin aviso

| | |
|---|---|
| Asumido | 30% |
| Rango | 23% a 34% |
| Fuente | Cifra reportada en la reunión inicial. Consistente con [Giunta et al., Hospital Italiano de Buenos Aires / CONICET](https://bicyt.conicet.gov.ar/fichas/produccion/8748547), que estima 23 a 34% en un sistema de salud argentino, y con un [análisis sobre 500.000 turnos de clínicas e instituciones argentinas](https://www.cronista.com/infotechnology/it-business/le-encontraron-la-vuelta-al-drama-de-conseguir-un-turno-medico-en-la-argentina-como-lo-hacen-y-por-que-su-idea-ya-vale-millones/) que reporta que uno de cada tres pacientes no concurre |
| Confianza | Alta |

Es el supuesto mejor respaldado del modelo: la cifra aportada por la institución
coincide con un dataset de industria de 500.000 casos y se ubica dentro del rango
publicado en literatura académica local. Como
referencia de la dispersión entre instituciones, un [hospital municipal reportó
16,64% en consultorios externos](https://laopinion.com.ar/hospital-este-ano-se-dieron-mas-de-47-mil-turnos-para-consultorios-externos-y-hubo-un-1664-de-ausentismo/).

### 2.2 Distribución de causas de ausencia

| | |
|---|---|
| Asumido | Olvido 44% · Imprevistos 15,3% · Malestar 12% · Laborales 5,3% · Transporte 4,7% |
| Fuente | Giunta et al., Hospital Italiano de Buenos Aires, por autorreporte. **Corresponde a otra población: es evidencia de apoyo, no medición local** |
| Confianza | Baja |

La institución de referencia atiende una población mayoritariamente urbana y de
cobertura prepaga. La red descrita opera en CABA, Zona Norte, Sur, Oeste y La
Plata, con condiciones de acceso y situación laboral heterogéneas.

**La distinción es operativa, no académica:** un recordatorio resuelve un olvido;
no resuelve una dificultad de transporte ni una urgencia laboral.

### 2.3 Efectividad de la confirmación activa

| | |
|---|---|
| Asumido | 35% de reducción sobre la tasa de ausencia |
| Rango | 20% a 50% |
| Fuente | Extremo conservador de la literatura. El [estudio de la UNLP sobre efecto del recordatorio de turnos](http://sedici.unlp.edu.ar/bitstream/handle/10915/57981/Documento_completo.pdf?sequence=1) y la [evidencia recopilada por OSPAT](https://www.ospat.com.ar/blog/realmente-sirven-los-mensajes-recordatorios-de-turnos-medicos/) muestran reducción significativa con SMS y llamado telefónico, no con correo electrónico |
| Confianza | Media |

Los proveedores comerciales publican reducciones de 50% a 80%. Se trata de datos
propios sin revisión independiente y **no se incorporaron al modelo**.

> **Los supuestos 2.2 y 2.3 están acoplados.** Una reducción del 35% solo resulta
> coherente si el olvido representa una proporción cercana al 44% de las causas.
> Ambos deben relevarse conjuntamente en la fase 0.

---

## 3 · Evidencia sobre espera y satisfacción

Se revisó la literatura en ambas direcciones.

### Evidencia a favor

El estudio [*Influencia del tiempo de espera en la satisfacción de pacientes y
acompañantes*](https://www.elsevier.es/es-revista-revista-calidad-asistencial-256-articulo-influencia-del-tiempo-espera-satisfaccion-S1134282X1500007X)
(Revista de Calidad Asistencial, 285 respuestas) reporta:

| Hallazgo | Dato |
|---|---|
| Relación inversa entre espera y satisfacción | ρ = −0,304 en la visita médica · p < 0,001 |
| Umbral de quiebre | Quienes esperaron menos de **15 minutos** resultaron significativamente más satisfechos |
| Efecto de informar al paciente | Mejora significativa de la satisfacción · **p = 0,001** |
| Brecha entre percepción y realidad | 5,9 minutos reales percibidos como 16,7 |

Los dos últimos hallazgos fundamentan una decisión central de la propuesta: **el
paciente sobreestima su espera en una proporción cercana a 3 a 1**, de modo que
informarle el tiempo estimado reduce la espera percibida sin necesidad de reducir
la espera real. Es la intervención de mejor relación costo-resultado disponible.

El umbral de 15 minutos coincide con el que utiliza el motor de alertas de la
solución.

### Evidencia en sentido contrario

El [estudio del Hospital El Cruce](https://rasp.msal.gov.ar/rasp/articulos/vol13/AO_GarciaMunitis44.pdf)
(423 encuestas, consulta externa) midió el tiempo de espera como variable
predictora de satisfacción y **no halló asociación significativa**. La mediana de
satisfacción fue 10 sobre 10; 3 de 423 respuestas se ubicaron por debajo de 7.

Tres razones explican por qué el resultado no es trasladable a este caso:

1. **Efecto techo.** Con mediana 10 y menos del 1% de respuestas negativas no hay
   varianza que explicar. El estudio no establece que la espera sea irrelevante:
   establece que en esa muestra no hubo insatisfacción atribuible a ninguna
   variable.

2. **Población sin alternativa.** Se trata de un hospital público de alta
   complejidad con un área de influencia superior a dos millones de habitantes.
   Un paciente sin alternativa de derivación califica alto con independencia de
   la espera. Una red ambulatoria privada compite: el costo de cambiar de
   prestador es próximo a cero.

3. **Midió satisfacción global, no satisfacción con la espera.** Existen estudios
   que reportan 95% de satisfacción global junto a 26% de insatisfacción
   específica con el tiempo de espera en la misma muestra. La pregunta global
   promedia trato, resolución clínica y confort, y diluye la espera.

**Consecuencia metodológica:** el instrumento de medición de la fase 0 no puede
ser un indicador de satisfacción global. Debe incorporar una pregunta específica
sobre la espera, comparable contra la línea de base.

---

## 4 · Economía

### 4.1 Criterio de expresión de los resultados

**El análisis se expresa en unidades físicas** —consultas, horas-consultorio,
minutos de espera— y se monetiza en una única conversión final, con el valor que
aporte la institución.

Dos razones:

**Vigencia.** En un contexto inflacionario, un caso de negocio expresado en
moneda corriente pierde validez en un trimestre. Expresado en consultas
recuperadas y horas de consultorio liberadas, se mantiene vigente y se
re-monetiza modificando un único parámetro.

**Precisión.** Los aranceles éticos mínimos publicados por los colegios médicos
provinciales —[La Pampa](https://consejomedicolp.org.ar/honorarios-eticos-minimos/),
[Santa Fe](https://colmedicosantafe1.org.ar/?page_id=393),
[Córdoba](https://cmpc.org.ar/nuevos-aranceles-minimos-de-caracter-etico/)—
constituyen un piso gremial, no el ingreso efectivo que percibe una institución
de una obra social, habitualmente inferior. Utilizarlos como ingreso
sobreestimaría el resultado.

### 4.2 Demanda para los turnos que se liberan 🔴

| | |
|---|---|
| Asumido | Sí: hay pacientes para ocupar los turnos que se liberan con aviso |
| Fuente | Sin información. No consta en el brief |
| Confianza | Baja |

**Es el supuesto de mayor impacto sobre el caso de negocio.**

El ajuste de la agenda reduce los turnos ofrecidos (de 1.220 a 1.110 diarios en el
modelo) pero no las consultas atendidas (786 a 793, dentro del ruido), porque
deja de ofrecer los turnos que hoy nadie ocupa. Lo que sí depende de este
supuesto es el beneficio directo: los 41 turnos diarios adicionales que se
liberan con aviso solo se convierten en consultas si hay quien los tome.

No hace falta una lista de espera formal. Los lugares se llenan agendando de
antemano un poco más de lo que entra, sabiendo cuántos turnos se liberan con
aviso cada día. Esa sobreagenda es chica y medida, distinta de la sobreagenda a
ciegas de hoy, que cubre ausencias que nadie avisa. Alcanza con que la agenda se
llene con días de anticipación, que es lo habitual en el país.

- **Con demanda:** 40 consultas adicionales por día, que es la única
  línea del caso de negocio pasada a dólares (USD 106.000 anuales, contando que a
  la clínica le queda el 30% de cada consulta, USD 10).
- **Sin demanda:** el beneficio directo es cero y el retorno de la
  institución se apoya en retención de pacientes y tiempo médico, que la fase 0
  debe valorizar con datos de la red.

---|---|
| Asumido | Sí, existe demanda insatisfecha |
| Fuente | Sin información. No consta en el brief |
| Confianza | Baja |

**Es el supuesto de mayor impacto sobre el caso de negocio.**

El ajuste de la agenda reduce los turnos ofrecidos (de 1.220 a 1.110 diarios en el
modelo) pero no las consultas atendidas (786 a 793, dentro del ruido), porque
deja de ofrecer los turnos que hoy nadie ocupa. Lo que sí depende de la lista de
espera es el beneficio directo valorizado: los 41 turnos diarios adicionales que
se liberan con aviso solo se convierten en consultas si hay quien los tome.

- **Con lista de espera:** 40 consultas adicionales por día, que es la única
  línea del caso de negocio pasada a dólares (USD 106.000 anuales, contando que a
  la clínica le queda el 30% de cada consulta, USD 10).
- **Sin lista de espera:** el beneficio directo es cero y el retorno de la
  institución se apoya en retención de pacientes y tiempo médico, que la fase 0
  debe valorizar con datos de la red.

---

## 5 · Información requerida de la institución

Ordenada por impacto sobre las conclusiones.

1. País de operación de la red.
2. Ingreso neto efectivo por consulta ambulatoria.
3. Con cuánta anticipación se llena la agenda, y si hay lista de espera.
4. Cantidad de consultorios por especialidad en cada sede.
5. Edad promedio de la cartera y canal habitual de contacto.
6. Sistemas informáticos en uso además de las planillas compartidas.
7. Proporción de pacientes ausentes que solicita un nuevo turno.
8. Proporción de pacientes atendidos que vuelven a la red dentro de los 12
   meses siguientes, si el registro actual permite calcularla.
9. Proporción de primeras consultas sobre el total, por especialidad.
10. Cuánto gasta la red por año en captar pacientes (publicidad, Doctoralia,
    convenios) y cuántos pacientes nuevos entran por año.
11. Cuánto se sobreagenda hoy: turnos ofrecidos por hora contra la duración
    del turno, por especialidad y sede.

---

## 6 · Resultados medidos

Los siguientes valores no son supuestos: se obtienen de la simulación y son
reproducibles.

Todos los valores son el **promedio de 64 réplicas** de la jornada completa en
la red de 8 sedes.

| Escenario | Espera media | Franja 14 a 17 h | A las 17 h | Percentil 90 | Atendidos ≤15′ | Ausencias sin aviso | Turnos ofrecidos | Consultas por día |
|---|---|---|---|---|---|---|---|---|
| Hoy | 45 min | 48 min | 56 min | 106 min | 34% | 32% | 1.220 | 786 |
| Fase 1 · Reasignación entre consultorios (sin costo) | 36 min | 37 min | 45 min | 82 min | 40% | 32% | 1.220 | 790 |
| Recordatorios sin ajustar la agenda | 51 min | 56 min | 67 min | 109 min | 28% | 22% | 1.233 | 872 |
| Fase 2 · Confirmación + agenda ajustada, conservando el volumen | 38 min | 40 min | 48 min | 84 min | 37% | 21% | 1.110 | 793 |
| Opción · Fase 2 sin ninguna sobreagenda | 31 min | 34 min | 41 min | 72 min | 43% | 21% | 1.073 | 765 (−3,5%) |
| Opción · Fase 2 + primera consulta a 1,5 veces el turno | 25 min | 26 min | 33 min | 60 min | 49% | 21% | 1.038 | 744 (−6%) |
| Opción · Las dos anteriores | 21 min | 21 min | 26 min | 50 min | 55% | 21% | 1.011 | 723 (−9%) |
| Alternativa cara · Todos los turnos 15% más largos (sobre fase 2) | 20 min | | | 50 min | 58% | | 987 | 704 (−11%) |

Cómo se lee: la fase 1 baja la espera de 45 a 36 minutos sin tocar la agenda.
La fase 2 la mantiene (38, la diferencia con 36 está dentro del error del
modelo), baja las ausencias sin aviso de 32% a 21% y ofrece menos turnos
(1.110) pero atiende los mismos (793), porque dejan de perderse. Los
recordatorios sin ajustar la agenda dejan la espera peor que hoy (51): la fase 2
protege la ganancia de la fase 1. Bajar de 38 cuesta turnos: cada opción de la
tabla resigna una parte de las consultas.

**Sobre las consultas por día.** La diferencia entre hoy y la fase 2 (786 a
793) es de 7 consultas diarias sobre una dispersión de ±68 entre réplicas: **no
es distinguible de cero**. La sobreagenda no aporta capacidad real, sino turnos
que en un tercio de los casos nadie ocupa; al reducirse el ausentismo, la tasa
de uso efectivo de la agenda pasa de 64% a 71% y compensa la reducción de turnos
ofrecidos.

Una caída de volumen consistente aparece únicamente al eliminar por completo la
sobreagenda o al alargar turnos (opciones de la tabla), configuraciones que se
presentan como decisión de la institución y no como parte de la propuesta base.

**Por qué no se agenda cada turno con su duración real.** La consulta dura en
promedio 1,5 veces el turno (31 minutos por turno de 20). Se podría cerrar esa
brecha del todo, dando a cada turno su duración real, y la espera queda en 6
minutos; pero se paga con un tercio de las consultas, porque en la misma
jornada entran muchos menos turnos. Medido sobre la fase 2:

| Agendar todos los turnos… | Espera media | P90 | Atendidos ≤15′ | Consultas por día |
|---|---|---|---|---|
| como hoy (fase 2) | 38 min | 84 min | 37% | 793 |
| 15% más largos | 20 min | 50 min | 58% | 704 (−11%) |
| 30% más largos | 11 min | 29 min | 73% | 612 (−23%) |
| 50% más largos (la duración real) | 6 min | 16 min | 85% | 531 (−33%) |

La brecha entre turno y consulta es la causa de fondo, y solo se cierra
resignando volumen (o acortando la consulta real, que la evidencia sobre
asistentes de transcripción no respalda). Por eso la propuesta empieza por las
dos palancas sin costo (reasignar; confirmar y ajustar la agenda) y después
ofrece las opciones con costo de la más barata a la más cara por minuto ganado:
la primera consulta más larga (6% de consultas por 13 minutos menos) antes que
alargar todos los turnos (11% por 18 minutos).

**Por qué no desagendar antes de bajar las ausencias.** Dejar de sobreagendar
también baja la espera en la fase 1, pero con las ausencias de hoy (30%) cada
turno que se deja de ofrecer es un paciente menos atendido, porque no hay quien
ocupe el hueco. Medido con reasignación y sin confirmación:

| Fase 1 con… | Espera media | P90 | Atendidos ≤15′ | Ofrecidos | Atendidos | Consultas perdidas por día |
|---|---|---|---|---|---|---|
| la sobreagenda de hoy | 36 min | 82 min | 40% | 1.220 | 790 | 0 |
| la mitad de sobreagenda | 29 min | 68 min | 46% | 1.136 | 741 | −49 (−6%) |
| casi ninguna | 27 min | 64 min | 49% | 1.116 | 726 | −64 (−8%) |
| ninguna | 22 min | 52 min | 55% | 1.064 | 693 | −97 (−12%) |

El mismo movimiento después de la fase 2, con las ausencias en 21%, lleva la
espera a 31 minutos perdiendo 28 consultas: para el mismo minuto de espera,
desagendar antes de bajar las ausencias cuesta dos a tres veces más consultas
que hacerlo después. Es la razón de fondo del orden del plan: primero
reasignar, después bajar las ausencias, y recién ahí decidir cuánta sobreagenda
se saca, con la tasa de ausencia real medida.

**Nota metodológica.** Los escenarios que modifican la agenda generan una jornada
distinta, con otros pacientes, de modo que la comparación no es exacta sobre la misma población. Las
réplicas corrigen ese efecto: una única corrida produce diferencias del orden del
ruido de generación y puede arrojar resultados inconsistentes. Con 8 réplicas el
error estándar de la espera media era del orden de la diferencia entre fases,
insuficiente para separarlas; se subió a 64, y la simulación tarda menos de un
segundo por escenario.

Son consecuencia de los supuestos precedentes. Modificar un supuesto modifica
estos valores; el modelo los recalcula.
