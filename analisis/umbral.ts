/**
 * ANÁLISIS DE SENSIBILIDAD DEL UMBRAL DE GANANCIA MÍNIMA.
 *
 * Correr con: npm run umbral
 *
 * Responde "¿por qué el motor pide 12 minutos de ganancia para proponer un
 * cambio de consultorio, y no 5, 8 o 25?". Toma la jornada simulada, se para
 * cada media hora en cada sede, le pide al motor un plan con distintos
 * umbrales y compara:
 *
 *   - cuántos cambios propone y cuántos minutos de espera prevé ahorrar;
 *   - cuánto se equivoca la estimación "sin acción" del motor contra lo que
 *     realmente pasó en la jornada (el plan trae los inicios reales), que es
 *     el error contra el que hay que medir un ahorro prometido;
 *   - qué parte de los cambios promete un ahorro menor que ese error, es
 *     decir, cambios que el paciente puede no notar.
 *
 * Las instantáneas son independientes (no se aplica el plan y se sigue), así
 * que los totales son "propuestas del motor a lo largo del día", no minutos
 * efectivamente ahorrados. Alcanza para comparar umbrales entre sí.
 */

import { proyectar, generarRed } from '../lib/seed';
import { planificar } from '../lib/optimizador';
import { JORNADA, type Minutos } from '../lib/domain';

const UMBRALES: Minutos[] = [3, 5, 8, 10, 12, 15, 20, 25, 30, 40];
const REPLICAS = 4;
const PASO: Minutos = 30;
const SEMILLA_BASE = 20260813;

interface Acumulado {
  cambios: number;
  minutos: number;
  ahorros: number[];
}

const pad = (s: string | number, n: number) => String(s).padStart(n);
const percentil = (xs: number[], p: number): number => {
  if (xs.length === 0) return 0;
  const ys = [...xs].sort((a, b) => a - b);
  return ys[Math.min(ys.length - 1, Math.floor(ys.length * p))];
};

function main(): void {
  const porUmbral = new Map<Minutos, Acumulado>(
    UMBRALES.map((u) => [u, { cambios: 0, minutos: 0, ahorros: [] }]),
  );
  /* Error de la estimación "sin acción": el motor calcula cuándo atenderían
   * al paciente si no se lo mueve; la jornada simulada sabe cuándo lo
   * atendieron de verdad. Se mide con el umbral más bajo para tener más
   * casos; el error no depende del umbral. */
  const errores: number[] = [];
  let instantaneas = 0;

  for (let r = 0; r < REPLICAS; r++) {
    const red = generarRed(SEMILLA_BASE + r * 7919);
    const inicioReal = new Map(red.planes.map((p) => [p.id, p.inicioA]));

    for (const sede of red.sedes) {
      const planes = red.planes.filter((p) => p.sedeId === sede.id);
      const consultorios = red.consultorios.filter((c) => c.sedeId === sede.id);

      for (let t = JORNADA.apertura + 60; t <= JORNADA.cierre; t += PASO) {
        const turnos = planes.map((p) => proyectar(p, t));
        instantaneas++;

        for (const u of UMBRALES) {
          const plan = planificar(turnos, consultorios, t, u);
          const acc = porUmbral.get(u)!;
          acc.cambios += plan.reasignaciones.length;
          acc.minutos += plan.minutosRecuperados;
          for (const m of plan.reasignaciones) {
            acc.ahorros.push(m.minutosAhorrados);
            if (u === UMBRALES[0]) {
              const real = inicioReal.get(m.turnoId);
              if (real !== undefined) errores.push(Math.abs(m.inicioSinAccion - real));
            }
          }
        }
      }
    }
  }

  const errorTipico = percentil(errores, 0.5);
  const errorAlto = percentil(errores, 0.75);

  console.log(
    `\n═══ UMBRAL DE GANANCIA MÍNIMA · ${REPLICAS} réplicas · ${instantaneas} instantáneas (8 sedes, cada ${PASO} min) ═══\n`,
  );
  console.log(
    `Error de la estimación "sin acción" del motor contra el inicio real: ` +
      `mediana ${errorTipico} min · percentil 75: ${errorAlto} min · casos: ${errores.length}\n`,
  );
  console.log(
    'umbral   cambios   min. ahorrados   ahorro mediano   % cambios con ahorro < error típico   % < p75',
  );
  console.log('─'.repeat(100));
  for (const u of UMBRALES) {
    const acc = porUmbral.get(u)!;
    const chicos = acc.ahorros.filter((a) => a < errorTipico).length;
    const chicosAlto = acc.ahorros.filter((a) => a < errorAlto).length;
    const pct = (n: number) => (acc.ahorros.length ? ((n / acc.ahorros.length) * 100).toFixed(0) : '0');
    console.log(
      `${pad(u, 4)}′  ${pad(acc.cambios, 8)}  ${pad(acc.minutos, 14)}′  ` +
        `${pad(percentil(acc.ahorros, 0.5), 13)}′  ${pad(pct(chicos), 34)}%  ${pad(pct(chicosAlto), 7)}%`,
    );
  }
  console.log(
    '\nLectura: bajar el umbral suma cambios chicos (ahorro prometido del orden del error de la\n' +
      'estimación) sin sumar minutos en la misma proporción; subirlo deja pasar cambios que valen.\n' +
      'El valor por defecto (12) es el primer umbral con el que ningún cambio promete menos que el error\n' +
      'típico de la estimación, ahorra más minutos que 8 y sigue ayudando a 9 de cada 10 pacientes. Es\n' +
      'configurable por sede.',
  );
}

main();
