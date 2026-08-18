# Notas de defensa — NO ENTREGAR

> Documento interno. No forma parte de los entregables.
> Contiene el razonamiento detrás de las decisiones, las objeciones anticipadas
> y lo que conviene decir primero.

---

## Regla general

**Decir vos las debilidades antes de que las encuentren.** Todo lo que figura
abajo como "objeción" es algo que ya está resuelto o acotado en el documento. La
diferencia entre que suene a solidez o a excusa es quién lo menciona primero.

---

## El argumento central, en una frase

> Sus dos números no son dos problemas: son el mismo. Con 30% de ausencias, la
> demora se disolvería en los huecos. Que convivan solo se explica porque
> sobreagendan para cubrirse. La reasignación baja la espera de 45 a 36 sin
> tocar nada más; bajar las ausencias es lo que permite ajustar la agenda sin
> perder volumen y proteger esa ganancia. Bajar de ahí ya cuesta turnos, y eso
> lo decide la institución con datos propios.

Si solo podés decir una cosa, es esa. Todo el plan se deriva de ahí.

---

## Objeciones probables

### "¿Por qué no implementan los recordatorios primero, que es lo fácil?"

Está medido: **empeora**. De 36 a 51 minutos, peor que hoy. Los pacientes
recuperados entran en una agenda armada asumiendo que no venían.

Es el argumento más fuerte contra los otros dos proveedores: si alguno ofrece
"recordatorios por WhatsApp" como quick win, va a empeorar el número que la
clienta quiere bajar, y lo va a hacer en el mes 2, que es cuando se evalúa si el
proyecto sigue.

### "¿Por qué no usan un optimizador de verdad?"

Es un balanceador greedy, no un solver de programación entera. Tres razones:

1. Corre en milisegundos en el navegador, sin backend de optimización
2. Es **auditable**: recepción puede leer por qué se movió cada paciente
3. El cuello de botella real no es la optimalidad matemática — es que hoy nadie
   reasigna nada

Un solver que devuelve una asignación óptima sin explicación no se usa en un
mostrador: se desconfía de él y se vuelve a la planilla.

### "¿Y si le ofrecen un cambio a alguien que tiene que ver a su médico?"

Las ofertas salen solas, sin que recepción las apruebe: el consultorio libre no
puede esperar a que alguien mire el tablero. Dos guardas: el que decide es el
paciente (si le importa seguir con su médico, rechaza), y lo que el sistema no
puede saber (tratamiento en curso, estudio a revisar con ese profesional) se
marca una vez en el turno como "no reasignable" y no entra al motor. Un sistema
que mueve gente sin preguntar se apaga en una semana; uno que ofrece, no.

### "El paciente se marea con tantos cambios"

Tres restricciones, ninguna técnica:

1. Solo se mueve si el ahorro supera 12 minutos (mediana del error de la
   estimación; medido con `npm run umbral`)
2. Nunca hay intercambios cruzados entre dos consultorios
3. Cada movimiento se comunica con su motivo, y **el código de turno no cambia
   nunca**

### "Hay estudios que dicen que la espera no afecta la satisfacción"

Existen, y está en el anexo. El de El Cruce no encontró asociación. Tres razones
por las que no aplica:

1. **Efecto techo** — mediana 10/10, sin varianza que explicar
2. **Población cautiva** — hospital público sin alternativa de derivación
3. **Midió satisfacción global, no satisfacción con la espera** — hay trabajos
   con 95% global y 26% de insatisfacción específica con la espera en la misma
   muestra

Y del otro lado está Figueres: ρ = −0,304, p < 0,001, con umbral en 15 minutos.

### "¿De dónde sacaste el volumen / los consultorios?"

Los asumí, y está declarado. Lo importante: **el porcentaje de mejora no depende
del tamaño de la red sino de su utilización.** Medido: la red completa da −20%
con la reasignación (64 réplicas), y un subconjunto más congestionado mejora más. Lo que se sostiene ante un error
de volumen es el orden de las fases.

### "Nuestra consulta factura la mitad de lo que asumiste"

El modelo no está en pesos. Trabaja en consultas y horas-consultorio, y se
monetiza con un solo parámetro que aportan ellos. Cambiás el número y recalculás
en la reunión.

### "¿Por qué la licencia cuesta diez veces una agenda con recordatorios?"

Porque no es una agenda con recordatorios. Turnito y SimpleTurno cobran USD 9 a
28 por cuenta y mes; para la red, USD 100 a 1.200 mensuales. Nosotros USD 4.000.
En precio se pierde, y hay que decirlo antes de que lo digan. Se gana en oferta
técnica: la agenda con recordatorios entrega la fase 2 sin ajuste de la agenda, y
eso empeora la espera de 36 a 51 minutos. La comparación es contra el beneficio
(USD 106.000 anuales si los turnos liberados se vuelven a dar), no contra ese precio.

### "¿Cuánto gana Intuit con esto?"

Primer año negativo (USD 57.000), se paga durante el segundo, y a régimen
deja ~50% de margen. Lo que hay que construir no es el software: es capacidad de
implantación (de 1 a 4 personas en tres años) y de vender por licitación. Si el
año 2 cierra dos redes en vez de cinco, el equilibrio pasa al tercer año.

### "¿Y esto corre sobre Clever?"

**No asumir nada sobre Clever.** El brief lo pide. La propuesta se presenta como
módulo autónomo que se integra por HL7 y FHIR con lo que la red tenga. Los
antecedentes del oferente quedan como dato a completar por Intuit.

### "¿De dónde sale que la clínica se queda con el 30% de la consulta?"

Es un supuesto, y hay que decirlo así. En consultorios privados el médico cobra
un porcentaje de cada consulta; el reparto varía por institución y no hay dato
público. Se tomó 70/30, que es un arreglo habitual y del lado bajo para la
clínica. Si la red retiene menos, el retorno baja en proporción: es el segundo
dato que se le pide.

### "¿Y los médicos qué dicen?"

Es el riesgo R4 y es el más subestimado. El carril de deriva hace visible cuánto
se atrasa cada consultorio: técnicamente inocuo, políticamente explosivo.

Durante fases 0 y 1 las métricas se reportan **por sede, nunca por profesional**.
La conversación sobre desempeño individual, si llega, es de ellos y es posterior.

---

## Las debilidades reales — decirlas vos

1. **Profundidad del pool (95%)** — es el supuesto más débil, sin fuente pública.
   Si la red está fragmentada, la fase 1 vale cero. Por eso la fase 0 la mide
   antes de comprometer resultado.

2. **Demanda para los turnos que se liberan**: no sabemos si la agenda se llena
   con anticipación. Decide si el beneficio directo son 40 consultas/día más
   (USD 106.000 anuales) o cero. No hace falta lista de espera formal: alcanza
   con agendar de antemano lo que se sabe que se libera con aviso (sobreagenda
   chica y medida, no la de hoy). Es la pregunta más rentable de la reunión.

3. **Causas de ausencia prestadas** — la distribución (olvido 44%) es del
   Hospital Italiano, población prepaga urbana. La red del brief incluye La Plata
   y el conurbano. Está acoplado con el supuesto de 35% de reducción: si el
   olvido pesa menos, la fase 2 rinde menos.

4. **El código de turno del prototipo se deriva, no se persiste.** En producción
   se asigna una vez al reservar. Es limitación del prototipo, no del diseño.

5. **El simulador modela pooling ideal (35,7′); el motor de la UI es la versión
   restringida y legible.** El simulador muestra el techo, el motor lo
   practicable. Si los números no coinciden exactamente, esa es la razón.

---

## Decisiones de producto que conviene contar

| Decisión | Por qué |
|---|---|
| Ventana estimada, nunca hora exacta | Una hora exacta es una promesa que la clínica no controla: depende de cuánto dure la consulta de adelante, que es información médica. Fallarla destruye más confianza que no darla |
| Pantalla de sala sin nombres | "María Gómez — Endocrinología" revela la condición de salud de una persona identificada a toda la sala. Ley 25.326, arts. 2 y 7 |
| Evento de calendario sin especialidad | Un calendario se comparte con la pareja y con el trabajo. "Oncología — Dr. Pérez" filtra la condición hacia gente que el paciente nunca eligió informar |
| Hora flotante en el .ics | Convertir a UTC obliga a fijar un huso, y la jurisdicción es un supuesto abierto |
| El plan no hace intercambios cruzados | Cierran en minutos pero recepción lee dos órdenes contradictorias y vuelve a la planilla. Cuesta 35% de los movimientos y compra que el sistema se use |
| Relevamiento por mensaje, no por llamado | No escala a 1.225 turnos/día. Con muestra telefónica de no respondedores para controlar sesgo |
| Modelo en unidades físicas, no en pesos | En contexto inflacionario un caso en pesos se vence en un trimestre |

---

## El hallazgo con el que abrir

La curva de la jornada. Hoy la espera arranca en 6 minutos a las 8:00 y llega a
80 a las 18:00, y la jornada cierra recién a las 20:06.

**La agenda nunca se recupera dentro del día.** Cada hora hereda la deuda de la
anterior.

Eso convierte "tenemos 45 minutos de espera" en "tenemos una cascada que arranca
a las 9 y nadie corta" — que es un problema con solución barata en lugar de un
pedido de más consultorios.

---

## Qué mostrar del prototipo, en orden

1. **Vista de red** — "¿a cuál de mis ocho sedes voy hoy?" Es la pantalla de la
   Directora
2. **Sede**, en la peor: arriba la lista de recepción (llegó, pasar a consulta,
   avisó, no vino) que es lo que el mostrador usa todo el día; abajo el carril
   de deriva, donde la cascada se ve sin explicación
3. **Ofertas del motor**: el plan sale solo a los teléfonos, el paciente acepta o rechaza y el panel muestra cuántas se aceptaron; recepción no aplica nada a mano
4. **Vista de paciente**: teléfono y turnera de sala (código y consultorio, sin nombres), con el punto de privacidad
5. **Por período** (conmutador "Hoy / Por período" en Red y en Sede): los
   indicadores del año, con la variación contra la línea de base y los hitos
   del despliegue en el gráfico; la comparación de escenarios se muestra desde
   la propuesta

Mover el reloj a las 14:00 antes de mostrar el carril: a las 9 de la mañana no se
ve nada.
