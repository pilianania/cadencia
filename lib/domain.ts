/**
 * Modelo de dominio — gestión de turnos ambulatorios.
 *
 * DECISIÓN DE DISEÑO (defendible):
 * El tiempo se representa como "minutos desde medianoche" (number), no como Date.
 * Motivos:
 *  1. La jornada clínica es un rango acotado (08:00–18:00). No necesitamos husos
 *     horarios ni fechas para razonar sobre una agenda diaria.
 *  2. Elimina de raíz los errores de hidratación server/cliente de Next.js:
 *     el servidor y el navegador derivan exactamente los mismos números.
 *  3. Hace que el motor de métricas sea aritmética pura y testeable.
 * En producción esto se persiste como timestamptz y se proyecta a este modelo
 * en el borde de lectura. El modelo de dominio no cambia.
 */

export type Minutos = number;

export const JORNADA = {
  apertura: 8 * 60, // 08:00
  cierre: 18 * 60, // 18:00
} as const;

/**
 * Ciclo de vida del turno.
 *
 * agendado ──check-in──> en_espera ──llamar──> en_consulta ──cerrar──> finalizado
 *    │                       │
 *    ├──no se presentó──> ausente <──no responde al llamado──┘
 *    └──avisa──> cancelado
 *
 * `ausente` vs `cancelado` es una distinción deliberada: el brief reporta
 * "30% de ausencias SIN AVISO PREVIO". Colapsar ambos en un solo estado
 * haría imposible medir la métrica que el cliente quiere bajar.
 */
export type EstadoTurno =
  | 'agendado'
  | 'en_espera'
  | 'en_consulta'
  | 'finalizado'
  | 'ausente'
  | 'cancelado';

export const ESTADOS_TERMINALES: readonly EstadoTurno[] = [
  'finalizado',
  'ausente',
  'cancelado',
];

/** Transiciones permitidas. Toda mutación de estado pasa por acá. */
export const TRANSICIONES: Record<EstadoTurno, readonly EstadoTurno[]> = {
  agendado: ['en_espera', 'ausente', 'cancelado'],
  en_espera: ['en_consulta', 'ausente'],
  en_consulta: ['finalizado'],
  finalizado: [],
  ausente: [],
  cancelado: [],
};

export function puedeTransicionar(desde: EstadoTurno, hacia: EstadoTurno): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export interface Paciente {
  id: string;
  nombre: string;
  /**
   * Dato identificatorio. Nunca debe llegar a una pantalla de sala de espera:
   * en las vistas públicas el paciente se identifica por número de turno.
   * La Ley 25.326 clasifica los datos de salud como sensibles (art. 2 y 7),
   * y la sola exposición del vínculo persona–especialidad ya revela salud.
   */
  documento: string;
  telefono: string;
  primeraVez: boolean;
}

export interface Profesional {
  id: string;
  nombre: string;
  especialidad: string;
}

export interface Consultorio {
  id: string;
  sedeId: string;
  nombre: string;
  profesionalId: string;
}

export interface Sede {
  id: string;
  nombre: string;
  localidad: string;
}

export interface Turno {
  id: string;
  sedeId: string;
  consultorioId: string;
  profesionalId: string;
  paciente: Paciente;
  especialidad: string;

  /** Inicio del slot tal como se le prometió al paciente. */
  agendadoA: Minutos;
  /** Duración nominal del slot según especialidad. */
  duracionAgendada: Minutos;

  estado: EstadoTurno;

  /** Momento del check-in en recepción. Ausente si todavía no llegó. */
  checkInA?: Minutos;
  /** Momento en que el profesional lo llamó y empezó la consulta. */
  inicioA?: Minutos;
  /** Momento en que se cerró la consulta. */
  finA?: Minutos;

  /** Turno insertado fuera de la grilla regular (demanda espontánea). */
  esSobreturno: boolean;

  /**
   * Consultorio del que se movió a este paciente, si fue reasignado.
   *
   * Se modela explícitamente en vez de simplemente pisar `consultorioId`
   * porque un cambio de sala es un hecho que hay que COMUNICAR: el paciente
   * está sentado mirando una puerta y ahora tiene que mirar otra. Sin esta
   * marca el sistema no tiene forma de saber que debe avisarle, y el cambio
   * ocurre en silencio — que es indistinguible de un error para quien lo vive.
   */
  reasignadoDesde?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * MÉTRICAS DERIVADAS
 *
 * Ninguna métrica se almacena. Todas se derivan de los timestamps del turno.
 * Una sola fuente de verdad = imposible que el dashboard y el reporte discrepen.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Momento a partir del cual la clínica es responsable de la espera.
 *
 * DECISIÓN CLAVE — es la que más se discute en la defensa:
 * Si el paciente llega tarde, su propia demora NO se le imputa a la clínica.
 * El reloj de espera arranca en max(hora agendada, hora de check-in).
 *
 * Sin esta corrección, el "45 min de espera promedio" del brief mezcla dos
 * problemas distintos (impuntualidad del paciente vs. desorden de la agenda)
 * y cualquier promesa de mejora sobre ese número es indefendible.
 */
export function inicioResponsabilidad(t: Turno): Minutos | undefined {
  if (t.checkInA === undefined) return undefined;
  return Math.max(t.agendadoA, t.checkInA);
}

/**
 * Minutos que el paciente esperó (o lleva esperando) por causa de la clínica.
 * Devuelve undefined si el turno nunca llegó a la sala de espera.
 */
export function esperaMinutos(t: Turno, ahora: Minutos): Minutos | undefined {
  const desde = inicioResponsabilidad(t);
  if (desde === undefined) return undefined;

  switch (t.estado) {
    case 'en_espera':
      return Math.max(0, ahora - desde);
    case 'en_consulta':
    case 'finalizado':
      return t.inicioA === undefined ? undefined : Math.max(0, t.inicioA - desde);
    default:
      // ausente / cancelado / agendado: no hay espera atribuible.
      return undefined;
  }
}

/**
 * Espera tal como la vive el paciente: desde la hora que le prometieron,
 * sin descontar su propia impuntualidad.
 *
 * Se reporta JUNTO a `esperaMinutos`, no en lugar de. La diferencia entre
 * ambas es una cifra de gestión: dice qué parte del problema se arregla
 * ordenando la agenda y qué parte se arregla trabajando sobre la conducta
 * del paciente (recordatorios, confirmación). Son dos inversiones distintas.
 */
export function esperaPercibidaMinutos(t: Turno, ahora: Minutos): Minutos | undefined {
  switch (t.estado) {
    case 'en_espera':
      return Math.max(0, ahora - t.agendadoA);
    case 'en_consulta':
    case 'finalizado':
      return t.inicioA === undefined ? undefined : Math.max(0, t.inicioA - t.agendadoA);
    default:
      return undefined;
  }
}

/**
 * Deriva: cuánto se corrió el turno respecto de su hora prometida.
 * A diferencia de `esperaMinutos`, acá SÍ contamos el corrimiento total,
 * porque es lo que rompe la planificación del consultorio río abajo.
 */
export function derivaMinutos(t: Turno, ahora: Minutos): Minutos {
  if (t.inicioA !== undefined) return t.inicioA - t.agendadoA;
  if (t.estado === 'en_espera' || t.estado === 'agendado') {
    return Math.max(0, ahora - t.agendadoA);
  }
  return 0;
}

/** Duración real de la consulta, si ya terminó. */
export function duracionRealMinutos(t: Turno): Minutos | undefined {
  if (t.inicioA === undefined || t.finA === undefined) return undefined;
  return t.finA - t.inicioA;
}

/**
 * Un turno se considera en riesgo de ausencia cuando pasó su hora
 * y todavía no hizo check-in. El umbral es configurable por sede porque
 * la tolerancia operativa varía (una sede con estacionamiento propio
 * tolera menos atraso que una en microcentro).
 */
export function enRiesgoDeAusencia(
  t: Turno,
  ahora: Minutos,
  umbral: Minutos,
): boolean {
  return t.estado === 'agendado' && ahora - t.agendadoA >= umbral;
}

export const SEVERIDADES = ['normal', 'leve', 'moderada', 'critica'] as const;
export type Severidad = (typeof SEVERIDADES)[number];

/**
 * Escala de severidad de la espera.
 * Los cortes salen del brief: la media actual es 45 min, así que 45+
 * es "crítica" (peor que el statu quo) y 15 min es el objetivo declarado.
 */
export function severidadDeEspera(minutos: Minutos): Severidad {
  if (minutos >= 45) return 'critica';
  if (minutos >= 25) return 'moderada';
  if (minutos >= 15) return 'leve';
  return 'normal';
}

/**
 * Agrupación canónica por consultorio.
 * Vive acá y no en cada consumidor: el tablero y el motor de métricas tienen
 * que recorrer exactamente los mismos grupos, o terminan mostrando realidades
 * distintas de la misma sede.
 */
export function agruparPorConsultorio(
  turnos: readonly Turno[],
): Map<string, Turno[]> {
  const mapa = new Map<string, Turno[]>();
  for (const t of turnos) {
    const xs = mapa.get(t.consultorioId);
    if (xs) xs.push(t);
    else mapa.set(t.consultorioId, [t]);
  }
  return mapa;
}

export function formatoHora(m: Minutos): string {
  const h = Math.floor(m / 60) % 24;
  const min = Math.round(m % 60);
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function formatoDelta(m: Minutos): string {
  const signo = m > 0 ? '+' : m < 0 ? '−' : '';
  return `${signo}${Math.abs(Math.round(m))}′`;
}
