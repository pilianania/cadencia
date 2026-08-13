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
| Asumido | 1.371 turnos diarios · 42 consultorios · 171 turnos por sede |
| Rango | 900 – 1.800 turnos/día · 24 – 60 consultorios |
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
| Red completa *(8 réplicas)* | 32,1 min | 20,2 min | −37% |
| Subconjunto de mayor congestión *(réplica única)* | 39,5 min | 19,4 min | −51% |
| Capacidad constante con demanda reducida a la mitad *(réplica única)* | 56,8 min | — | desciende a 4,2 min sin intervención |

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
| Asumido | 1,1 – 1,3 × la duración agendada |
| Confianza | Media-alta, por convergencia de fuentes |

**Es el mecanismo que origina la cascada de demoras.** Si la consulta se ajustara
exactamente a su duración agendada no habría corrimiento, y el problema reportado
no existiría. La demora no se origina en la impuntualidad ni en las ausencias: se
origina en que cada consulta llega tarde a la siguiente.

| Tipo de fuente | Referencia | Aporte |
|---|---|---|
| Gremial, por especialidad | [Sociedad Argentina de Cardiología](https://www.lanacion.com.ar/sociedad/crisis-sanitaria-mas-de-30-asociaciones-medicas-avalan-la-aplicacion-de-un-honorario-minimo-federal-nid21092023/) | Al 70% de los profesionales se le requieren turnos de 10–15 min; consideran necesarios 20–30. Brecha implícita: 1,5–2 × |
| Gremial, federal | [COMRA](https://misionesonline.net/2026/04/20/pami-comra-afiliados-crisis/) | Turnos a tres meses y cartillas con pérdida de profesionales: la congestión es sistémica |
| Sectorial | [INFOMED](https://infomed.com.ar/consulta-medica-cuanto-dura-en-promedio/) | Media en torno a 15 min; rara vez supera los 20 |
| Académica | [Rev. Argentina de Salud Pública, Hospital El Cruce](https://rasp.msal.gov.ar/rasp/articulos/vol13/AO_GarciaMunitis44.pdf) — 26 profesionales, 11 subespecialidades | Mide duración de consulta y tiempo de espera en entorno ambulatorio local |

La fuente gremial corresponde a una única especialidad y proviene de una parte
con interés en el resultado, por lo que no se utiliza de forma aislada ni se
adopta su magnitud. El supuesto se sostiene en la convergencia de las cuatro, y
**se modeló por debajo del rango que todas ellas sugieren**: el análisis
subestima deliberadamente el problema y, en consecuencia, también el beneficio.

### 1.4 Extensión de la jornada

| | |
|---|---|
| Asumido | 08:00 – 18:00 corrido |
| Fuente | Sin fuente. Asunción operativa |
| Confianza | Media |

Una jornada partida reiniciaría parcialmente la cascada al mediodía y reduciría
el corrimiento acumulado. Modifica la forma de la curva, no la dirección del
resultado.

### 1.5 Profundidad del pool por especialidad ⚠️

| | |
|---|---|
| Asumido | 95% de los consultorios comparte especialidad con otro de la misma sede |
| Rango | 25% – 100% |
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
| Rango | 23% – 34% |
| Fuente | Cifra reportada en la reunión inicial. Consistente con [Giunta et al., Hospital Italiano de Buenos Aires / CONICET](https://bicyt.conicet.gov.ar/fichas/produccion/8748547), que estima 23–34% en un sistema de salud argentino, y con un [análisis sobre 500.000 turnos de clínicas e instituciones argentinas](https://www.cronista.com/infotechnology/it-business/le-encontraron-la-vuelta-al-drama-de-conseguir-un-turno-medico-en-la-argentina-como-lo-hacen-y-por-que-su-idea-ya-vale-millones/) que reporta que uno de cada tres pacientes no concurre |
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
| Rango | 20% – 50% |
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
| Relación inversa espera–satisfacción | ρ = −0,304 en la visita médica · p < 0,001 |
| Umbral de quiebre | Quienes esperaron menos de **15 minutos** resultaron significativamente más satisfechos |
| Efecto de informar al paciente | Mejora significativa de la satisfacción · **p = 0,001** |
| Brecha percepción–realidad | 5,9 minutos reales percibidos como 16,7 |

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

### 4.2 Existencia de lista de espera 🔴

| | |
|---|---|
| Asumido | Sí, existe demanda insatisfecha |
| Fuente | Sin información. No consta en el brief |
| Confianza | Baja |

**Es el supuesto de mayor impacto sobre el caso de negocio.**

El rediseño de grilla reduce la agenda en aproximadamente 56 consultas diarias.

- **Con lista de espera:** los turnos liberados se cubren con demanda existente.
  El costo tiende a cero y la mejora de experiencia resulta neutra en facturación.
- **Sin lista de espera:** constituye una reducción real de ingresos y debe
  presentarse como una decisión explícita entre volumen y experiencia.

---

## 5 · Información requerida de la institución

Ordenada por impacto sobre las conclusiones.

1. País de operación de la red.
2. Ingreso neto efectivo por consulta ambulatoria.
3. Existencia de lista de espera o demanda insatisfecha.
4. Cantidad de consultorios por especialidad en cada sede.
5. Edad promedio de la cartera y canal habitual de contacto.
6. Sistemas informáticos en uso además de las planillas compartidas.
7. Proporción de pacientes ausentes que solicita un nuevo turno.

---

## 6 · Resultados medidos

Los siguientes valores no son supuestos: se obtienen de la simulación y son
reproducibles.

Todos los valores son el **promedio de 8 réplicas** de la jornada completa, con
su dispersión entre réplicas.

| Indicador | Actual | Con la propuesta | Dispersión |
|---|---|---|---|
| Espera media percibida | 32,1 min | 20,2 min (−37%) | ±4,4 / ±1,4 |
| Espera franja 14–17 h | 32,9 min | 19,8 min (−40%) | — |
| Espera a las 17 h | 40,4 min | 26,6 min (−34%) | — |
| Percentil 90 | 78 min | 48 min | — |
| Atendidos dentro de los 15 min | 43% | 54% | — |
| Consultas diarias | 800 | 791 (−9) | **±71** |

**Sobre la última fila.** La reducción de volumen es de 9 consultas diarias sobre
una dispersión de ±71 entre réplicas: **no es distinguible de cero**. El
sobreagendamiento no aporta capacidad real, sino turnos que en un tercio de los
casos nadie ocupa; al reducirse el ausentismo, la tasa de uso efectivo de la
agenda pasa de 63% a 72% y compensa la reducción de turnos ofrecidos.

Una caída de volumen consistente aparece únicamente si se elimina por completo el
sobreagendamiento, configuración que no se propone.

**Nota metodológica.** Los escenarios que modifican la grilla generan una agenda
distinta, de modo que la comparación no es exacta sobre la misma población. Las
réplicas corrigen ese efecto: una única corrida produce diferencias del orden del
ruido de generación y puede arrojar resultados inconsistentes.

Son consecuencia de los supuestos precedentes. Modificar un supuesto modifica
estos valores; el modelo los recalcula.
