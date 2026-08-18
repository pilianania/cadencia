/**
 * Indicadores de gerencia por período: día, mes y año.
 *
 * Es la vista que la Dirección usaría en operación: los indicadores de SU red
 * a lo largo del tiempo, con evolución y desglose por sede. No compara
 * escenarios; eso vive en el comparador y en el documento.
 *
 * Como el prototipo no tiene datos reales, se simula un año de operación
 * (12 meses de 22 jornadas) en el que el módulo se despliega por fases, que
 * es lo que la Dirección vería si el proyecto se hiciera:
 *   meses 1 a 3   fase 0, medición: la red opera como hoy
 *   meses 4 y 5   fase 1, reasignación
 *   meses 6 a 8   fase 2, confirmación y agenda ajustada
 *   meses 9 a 12  fase 3, turno de primera vez más largo
 * Son las mismas palancas, con los mismos parámetros, que los escenarios del
 * comparador (`lib/escenarios.ts`): el año tiene que terminar donde el caso
 * de negocio dice que termina. Cada jornada tiene su semilla determinista,
 * así que el año es reproducible.
 */

import { JORNADA } from './domain';
import { ESCENARIOS } from './escenarios';
import { SEDES, generarRed, type OpcionesRed } from './seed';
import { simularDia } from './simulador';

export type Periodo = 'dia' | 'mes' | 'anio';
export type Fase = 0 | 1 | 2 | 3;
export const DIAS_POR_MES = 22;
export const MESES = 12;

export interface IndicadoresSede {
  sedeId: string;
  ofrecidos: number;
  atendidos: number;
  ausentesSinAviso: number;
  liberadosConAviso: number;
  esperaMedia: number;
  p90: number;
  minutosLibreConSala: number;
  /** De esos, con alguien de la misma especialidad esperando: lo que la reasignación recupera. */
  minutosLibreRecuperables: number;
  /** Proporción de atendidos dentro de los 15 minutos de su turno. */
  dentroDe15: number;
  /** Pacientes atendidos en un consultorio distinto del agendado. */
  reasignados: number;
  /** Turnos que eran primera consulta. */
  primerasConsultas: number;
  /** Duración real de la consulta sobre el turno agendado (1 = coinciden). */
  brechaDuracion: number;
  /** Minutos de turno ofrecidos sobre minutos de consultorio disponibles (>1 = sobreagenda). */
  sobreagenda: number;
}

export interface Jornada {
  /** Índice 0..263. */
  dia: number;
  /** Mes 1..12. */
  mes: number;
  fase: Fase;
  red: IndicadoresSede;
  porSede: IndicadoresSede[];
}

export interface DatosGerencia {
  jornadas: Jornada[];
}

const FASE_POR_MES = (mes: number): Fase => (mes <= 3 ? 0 : mes <= 5 ? 1 : mes <= 8 ? 2 : 3);
/* Las palancas de cada fase son las de los escenarios del análisis: si se
 * retoca un escenario, el año simulado lo sigue sin tocar nada acá. */
const opcionesDe = (id: string): OpcionesRed => {
  const e = ESCENARIOS.find((x) => x.id === id);
  if (!e) throw new Error(`Escenario ${id} no existe`);
  return {
    factorSobreagenda: e.factorSobreagenda,
    reduccionAusencias: e.reduccionAusencias,
    factorPrimeraVez: e.factorPrimeraVez ?? 1,
  };
};
const OPCIONES_FASE: Record<Fase, OpcionesRed> = {
  0: {},
  1: {},
  2: opcionesDe('desagendar'),
  3: opcionesDe('primeravez'),
};

const semillaDia = (i: number) => 20260813 + i * 7919;

function vacio(sedeId: string): IndicadoresSede {
  return {
    sedeId,
    ofrecidos: 0,
    atendidos: 0,
    ausentesSinAviso: 0,
    liberadosConAviso: 0,
    esperaMedia: 0,
    p90: 0,
    minutosLibreConSala: 0,
    minutosLibreRecuperables: 0,
    dentroDe15: 0,
    reasignados: 0,
    primerasConsultas: 0,
    brechaDuracion: 0,
    sobreagenda: 0,
  };
}

/** Suma indicadores; las esperas se promedian ponderadas por atendidos. */
export function agregar(xs: readonly IndicadoresSede[], sedeId = 'red'): IndicadoresSede {
  const r = vacio(sedeId);
  let pesoEspera = 0;
  for (const x of xs) {
    r.ofrecidos += x.ofrecidos;
    r.atendidos += x.atendidos;
    r.ausentesSinAviso += x.ausentesSinAviso;
    r.liberadosConAviso += x.liberadosConAviso;
    r.minutosLibreConSala += x.minutosLibreConSala;
    r.minutosLibreRecuperables += x.minutosLibreRecuperables;
    r.reasignados += x.reasignados;
    r.primerasConsultas += x.primerasConsultas;
    r.esperaMedia += x.esperaMedia * x.atendidos;
    r.p90 += x.p90 * x.atendidos;
    r.dentroDe15 += x.dentroDe15 * x.atendidos;
    r.brechaDuracion += x.brechaDuracion * x.atendidos;
    r.sobreagenda += x.sobreagenda * x.ofrecidos;
    pesoEspera += x.atendidos;
  }
  if (pesoEspera) {
    r.esperaMedia /= pesoEspera;
    r.p90 /= pesoEspera;
    r.dentroDe15 /= pesoEspera;
    r.brechaDuracion /= pesoEspera;
  }
  if (r.ofrecidos) r.sobreagenda /= r.ofrecidos;
  return r;
}

export function simularAnio(): DatosGerencia {
  const jornadas: Jornada[] = [];
  for (let dia = 0; dia < MESES * DIAS_POR_MES; dia++) {
    const mes = Math.floor(dia / DIAS_POR_MES) + 1;
    const fase = FASE_POR_MES(mes);
    const red = generarRed(semillaDia(dia), OPCIONES_FASE[fase]);
    const porSede: IndicadoresSede[] = red.sedes.map((sede) => {
      const planes = red.planes.filter((p) => p.sedeId === sede.id);
      const cons = red.consultorios.filter((c) => c.sedeId === sede.id);
      const r = simularDia(planes, cons, { reasignar: fase >= 1 });
      const atendidosPlan = planes.filter((p) => p.inicioA !== undefined && p.finA !== undefined);
      /* Minutos de turno ofrecidos sobre minutos de consultorio disponibles.
       * El almuerzo se aproxima con su media (37,5 min por consultorio). */
      const disponibles = cons.length * (JORNADA.cierre - JORNADA.apertura - 37.5);
      const vendidos = planes.reduce((s, p) => s + p.duracionAgendada, 0);
      const brecha = atendidosPlan.length
        ? atendidosPlan.reduce((s, p) => s + (p.finA! - p.inicioA!) / p.duracionAgendada, 0) /
          atendidosPlan.length
        : 1;
      return {
        sedeId: sede.id,
        ofrecidos: planes.length,
        atendidos: r.atendidos,
        ausentesSinAviso: planes.filter((p) => p.desenlace === 'ausente').length,
        liberadosConAviso: planes.filter((p) => p.desenlace === 'cancelado').length,
        esperaMedia: r.esperaPercibida,
        p90: r.esperaP90,
        minutosLibreConSala: r.minutosLibreConSala,
        minutosLibreRecuperables: r.minutosLibreRecuperables,
        dentroDe15: r.dentroDe15,
        reasignados: r.reasignados,
        primerasConsultas: planes.filter((p) => p.paciente.primeraVez).length,
        brechaDuracion: brecha,
        sobreagenda: disponibles ? vendidos / disponibles : 0,
      };
    });
    jornadas.push({ dia, mes, fase, red: agregar(porSede), porSede });
  }
  return { jornadas };
}

/* ── Consultas sobre los datos precalculados ─────────────────────────────── */

/** `dia` es el día operativo dentro del mes, 1..DIAS_POR_MES. */
export function jornadasDe(
  d: DatosGerencia,
  periodo: Periodo,
  mes = MESES,
  dia = DIAS_POR_MES,
): Jornada[] {
  if (periodo === 'anio') return d.jornadas;
  const delMes = d.jornadas.filter((j) => j.mes === mes);
  if (periodo === 'mes') return delMes;
  return delMes.slice(dia - 1, dia);
}

export function porSedeDe(js: readonly Jornada[]): IndicadoresSede[] {
  return SEDES.map((s) => agregar(js.map((j) => j.porSede.find((x) => x.sedeId === s.id)!), s.id));
}

export function porMes(d: DatosGerencia): IndicadoresSede[] {
  return Array.from({ length: MESES }, (_, i) =>
    agregar(d.jornadas.filter((j) => j.mes === i + 1).map((j) => j.red), `m${i + 1}`),
  );
}

/* ── Formato compacto para el JSON precalculado ──────────────────────────
 * Con claves repetidas por jornada y por sede el archivo pesa 350 KB; como
 * arreglos de números pesa una cuarta parte. */

const COLS = [
  'ofrecidos',
  'atendidos',
  'ausentesSinAviso',
  'liberadosConAviso',
  'esperaMedia',
  'p90',
  'minutosLibreConSala',
  'minutosLibreRecuperables',
  'dentroDe15',
  'reasignados',
  'primerasConsultas',
  'brechaDuracion',
  'sobreagenda',
] as const;

export interface DatosCompactos {
  sedes: string[];
  jornadas: Array<{ d: number; m: number; f: Fase; red: number[]; sedes: number[][] }>;
}

const aFila = (x: IndicadoresSede): number[] =>
  COLS.map((c) => Math.round(x[c] * 1000) / 1000);
const deFila = (sedeId: string, fila: number[]): IndicadoresSede => {
  const x = vacio(sedeId);
  COLS.forEach((c, i) => {
    x[c] = fila[i];
  });
  return x;
};

export function compactar(d: DatosGerencia): DatosCompactos {
  const sedes = SEDES.map((s) => s.id);
  return {
    sedes,
    jornadas: d.jornadas.map((j) => ({
      d: j.dia,
      m: j.mes,
      f: j.fase,
      red: aFila(j.red),
      sedes: sedes.map((id) => aFila(j.porSede.find((x) => x.sedeId === id)!)),
    })),
  };
}

export function expandir(c: DatosCompactos): DatosGerencia {
  return {
    jornadas: c.jornadas.map((j) => ({
      dia: j.d,
      mes: j.m,
      fase: j.f,
      red: deFila('red', j.red),
      porSede: c.sedes.map((id, i) => deFila(id, j.sedes[i])),
    })),
  };
}
