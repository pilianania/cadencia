# Supuestos del análisis

> Esta sección va **al frente** de la propuesta, no en un apéndice.
>
> El brief describe una operación con tres números duros —45 minutos de espera,
> 30% de ausencias, 8 sedes— y nada más. Todo el resto del análisis se apoya en
> supuestos. Declararlos es lo que permite discutirlos.
>
> Cada supuesto indica **qué cambia en la conclusión si el valor real es otro**.
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

### 1.1 Volumen

| | |
|---|---|
| **Asumido** | 1.371 turnos/día en la red · 42 consultorios · 171 turnos por sede |
| **Rango** | 900 – 1.800 turnos/día |
| **Base** | Derivado de 8 sedes × 4–6 consultorios × jornada 08:00–18:00 con slots de 15–30 min según especialidad |
| **Confianza** | Media |

**Sensibilidad:** escala el beneficio absoluto de forma lineal. **No cambia los
porcentajes de mejora ni el orden de las fases.** Si la red es la mitad de grande,
todos los resultados se dividen por dos y las conclusiones se mantienen intactas.

### 1.2 Profundidad del pool por especialidad ⚠️

| | |
|---|---|
| **Asumido** | 95% de los consultorios comparte especialidad con otro de la misma sede |
| **Rango** | 25% – 100% |
| **Base** | Estructura típica de centro ambulatorio mixto: clínica médica como puerta de entrada más especialidades de alta demanda, duplicadas |
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
