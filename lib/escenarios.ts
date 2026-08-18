/**
 * Definición de escenarios y comparación.
 *
 * Fuente de las cifras del caso de negocio (`npm run analisis`) y de las
 * palancas que el año simulado de gerencia (`lib/periodos.ts`) despliega por
 * fases. No es una pantalla del producto: es el sustento de la propuesta,
 * reproducible delante del cliente si alguien discute un supuesto.
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
  factorPrimeraVez?: number;
  /** Duración real de la consulta relativa a hoy (asistente clínico). */
  factorDuracionReal?: number;
  /** Proporción de primeras consultas (sensibilidad del supuesto). */
  proporcionPrimeraVez?: number;
  /** Turno nominal relativo a hoy (alargar todos los turnos). */
  factorSlot?: number;
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
    nombre: 'Fase 2 mal hecha · Recordatorios sin ajustar la agenda',
    corto: 'Recordatorios',
    factorSobreagenda: 0.35,
    reduccionAusencias: 0.35,
    reasignar: true,
    nota:
      'Bajan las ausencias del 32% al 21%. Pero si no se ajusta la agenda, ' +
      'esos pacientes recuperados entran en una agenda armada asumiendo que ' +
      'no iban a venir: la espera EMPEORA y queda peor que hoy.',
  },
  {
    id: 'desagendar',
    nombre: 'Fase 2 · Confirmación y agenda ajustada',
    corto: 'Agenda ajustada',
    factorSobreagenda: 0.1,
    reduccionAusencias: 0.35,
    reasignar: true,
    nota:
      'Con las ausencias bajo control se ajusta la agenda al ausentismo ' +
      'medido, conservando el volumen (queda un 10% de sobreagenda). La ' +
      'espera se mantiene en la de la fase 1 (la diferencia está dentro del ' +
      'error) y las ausencias bajan un tercio con las mismas consultas. ' +
      'Bajar de acá cuesta turnos: sin ninguna sobreagenda, 31 minutos y 3% ' +
      'menos de consultas.',
  },
  {
    id: 'primeravez',
    nombre: 'Opcional · Primera consulta más larga',
    corto: 'Primera vez ×1,5',
    factorSobreagenda: 0.1,
    reduccionAusencias: 0.35,
    reasignar: true,
    factorPrimeraVez: 1.5,
    nota:
      'La primera consulta se agenda con media vez más de tiempo que un ' +
      'control. Ataca la causa de las consultas más largas donde está: en la ' +
      'anamnesis. Cuesta ~6% de consultas, contra ~11% de alargar todos.',
  },
] as const;

/**
 * Semillas de réplica.
 *
 * POR QUÉ NO ALCANZA UNA SOLA CORRIDA:
 * Cada escenario que cambia el sobreagendamiento o la tasa de ausencia
 * REGENERA la jornada: distinta agenda, distintos pacientes, distintas
 * duraciones. Comparar dos escenarios así no compara políticas, compara
 * también dos poblaciones.
 *
 * Con una sola corrida el ruido de generación es del orden del efecto que se
 * quiere medir, y produce resultados imposibles —sobreagendar menos dando peor
 * espera— que delatan que la comparación no era válida.
 *
 * Se promedian réplicas y se reporta la dispersión, para poder distinguir un
 * efecto real de una diferencia que cabe dentro del error del modelo.
 *
 * SON 64 Y NO 8: con 8 réplicas el error estándar de la espera media es de
 * unos 2 minutos, del orden de la diferencia entre fases. La primera versión
 * usaba 8 semillas fijas que resultaron una tirada favorable (daban 45 → 31
 * cuando 64 réplicas con tres juegos de semillas distintos dan 45 → 36). La
 * simulación tarda menos de un segundo por escenario: no hay razón para
 * ahorrar réplicas.
 */
const SEMILLAS: readonly number[] = Array.from({ length: 64 }, (_, i) => 1000 + i * 7919);

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
  /** Desvío estándar entre réplicas. Sin esto no se puede afirmar que una
   *  diferencia entre escenarios sea real y no ruido de generación. */
  desvio: { espera: number; atendidos: number };
  /** Cantidad de réplicas promediadas. */
  replicas: number;
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

function evaluarUnaReplica(escenario: Escenario, semilla: number): ResumenEscenario {
  const red = generarRed(semilla, {
    factorSobreagenda: escenario.factorSobreagenda,
    reduccionAusencias: escenario.reduccionAusencias,
    factorPrimeraVez: escenario.factorPrimeraVez ?? 1,
    factorDuracionReal: escenario.factorDuracionReal ?? 1,
    factorSlot: escenario.factorSlot ?? 1,
    ...(escenario.proporcionPrimeraVez !== undefined
      ? { proporcionPrimeraVez: escenario.proporcionPrimeraVez }
      : {}),
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
    desvio: { espera: 0, atendidos: 0 },
    replicas: 1,
    curva: horasConCola.map((hora) => ({
      hora,
      espera: promedio(porHora.get(hora)!),
    })),
  };
}

const desvioDe = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const mu = promedio(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - mu) ** 2, 0) / xs.length);
};

/** Promedia las réplicas de un escenario y conserva la dispersión. */
export function evaluarEscenario(
  escenario: Escenario,
  semillas: readonly number[] = SEMILLAS,
): ResumenEscenario {
  const replicas = semillas.map((s) => evaluarUnaReplica(escenario, s));

  // La curva se promedia hora a hora sobre las réplicas que llegaron a esa hora.
  const porHora = new Map<Minutos, number[]>();
  for (const r of replicas) {
    for (const punto of r.curva) {
      const xs = porHora.get(punto.hora) ?? [];
      xs.push(punto.espera);
      porHora.set(punto.hora, xs);
    }
  }

  const campo = (f: (r: ResumenEscenario) => number) => promedio(replicas.map(f));

  return {
    escenario,
    espera: campo((r) => r.espera),
    tarde: campo((r) => r.tarde),
    p90: campo((r) => r.p90),
    dentroDe15: campo((r) => r.dentroDe15),
    tasaAusencia: campo((r) => r.tasaAusencia),
    atendidos: Math.round(campo((r) => r.atendidos)),
    cierre: Math.round(campo((r) => r.cierre)),
    replicas: replicas.length,
    desvio: {
      espera: desvioDe(replicas.map((r) => r.espera)),
      atendidos: desvioDe(replicas.map((r) => r.atendidos)),
    },
    curva: [...porHora.entries()]
      .sort(([a], [b]) => a - b)
      // Una hora que solo aparece en pocas réplicas no es representativa.
      .filter(([, xs]) => xs.length >= replicas.length / 2)
      .map(([hora, xs]) => ({ hora, espera: promedio(xs) })),
  };
}

export function compararEscenarios(): ResumenEscenario[] {
  return ESCENARIOS.map((e) => evaluarEscenario(e));
}
