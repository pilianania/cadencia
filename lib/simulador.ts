/**
 * SIMULADOR CONTRAFÁCTICO.
 *
 * Responde la pregunta que decide la venta: "¿cuánto baja realmente la espera?"
 *
 * No se puede contestar mirando el tablero, porque el tablero muestra un día
 * que ya pasó. Hay que correr el mismo día con distintas políticas y comparar.
 * Eso es lo que hace esto: reejecuta la jornada minuto a minuto sobre los
 * mismos pacientes, las mismas duraciones reales de consulta y las mismas
 * llegadas, cambiando UNA cosa por vez.
 *
 * HONESTIDAD DEL MODELO (decir esto en la defensa antes de que lo pregunten):
 * Es un simulador de eventos discretos con supuestos explícitos, no una
 * predicción. Su valor no es acertar el número exacto: es aislar el efecto de
 * cada palanca sobre una misma población de pacientes. Los supuestos que
 * mueven el resultado están todos en `Politica` y son auditables uno por uno.
 */

import { JORNADA, type Consultorio, type Minutos } from './domain';
import type { TurnoPlan } from './seed';

export interface Politica {
  /** Motor de reasignación activo: los consultorios de una especialidad
   *  atienden como un pool en vez de como colas independientes. */
  reasignar: boolean;
}

export interface ResultadoDia {
  /** Espera media tal como la percibe el paciente (desde su hora prometida). */
  esperaPercibida: number;
  /** Espera media atribuible a la agenda. */
  esperaAtribuible: number;
  esperaP90: number;
  /** Proporción de pacientes atendidos dentro de los 15' de su turno. */
  dentroDe15: number;
  atendidos: number;
  ausentes: number;
  /** Minutos de consultorio disponibles y sin usar. */
  tiempoMuerto: number;
  /** Minutos de consultorio libre mientras había pacientes esperando en la sede. */
  minutosLibreConSala: number;
  /**
   * De esos, los minutos en que había esperando alguien de LA MISMA
   * especialidad del consultorio libre: es la capacidad que la reasignación
   * puede recuperar. El resto es un cardiólogo libre mientras esperan
   * pacientes de dermatología: no se recupera moviendo gente, se recupera
   * planificando la agenda entre especialidades.
   */
  minutosLibreRecuperables: number;
  /** Pacientes atendidos en un consultorio distinto del agendado (reasignados). */
  reasignados: number;
  /** Espera percibida media de los pacientes iniciados en cada hora. */
  curva: Array<{ hora: Minutos; espera: number }>;
  /** Hora en que la espera media cruza los 15 minutos y ya no vuelve. */
  horaDeQuiebre?: Minutos;
}

interface EnSala {
  plan: TurnoPlan;
  /** Momento desde el cual la clínica es responsable de la espera. */
  desde: Minutos;
  duracion: Minutos;
}

/** Duración real de la consulta, tal como se generó para ese paciente.
 *  Se preserva entre escenarios: mover a un paciente no lo hace más rápido. */
function duracionDe(p: TurnoPlan): Minutos {
  if (p.inicioA !== undefined && p.finA !== undefined) return p.finA - p.inicioA;
  return p.duracionAgendada;
}

export function simularDia(
  planes: readonly TurnoPlan[],
  consultorios: readonly Consultorio[],
  politica: Politica,
): ResultadoDia {
  const especialidadDe = new Map<string, string>();
  for (const c of consultorios) {
    const p = planes.find((x) => x.consultorioId === c.id);
    if (p) especialidadDe.set(c.id, p.especialidad);
  }

  /** Cuándo se libera cada consultorio. */
  const libre = new Map<string, Minutos>();
  for (const c of consultorios) libre.set(c.id, JORNADA.apertura);

  const sala = new Map<string, EnSala[]>(); // consultorioId -> cola
  for (const c of consultorios) sala.set(c.id, []);

  const porLlegar = planes
    .filter((p) => p.desenlace === 'atendido' && p.checkInA !== undefined)
    .sort((a, b) => a.checkInA! - b.checkInA!);
  let siguienteLlegada = 0;

  const esperasPercibidas: number[] = [];
  const esperasAtribuibles: number[] = [];
  const iniciosPorHora = new Map<number, number[]>();
  let atendidos = 0;
  let minutosAtendidos = 0;
  let minutosLibreConSala = 0;
  let minutosLibreRecuperables = 0;
  let reasignados = 0;

  const HORIZONTE = JORNADA.cierre + 180; // la cola no desaparece al cerrar

  for (let t = JORNADA.apertura; t <= HORIZONTE; t++) {
    // 1. Llegadas a sala de espera.
    while (
      siguienteLlegada < porLlegar.length &&
      porLlegar[siguienteLlegada].checkInA! <= t
    ) {
      const p = porLlegar[siguienteLlegada++];
      sala.get(p.consultorioId)?.push({
        plan: p,
        desde: Math.max(p.agendadoA, p.checkInA!),
        duracion: duracionDe(p),
      });
    }

    // 2. Cada consultorio libre toma un paciente.
    const hayGenteEnSala = [...sala.values()].some((cola) => cola.some((e) => e.desde <= t));
    for (const c of consultorios) {
      if ((libre.get(c.id) ?? 0) > t) continue;

      const elegido = politica.reasignar
        ? tomarDelPool(sala, especialidadDe, c.id, t)
        : tomarDeLaPropia(sala, c.id, t);

      if (!elegido) {
        // Consultorio libre y sala con gente: capacidad que se pierde.
        if (hayGenteEnSala && t < JORNADA.cierre) {
          minutosLibreConSala++;
          const esp = especialidadDe.get(c.id);
          const hayDeLaMisma = [...sala.entries()].some(
            ([otroId, cola]) => especialidadDe.get(otroId) === esp && cola.some((e) => e.desde <= t),
          );
          if (hayDeLaMisma) minutosLibreRecuperables++;
        }
        continue;
      }

      const inicio = t;
      esperasPercibidas.push(Math.max(0, inicio - elegido.plan.agendadoA));
      esperasAtribuibles.push(Math.max(0, inicio - elegido.desde));

      const hora = Math.floor(inicio / 60) * 60;
      const xs = iniciosPorHora.get(hora) ?? [];
      xs.push(Math.max(0, inicio - elegido.plan.agendadoA));
      iniciosPorHora.set(hora, xs);

      libre.set(c.id, inicio + elegido.duracion);
      minutosAtendidos += elegido.duracion;
      atendidos++;
      if (elegido.plan.consultorioId !== c.id) reasignados++;
    }
  }

  const prom = (xs: number[]) =>
    xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
  const ordenadas = [...esperasAtribuibles].sort((a, b) => a - b);

  const curva = [...iniciosPorHora.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hora, xs]) => ({ hora, espera: prom(xs) }));

  // Primera hora a partir de la cual la espera media ya no baja de 15'.
  let horaDeQuiebre: Minutos | undefined;
  for (let i = 0; i < curva.length; i++) {
    if (curva.slice(i).every((p) => p.espera >= 15)) {
      horaDeQuiebre = curva[i].hora;
      break;
    }
  }

  const capacidad = consultorios.length * (JORNADA.cierre - JORNADA.apertura);

  return {
    esperaPercibida: prom(esperasPercibidas),
    esperaAtribuible: prom(esperasAtribuibles),
    esperaP90: ordenadas.length
      ? ordenadas[Math.floor(ordenadas.length * 0.9)]
      : 0,
    dentroDe15: esperasPercibidas.length
      ? esperasPercibidas.filter((e) => e <= 15).length / esperasPercibidas.length
      : 0,
    atendidos,
    ausentes: planes.filter((p) => p.desenlace === 'ausente').length,
    tiempoMuerto: Math.max(0, capacidad - minutosAtendidos),
    minutosLibreConSala,
    minutosLibreRecuperables,
    reasignados,
    curva,
    horaDeQuiebre,
  };
}

/** Sin reasignación: cada consultorio solo ve su propia cola. Es el statu quo. */
function tomarDeLaPropia(
  sala: Map<string, EnSala[]>,
  consultorioId: string,
  t: Minutos,
): EnSala | undefined {
  const cola = sala.get(consultorioId);
  if (!cola?.length) return undefined;
  // FIFO por hora de turno: se respeta el orden prometido.
  let mejorIdx = -1;
  for (let i = 0; i < cola.length; i++) {
    if (cola[i].desde > t) continue;
    if (mejorIdx === -1 || cola[i].plan.agendadoA < cola[mejorIdx].plan.agendadoA) {
      mejorIdx = i;
    }
  }
  return mejorIdx === -1 ? undefined : cola.splice(mejorIdx, 1)[0];
}

/**
 * Con reasignación: los consultorios de una misma especialidad funcionan como
 * un solo pool y atienden al que más lleva esperando en toda la sede.
 *
 * ESTE ES TODO EL CAMBIO. No hay un algoritmo sofisticado detrás: la ganancia
 * viene de dejar de tratar cada consultorio como una isla. Es la misma razón
 * por la que un banco tiene una fila única en vez de una por caja.
 */
function tomarDelPool(
  sala: Map<string, EnSala[]>,
  especialidadDe: Map<string, string>,
  consultorioId: string,
  t: Minutos,
): EnSala | undefined {
  const esp = especialidadDe.get(consultorioId);
  let mejor: { cola: EnSala[]; idx: number; desde: Minutos } | undefined;

  for (const [otroId, cola] of sala) {
    if (especialidadDe.get(otroId) !== esp) continue;
    for (let i = 0; i < cola.length; i++) {
      if (cola[i].desde > t) continue;
      if (!mejor || cola[i].desde < mejor.desde) {
        mejor = { cola, idx: i, desde: cola[i].desde };
      }
    }
  }

  return mejor ? mejor.cola.splice(mejor.idx, 1)[0] : undefined;
}
