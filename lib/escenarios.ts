/**
 * Definición de escenarios y comparación.
 *
 * Fuente única para el gráfico de la aplicación y para `npm run analisis`.
 * Si el número de la pantalla y el del documento salieran de dos lugares
 * distintos, tarde o temprano dejan de coincidir — y el que lo note va a ser
 * el cliente, en la reunión.
 */

import { JORNADA, type Minutos } from './domain';
import { generarRed } from './seed';
import { simularDia } from './simulador';

export interface Escenario {
  id: string;
  nombre: string;
  /** Etiqueta corta para el gráfico. */
  corto: string;
  factorSobreagenda: number;
  reduccionAusencias: number;
  reasignar: boolean;
  nota: string;
}

export const ESCENARIOS: readonly Escenario[] = [
  {
    id: 'hoy',
    nombre: 'Hoy',
    corto: 'Hoy',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0,
    reasignar: false,
    nota: 'Agenda telefónica y planillas. Sin visibilidad ni reasignación.',
  },
  {
    id: 'pool',
    nombre: 'Fase 1 · Reasignación',
    corto: 'Reasignación',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0,
    reasignar: true,
    nota: 'Los consultorios de una especialidad atienden como un pool único.',
  },
  {
    id: 'recordatorios',
    nombre: 'Fase 2 · Recordatorios',
    corto: 'Recordatorios',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0.35,
    reasignar: true,
    nota:
      'Bajan las ausencias del 33% al 21%. Pero si no se desagenda, esos ' +
      'pacientes recuperados entran en una grilla armada asumiendo que no ' +
      'iban a venir: la espera EMPEORA.',
  },
  {
    id: 'desagendar',
    nombre: 'Fase 3 · Desagendar',
    corto: 'Desagendar',
    factorSobreagenda: 0.1,
    reduccionAusencias: 0.35,
    reasignar: true,
    nota:
      'Con las ausencias bajo control ya no hace falta sobreagendar. Recién ' +
      'acá la espera cae de verdad y la jornada cierra en horario.',
  },
] as const;

export interface ResumenEscenario {
  escenario: Escenario;
  /** Espera percibida media de toda la jornada. */
  espera: number;
  /** Espera percibida media entre las 14 y las 17 — la franja de las quejas. */
  tarde: number;
  p90: number;
  dentroDe15: number;
  tasaAusencia: number;
  atendidos: number;
  /**
   * Espera media por hora. Solo aparecen las horas en que hubo cola:
   * una hora ausente significa "ya no quedaba nadie esperando", que NO es
   * lo mismo que una espera de cero minutos. Por eso se omite en vez de
   * emitir 0 — un cero se promedia, una ausencia no.
   */
  curva: Array<{ hora: Minutos; espera: number }>;
  /** Última hora con pacientes esperando. */
  cierre: Minutos;
}

const promedio = (xs: number[]) =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;

/** Horas cubiertas por el eje del gráfico, iguales para todos los escenarios. */
export function horasDelEje(resumenes: readonly ResumenEscenario[]): Minutos[] {
  const max = Math.max(JORNADA.cierre, ...resumenes.map((r) => r.cierre));
  const horas: Minutos[] = [];
  for (let h = JORNADA.apertura; h <= max; h += 60) horas.push(h);
  return horas;
}

export function evaluarEscenario(escenario: Escenario): ResumenEscenario {
  const red = generarRed(20260813, {
    factorSobreagenda: escenario.factorSobreagenda,
    reduccionAusencias: escenario.reduccionAusencias,
  });

  const porHora = new Map<Minutos, number[]>();
  const esperas: number[] = [];
  const p90s: number[] = [];
  const d15: number[] = [];
  let ausentes = 0;
  let atendidos = 0;

  for (const sede of red.sedes) {
    const planes = red.planes.filter((p) => p.sedeId === sede.id);
    const consultorios = red.consultorios.filter((c) => c.sedeId === sede.id);
    const r = simularDia(planes, consultorios, { reasignar: escenario.reasignar });

    esperas.push(r.esperaPercibida);
    p90s.push(r.esperaP90);
    d15.push(r.dentroDe15);
    ausentes += r.ausentes;
    atendidos += r.atendidos;

    for (const punto of r.curva) {
      const xs = porHora.get(punto.hora) ?? [];
      xs.push(punto.espera);
      porHora.set(punto.hora, xs);
    }
  }

  const horasConCola = [...porHora.keys()].sort((a, b) => a - b);
  const cierre = horasConCola.length ? horasConCola[horasConCola.length - 1] : JORNADA.cierre;

  const tarde: number[] = [];
  for (const [hora, xs] of porHora) {
    if (hora >= 14 * 60 && hora <= 17 * 60) tarde.push(...xs);
  }

  return {
    escenario,
    espera: promedio(esperas),
    tarde: promedio(tarde),
    p90: promedio(p90s),
    dentroDe15: promedio(d15),
    tasaAusencia: ausentes / (ausentes + atendidos),
    atendidos,
    cierre,
    curva: horasConCola.map((hora) => ({
      hora,
      espera: promedio(porHora.get(hora)!),
    })),
  };
}

export function compararEscenarios(): ResumenEscenario[] {
  return ESCENARIOS.map(evaluarEscenario);
}
