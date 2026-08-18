/**
 * Indicadores de gerencia.
 *
 * Los mismos cuatro números del caso de negocio, calculados en vivo sobre la
 * jornada. Son el puente entre el tablero operativo y la decisión de compra:
 * lo que la Dirección ve acá es lo que después se factura o se pierde.
 *
 * Los valores monetarios son los del caso de negocio (dólares BNA 1.515,
 * agosto 2026) y viven en un solo lugar para que pantalla y documento no
 * puedan discrepar.
 */

import { agruparPorConsultorio, type Minutos, type Turno } from './domain';

export const VALORES = {
  /** Facturación bruta por consulta. Proxy de aranceles éticos 2026: ARS 50.000. */
  facturacionPorConsultaUsd: 33,
  /** Hora médica. Intermedio entre colegios 2026: ARS 80.475 a 138.000. */
  horaMedicaUsd: 66,
} as const;

export interface IndicadoresGerencia {
  /** Turnos ya vencidos cuyo paciente no vino ni avisó. */
  perdidosSinAviso: number;
  /** Turnos liberados con aviso: reasignables a la lista de espera. */
  liberadosConAviso: number;
  /** Minutos de consultorio libre mientras había pacientes esperando en la sede. */
  minutosLibreConSala: number;
  /** De esos, con alguien de la MISMA especialidad esperando: lo que la reasignación recupera. */
  minutosLibreRecuperables: number;
  /** Turnos atendidos o en curso sobre turnos vencidos. */
  usoEfectivo: number;
  /** Turnos vencidos hasta ahora (denominador del uso). */
  vencidos: number;
}

/**
 * Recorre la jornada hasta `ahora` en pasos de 5 minutos y cuenta consultorio
 * libre con sala ocupada. Se hace por sede: un consultorio de Belgrano no
 * puede atender a alguien que espera en Flores.
 */
function minutosLibreConSala(
  turnos: readonly Turno[],
  ahora: Minutos,
): { total: number; recuperables: number } {
  const porConsultorio = agruparPorConsultorio(turnos);
  if (porConsultorio.size === 0) return { total: 0, recuperables: 0 };

  const primero = Math.min(...turnos.map((t) => t.agendadoA));
  let total = 0;
  let recuperables = 0;
  /* Estuvo esperando en t si ya había llegado y todavía no lo habían llamado
   * ni se había ido (salioA: se lo marcó ausente después de llegar). Se mira
   * por marcas de tiempo y no por el estado actual, para que marcar ausente
   * a alguien no borre retroactivamente lo que esperó. */
  const espera = (x: Turno, t: Minutos) =>
    x.checkInA !== undefined &&
    x.checkInA <= t &&
    (x.inicioA === undefined || t < x.inicioA) &&
    (x.salioA === undefined || t < x.salioA) &&
    x.estado !== 'cancelado';

  for (let t = primero; t < ahora; t += 5) {
    const esperando = turnos.filter((x) => espera(x, t));
    if (esperando.length === 0) continue;

    for (const xs of porConsultorio.values()) {
      const ocupado = xs.some(
        (x) => x.inicioA !== undefined && x.inicioA <= t && (x.finA === undefined || t < x.finA),
      );
      if (ocupado) continue;
      total += 5;
      const esp = xs[0]?.especialidad;
      if (esperando.some((x) => x.especialidad === esp)) recuperables += 5;
    }
  }
  return { total, recuperables };
}

export function indicadoresGerencia(
  turnosPorSede: ReadonlyMap<string, readonly Turno[]>,
  ahora: Minutos,
): IndicadoresGerencia {
  let perdidos = 0;
  let liberados = 0;
  let libre = 0;
  let recuperables = 0;
  let atendidos = 0;
  let vencidos = 0;

  for (const turnos of turnosPorSede.values()) {
    for (const t of turnos) {
      if (t.estado === 'ausente') perdidos++;
      if (t.estado === 'cancelado') liberados++;
      if (t.estado === 'finalizado' || t.estado === 'en_consulta') atendidos++;
      if (t.agendadoA <= ahora && t.estado !== 'cancelado') vencidos++;
    }
    const l = minutosLibreConSala(turnos, ahora);
    libre += l.total;
    recuperables += l.recuperables;
  }

  return {
    perdidosSinAviso: perdidos,
    liberadosConAviso: liberados,
    minutosLibreConSala: libre,
    minutosLibreRecuperables: recuperables,
    usoEfectivo: vencidos ? atendidos / vencidos : 0,
    vencidos,
  };
}
