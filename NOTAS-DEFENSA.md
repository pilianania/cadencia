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
> sobreagendan para cubrirse. Bajar ausencias es lo que habilita dejar de
> sobreagendar, y eso es lo que baja la espera.

Si solo podés decir una cosa, es esa. Todo el plan se deriva de ahí.

---

## Objeciones probables

### "¿Por qué no implementan los recordatorios primero, que es lo fácil?"

Está medido: **empeora**. De 23,7 a 27,4 minutos. Los pacientes recuperados
entran en una grilla armada asumiendo que no venían.

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

### "¿Por qué no lo automatizan?"

Mover a un paciente puede ser incorrecto por cosas que el sistema no ve:
continuidad con su médico, un estudio pendiente en otra sala, un acompañante.
Recepción sí las ve.

El sistema propone, la persona decide. Un sistema que reordena la sala sin avisar
se apaga en una semana.

### "El paciente se marea con tantos cambios"

Tres restricciones, ninguna técnica:

1. Solo se mueve si el ahorro supera 8 minutos
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
del tamaño de la red sino de su utilización.** Medido — 8 sedes dan −37%, un
subconjunto más congestionado da −51%. Lo que se sostiene ante un error de
volumen es el orden de las fases.

### "Nuestra consulta factura la mitad de lo que asumiste"

El modelo no está en pesos. Trabaja en consultas y horas-consultorio, y se
monetiza con un solo parámetro que aportan ellos. Cambiás el número y recalculás
en la reunión.

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

2. **Lista de espera** — no sabemos si existe. Decide si la fase 3 cuesta 56
   consultas/día o es gratis. Es la pregunta más rentable de la reunión.

3. **Causas de ausencia prestadas** — la distribución (olvido 44%) es del
   Hospital Italiano, población prepaga urbana. La red del brief incluye La Plata
   y el conurbano. Está acoplado con el supuesto de 35% de reducción: si el
   olvido pesa menos, la fase 2 rinde menos.

4. **El código de turno del prototipo se deriva, no se persiste.** En producción
   se asigna una vez al reservar. Es limitación del prototipo, no del diseño.

5. **El simulador modela pooling ideal (23,7′); el motor de la UI es la versión
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
| Relevamiento por mensaje, no por llamado | No escala a 1.371 turnos/día. Con muestra telefónica de no respondedores para controlar sesgo |
| Modelo en unidades físicas, no en pesos | En contexto inflacionario un caso en pesos se vence en un trimestre |

---

## El hallazgo con el que abrir

La curva de la jornada. Hoy la espera arranca en 5 minutos a las 8:00 y llega a
60 a las 18:00, y la jornada cierra recién a las 20:00.

**La agenda nunca se recupera dentro del día.** Cada hora hereda la deuda de la
anterior.

Eso convierte "tenemos 45 minutos de espera" en "tenemos una cascada que arranca
a las 9 y nadie corta" — que es un problema con solución barata en lugar de un
pedido de más consultorios.

---

## Qué mostrar del prototipo, en orden

1. **Vista de red** — "¿a cuál de mis ocho sedes voy hoy?" Es la pantalla de la
   Directora
2. **Carril de deriva** en la sede peor — la cascada se ve sin explicación
3. **Aplicar plan** — el motor propone y ejecuta
4. **Vista de paciente** — teléfono y pantalla de sala, con el punto de privacidad
5. **Escenarios** — la lámina para el CEO, con la fase 2 corriendo por encima de
   la fase 1

Mover el reloj a las 14:00 antes de mostrar el carril: a las 9 de la mañana no se
ve nada.
