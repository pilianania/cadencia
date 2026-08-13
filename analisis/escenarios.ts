/**
 * ANÁLISIS DE ESCENARIOS — genera los números del caso de negocio.
 *
 * Correr con: npm run analisis
 *
 * Existe para que ninguna cifra de la propuesta sea una afirmación suelta.
 * Cada número del documento sale de acá y se puede reproducir delante del
 * cliente. Si alguien discute un supuesto, se cambia el parámetro y se vuelve
 * a correr en el momento.
 *
 * Las palancas se evalúan EN ESCALERA y sobre la misma población de pacientes,
 * con las mismas duraciones reales de consulta y las mismas llegadas. La única
 * variable entre escenarios es la política.
 */

import { formatoHora } from '../lib/domain';
import { generarRed } from '../lib/seed';
import { simularDia } from '../lib/simulador';

interface Escenario {
  nombre: string;
  factorSobreagenda: number;
  reduccionAusencias: number;
  reasignar: boolean;
  nota: string;
}

const ESCENARIOS: Escenario[] = [
  {
    nombre: '0 · Hoy',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0,
    reasignar: false,
    nota: 'Statu quo: agenda telefónica, planillas, sin visibilidad.',
  },
  {
    nombre: '1 · + Reasignación',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0,
    reasignar: true,
    nota: 'Los consultorios de una especialidad atienden como un pool.',
  },
  {
    nombre: '2 · + Recordatorios',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0.35,
    reasignar: true,
    nota: 'ATENCIÓN: sin desagendar, esta palanca EMPEORA la espera.',
  },
  {
    nombre: '3 · + Desagendar',
    factorSobreagenda: 0.1,
    reduccionAusencias: 0.35,
    reasignar: true,
    nota: 'Se deja de sobreagendar porque ya no hace falta cubrirse.',
  },
];

interface Resultado {
  espera: number;
  tarde: number;
  p90: number;
  dentroDe15: number;
  tasaAusencia: number;
  atendidos: number;
  tiempoMuertoH: number;
}

function correr(e: Escenario): Resultado {
  const red = generarRed(20260813, {
    factorSobreagenda: e.factorSobreagenda,
    reduccionAusencias: e.reduccionAusencias,
  });

  let espera = 0;
  let p90 = 0;
  let d15 = 0;
  let ausentes = 0;
  let atendidos = 0;
  let tiempoMuerto = 0;
  let n = 0;
  const tarde: number[] = [];

  for (const sede of red.sedes) {
    const planes = red.planes.filter((p) => p.sedeId === sede.id);
    const consultorios = red.consultorios.filter((c) => c.sedeId === sede.id);
    const r = simularDia(planes, consultorios, { reasignar: e.reasignar });

    espera += r.esperaPercibida;
    p90 += r.esperaP90;
    d15 += r.dentroDe15;
    ausentes += r.ausentes;
    atendidos += r.atendidos;
    tiempoMuerto += r.tiempoMuerto;
    n++;

    for (const punto of r.curva) {
      if (punto.hora >= 14 * 60 && punto.hora <= 17 * 60) tarde.push(punto.espera);
    }
  }

  return {
    espera: espera / n,
    tarde: tarde.length ? tarde.reduce((s, x) => s + x, 0) / tarde.length : 0,
    p90: p90 / n,
    dentroDe15: d15 / n,
    tasaAusencia: ausentes / (ausentes + atendidos),
    atendidos,
    tiempoMuertoH: tiempoMuerto / n / 60,
  };
}

function main(): void {
  const pad = (s: string | number, n: number) => String(s).padStart(n);

  console.log('\n═══ ESCENARIOS · red de 8 sedes, jornada completa ═══\n');
  console.log(
    'escenario              media    tarde     P90   ≤15′   ausencias  atendidos',
  );
  console.log('─'.repeat(76));

  const resultados = ESCENARIOS.map((e) => ({ e, r: correr(e) }));
  const base = resultados[0].r;

  for (const { e, r } of resultados) {
    console.log(
      `${e.nombre.padEnd(22)}${pad(r.espera.toFixed(1), 6)}′ ${pad(r.tarde.toFixed(1), 7)}′ ${pad(r.p90.toFixed(0), 6)}′ ${pad((r.dentroDe15 * 100).toFixed(0), 5)}% ${pad((r.tasaAusencia * 100).toFixed(1), 10)}% ${pad(r.atendidos, 10)}`,
    );
  }

  console.log('\n─── Notas por escenario ───');
  for (const { e } of resultados) console.log(`${e.nombre.padEnd(22)} ${e.nota}`);

  const fin = resultados[resultados.length - 1].r;
  console.log('\n─── Efecto total ───');
  console.log(
    `Espera media          ${base.espera.toFixed(1)}′ → ${fin.espera.toFixed(1)}′   (${(((fin.espera / base.espera) - 1) * 100).toFixed(0)}%)`,
  );
  console.log(
    `Espera de la tarde    ${base.tarde.toFixed(1)}′ → ${fin.tarde.toFixed(1)}′   (${(((fin.tarde / base.tarde) - 1) * 100).toFixed(0)}%)`,
  );
  console.log(
    `P90                   ${base.p90.toFixed(0)}′ → ${fin.p90.toFixed(0)}′`,
  );
  console.log(
    `Atendidos ≤15′        ${(base.dentroDe15 * 100).toFixed(0)}% → ${(fin.dentroDe15 * 100).toFixed(0)}%`,
  );
  console.log(
    `Consultas por día     ${base.atendidos} → ${fin.atendidos}   (${fin.atendidos - base.atendidos})  ← costo de capacidad, decirlo`,
  );

  console.log('\n─── Curva de la jornada (escenario 0 vs 3) ───');
  const curva = (e: Escenario) => {
    const red = generarRed(20260813, {
      factorSobreagenda: e.factorSobreagenda,
      reduccionAusencias: e.reduccionAusencias,
    });
    const acumulado = new Map<number, number[]>();
    for (const sede of red.sedes) {
      const planes = red.planes.filter((p) => p.sedeId === sede.id);
      const cons = red.consultorios.filter((c) => c.sedeId === sede.id);
      for (const punto of simularDia(planes, cons, { reasignar: e.reasignar }).curva) {
        const xs = acumulado.get(punto.hora) ?? [];
        xs.push(punto.espera);
        acumulado.set(punto.hora, xs);
      }
    }
    return acumulado;
  };

  const c0 = curva(ESCENARIOS[0]);
  const c3 = curva(ESCENARIOS[3]);
  const prom = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

  for (const hora of [...c0.keys()].sort((a, b) => a - b)) {
    const a = prom(c0.get(hora)!);
    /* Que una hora no exista en el escenario 3 no es un cero: significa que a
     * esa altura ya no quedaba nadie esperando. Es el resultado más fuerte del
     * análisis —la jornada cierra en horario— y mostrarlo como "0.0′" lo hace
     * parecer un dato faltante. */
    const cerrado = !c3.has(hora);
    const b = cerrado ? null : prom(c3.get(hora)!);
    const derecha =
      b === null
        ? 'con Cadencia    sin cola — jornada cerrada'
        : `con Cadencia ${pad(b.toFixed(1), 6)}′  ${'█'.repeat(Math.round(b / 4))}`;
    console.log(
      `${formatoHora(hora)}  hoy ${pad(a.toFixed(1), 6)}′  ${'█'.repeat(Math.round(a / 4)).padEnd(22)}  ${derecha}`,
    );
  }
  console.log();
}

main();
