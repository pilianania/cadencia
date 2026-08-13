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
  JORNADA,
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
 * Una primera versión derivaba el código de un hash del identificador: con
 * ~160 turnos por sede colisionaba casi con certeza, y dos pacientes llamados
 * con el mismo código es una falla operativa, no un detalle estadístico.
 *
 * ESTABILIDAD ANTE LA REASIGNACIÓN — la restricción que define el diseño.
 * Una segunda versión numeraba por consultorio. Era única, pero al mover UN
 * paciente de sala se corría la numeración de las dos salas involucradas y el
 * código le cambiaba a media sede (medido: mover 2 pacientes le cambió el
 * código a 98 de 194). Un paciente al que se le dijo "sos B-007" mira la
 * pantalla y su código ya no existe: destruye justamente la confianza que la
 * pantalla venía a construir.
 *
 * Por eso el código se deriva de la hora agendada, no del consultorio: letra
 * por franja horaria, número por orden dentro de la franja. Es único, estable
 * ante cualquier reasignación, legible a cinco metros, y le dice al paciente
 * de qué hora es su turno.
 *
 * LÍMITE CONOCIDO, dicho con todas las letras:
 * numerar por posición es estable ante reasignaciones pero NO ante inserciones.
 * Un sobreturno cargado a mitad de la mañana con hora anterior correría el
 * número de todos los que vienen después en esa franja. Se mitiga poniendo los
 * sobreturnos al final de su franja, así el paciente con turno programado
 * nunca ve cambiar su código; entre sobreturnos el problema subsiste.
 *
 * En producción esto no se calcula: el código se asigna UNA VEZ al reservar
 * el turno y se persiste con él. Acá se deriva porque el prototipo no tiene
 * dónde guardarlo. La derivación es una limitación del prototipo, no el
 * diseño propuesto — vale decirlo antes de que lo pregunten.
 *
 * Regla general detrás de todo esto: un identificador que se le comunica a
 * una persona no puede depender de nada que el sistema tenga derecho a
 * cambiar después.
 */
export function asignarCodigos(turnos: readonly Turno[]): Map<string, string> {
  const codigos = new Map<string, string>();

  const porFranja = new Map<number, Turno[]>();
  for (const t of turnos) {
    const franja = Math.floor(t.agendadoA / 60);
    const xs = porFranja.get(franja);
    if (xs) xs.push(t);
    else porFranja.set(franja, [t]);
  }

  /* La letra se ancla a la APERTURA DE LA JORNADA, no a la primera franja
   * observada. Anclarla a lo observado hacía que un turno cargado en una hora
   * más temprana que cualquier existente corriera la letra de TODA la sede.
   * Con un ancla constante, las 08h son siempre A y las 09h siempre B, exista
   * o no un turno a esa hora. */
  const ancla = Math.floor(JORNADA.apertura / 60);

  for (const franja of [...porFranja.keys()].sort((a, b) => a - b)) {
    const letra = String.fromCharCode(65 + (((franja - ancla) % 26) + 26) % 26);
    porFranja
      .get(franja)!
      // Los sobreturnos van al final de su franja: se cargan durante el día,
      // y si se intercalaran por hora le correrían el código a pacientes que
      // ya lo tienen anotado.
      .sort(
        (a, b) =>
          Number(a.esSobreturno) - Number(b.esSobreturno) ||
          a.agendadoA - b.agendadoA ||
          a.id.localeCompare(b.id),
      )
      .forEach((t, i) => {
        codigos.set(t.id, `${letra}-${String(i + 1).padStart(3, '0')}`);
      });
  }

  return codigos;
}
