/**
 * Estimación de atención para el paciente.
 *
 * DECISIÓN DE PRODUCTO — la más importante de la cara al paciente:
 * NUNCA se comunica una hora exacta. Se comunica una VENTANA.
 *
 * Un "te atendemos 14:32" es una promesa que la clínica no controla: depende
 * de cuánto dure la consulta de adelante, que es información médica, no
 * logística. Fallar una hora exacta destruye más confianza que no haberla
 * dado. Una ventana de 20 minutos que se cumple el 90% de las veces vale
 * mucho más que un minuto exacto que falla la mitad.
 *
 * Es también la diferencia entre reducir la espera y reducir el SUFRIMIENTO
 * de la espera. La segunda es más barata y se nota antes: quien sabe que
 * tiene 40 minutos se va a tomar un café; quien no sabe nada mira la puerta.
 */

import {
  agruparPorConsultorio,
  duracionRealMinutos,
  type Minutos,
  type Turno,
} from './domain';

export interface Estimacion {
  /** Pacientes por delante en la cola de su consultorio. */
  porDelante: number;
  /** Extremo optimista de la ventana comunicada. */
  desde: Minutos;
  /** Extremo pesimista de la ventana comunicada. */
  hasta: Minutos;
  /** Corrimiento respecto de la hora prometida. Negativo = se adelanta. */
  desvio: Minutos;
  /**
   * Cuán confiable es la ventana. Cae cuando hay muchos por delante:
   * la incertidumbre se acumula consulta a consulta.
   */
  confianza: 'alta' | 'media' | 'baja';
}

/** Duración típica observada hoy en ese consultorio. */
function duracionTipica(turnos: readonly Turno[], porDefecto: Minutos): Minutos {
  const reales = turnos
    .map(duracionRealMinutos)
    .filter((d): d is number => d !== undefined)
    .sort((a, b) => a - b);
  if (reales.length < 3) return porDefecto;
  return reales[Math.floor(reales.length / 2)];
}

export function estimar(
  turno: Turno,
  turnosDeLaSede: readonly Turno[],
  ahora: Minutos,
): Estimacion | null {
  // Solo tiene sentido para quien espera o todavía no llegó.
  if (turno.estado !== 'en_espera' && turno.estado !== 'agendado') return null;

  const delConsultorio = agruparPorConsultorio(turnosDeLaSede).get(turno.consultorioId) ?? [];
  const dur = duracionTipica(delConsultorio, turno.duracionAgendada);

  const enCurso = delConsultorio.find((t) => t.estado === 'en_consulta');
  // Cuándo se libera el consultorio: si hay alguien adentro, se proyecta con
  // la duración típica; nunca antes de ahora.
  const libre = enCurso
    ? Math.max(ahora, (enCurso.inicioA ?? ahora) + dur)
    : ahora;

  const desdeQue = Math.max(turno.agendadoA, turno.checkInA ?? turno.agendadoA);

  // Por delante: los que esperan con prioridad sobre él (llegaron antes).
  const porDelante = delConsultorio.filter(
    (t) =>
      t.id !== turno.id &&
      t.estado === 'en_espera' &&
      Math.max(t.agendadoA, t.checkInA ?? t.agendadoA) <= desdeQue,
  ).length;

  const central = Math.max(libre + porDelante * dur, desdeQue);

  /* La ventana se ensancha con la cantidad de consultas por delante: cada una
   * agrega su propia varianza. Con nadie adelante la ventana es angosta;
   * con cinco, prometer ±5 minutos sería mentir con precisión. */
  const holgura = Math.round(Math.min(30, 6 + porDelante * 4));

  return {
    porDelante,
    desde: Math.max(ahora, central - Math.round(holgura / 2)),
    hasta: central + holgura,
    desvio: central - turno.agendadoA,
    confianza: porDelante <= 1 ? 'alta' : porDelante <= 3 ? 'media' : 'baja',
  };
}

/**
 * Códigos de turno para pantallas públicas.
 *
 * COMPLIANCE (Ley 25.326, arts. 2 y 7): los datos de salud son sensibles.
 * En una pantalla de sala de espera, mostrar "María Gómez — Endocrinología"
 * revela la condición de salud de una persona identificada a toda la sala.
 * El nombre no aporta nada operativo que el código no resuelva.
 *
 * UNICIDAD POR CONSTRUCCIÓN, no por probabilidad.
 * La versión anterior derivaba el código de un hash del identificador. Con
 * ~160 turnos por sede eso colisionaba casi con certeza, y dos pacientes
 * llamados con el mismo código es una falla operativa real, no un detalle
 * estadístico. Acá el código se asigna por posición: letra por consultorio,
 * número por orden de turno dentro de ese consultorio. Es único, es estable
 * durante el día, es legible a cinco metros y además le dice al paciente
 * cuántos tiene por delante sin revelarle nada a nadie más.
 */
export function asignarCodigos(turnos: readonly Turno[]): Map<string, string> {
  const codigos = new Map<string, string>();
  const consultorios = [...new Set(turnos.map((t) => t.consultorioId))].sort();

  consultorios.forEach((consultorioId, indice) => {
    const letra = String.fromCharCode(65 + (indice % 26));
    turnos
      .filter((t) => t.consultorioId === consultorioId)
      .sort((a, b) => a.agendadoA - b.agendadoA || a.id.localeCompare(b.id))
      .forEach((t, i) => {
        codigos.set(t.id, `${letra}-${String(i + 1).padStart(3, '0')}`);
      });
  });

  return codigos;
}
