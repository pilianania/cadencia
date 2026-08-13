/**
 * Generador de la jornada simulada.
 *
 * DECISIÓN DE DISEÑO (defendible):
 * El generador NO produce un día ideal. Está calibrado para reproducir los
 * números que la Directora de Operaciones reportó en la reunión:
 *   · ~45 min de espera promedio
 *   · ~30% de ausencias sin aviso
 *   · consultorios ociosos con pacientes esperando
 *
 * El prototipo abre mostrándole al cliente SU situación actual. La propuesta
 * de valor se demuestra sobre ese baseline, no sobre un escenario de laboratorio.
 *
 * ARQUITECTURA DEL RELOJ:
 * Se genera la "verdad completa" del día por adelantado (`TurnoPlan`) y el
 * estado observable se PROYECTA a la hora actual (`proyectar`). Esto permite
 * mover el reloj hacia adelante y hacia atrás durante la demo sin perder
 * coherencia, y mantiene el render puro y determinista.
 */

import {
  JORNADA,
  type Consultorio,
  type EstadoTurno,
  type Minutos,
  type Paciente,
  type Profesional,
  type Sede,
  type Turno,
} from './domain';

/* ── PRNG determinista (mulberry32) ──────────────────────────────────────────
 * Sin Math.random: el servidor y el cliente deben derivar exactamente la misma
 * jornada, o Next.js falla la hidratación. */
function crearRng(semilla: number) {
  let a = semilla >>> 0;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const elegir = <T,>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const entre = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/* ── Catálogos ───────────────────────────────────────────────────────────── */

export const SEDES: readonly Sede[] = [
  { id: 'bel', nombre: 'Belgrano', localidad: 'CABA' },
  { id: 'cab', nombre: 'Caballito', localidad: 'CABA' },
  { id: 'flo', nombre: 'Flores', localidad: 'CABA' },
  { id: 'sis', nombre: 'San Isidro', localidad: 'Zona Norte' },
  { id: 'vlo', nombre: 'Vicente López', localidad: 'Zona Norte' },
  { id: 'lom', nombre: 'Lomas de Zamora', localidad: 'Zona Sur' },
  { id: 'mor', nombre: 'Morón', localidad: 'Zona Oeste' },
  { id: 'lpl', nombre: 'La Plata', localidad: 'La Plata' },
];

interface EspecialidadCfg {
  nombre: string;
  /** Duración nominal del slot. */
  slot: Minutos;
  /** Cuánto tiende a excederse en la práctica (multiplicador medio). */
  sobrecarga: number;
  /** Propensión a la ausencia sin aviso. */
  tasaAusencia: number;
}

const ESPECIALIDADES: readonly EspecialidadCfg[] = [
  { nombre: 'Clínica Médica', slot: 15, sobrecarga: 1.25, tasaAusencia: 0.3 },
  { nombre: 'Cardiología', slot: 30, sobrecarga: 1.15, tasaAusencia: 0.22 },
  { nombre: 'Dermatología', slot: 15, sobrecarga: 1.1, tasaAusencia: 0.34 },
  { nombre: 'Traumatología', slot: 20, sobrecarga: 1.3, tasaAusencia: 0.28 },
  { nombre: 'Ginecología', slot: 25, sobrecarga: 1.2, tasaAusencia: 0.24 },
  { nombre: 'Pediatría', slot: 20, sobrecarga: 1.15, tasaAusencia: 0.38 },
  { nombre: 'Oftalmología', slot: 20, sobrecarga: 1.2, tasaAusencia: 0.3 },
  { nombre: 'Endocrinología', slot: 25, sobrecarga: 1.1, tasaAusencia: 0.26 },
];

const NOMBRES = [
  'Lucía', 'Martín', 'Sofía', 'Mateo', 'Valentina', 'Joaquín', 'Camila', 'Tomás',
  'Julieta', 'Nicolás', 'Agustina', 'Franco', 'Micaela', 'Ignacio', 'Rocío',
  'Facundo', 'Delfina', 'Santiago', 'Florencia', 'Gonzalo', 'Malena', 'Emilia',
  'Bruno', 'Renata', 'Lautaro', 'Pilar', 'Ramiro', 'Carla', 'Diego', 'Antonia',
] as const;

const APELLIDOS = [
  'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'Álvarez',
  'Romero', 'Sosa', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Benítez', 'Acosta',
  'Medina', 'Herrera', 'Aguirre', 'Molina', 'Silva', 'Castro', 'Ortiz', 'Núñez',
  'Cabrera', 'Rojas', 'Vega', 'Ferrari', 'Quiroga', 'Ibáñez', 'Peralta',
] as const;

/* ── Verdad completa del día ─────────────────────────────────────────────── */

type Desenlace = 'atendido' | 'ausente' | 'cancelado';

export interface TurnoPlan {
  id: string;
  sedeId: string;
  consultorioId: string;
  profesionalId: string;
  paciente: Paciente;
  especialidad: string;
  agendadoA: Minutos;
  duracionAgendada: Minutos;
  esSobreturno: boolean;

  desenlace: Desenlace;
  checkInA?: Minutos;
  inicioA?: Minutos;
  finA?: Minutos;
  /** Momento en que recepción lo marca ausente (solo si desenlace = ausente). */
  marcadoAusenteA?: Minutos;
  /** Momento del aviso de cancelación (solo si desenlace = cancelado). */
  canceladoA?: Minutos;
}

export interface Red {
  sedes: readonly Sede[];
  profesionales: readonly Profesional[];
  consultorios: readonly Consultorio[];
  planes: readonly TurnoPlan[];
}

function generarPaciente(rng: Rng, i: number): Paciente {
  const nombre = `${elegir(rng, NOMBRES)} ${elegir(rng, APELLIDOS)}`;
  return {
    id: `p-${i}`,
    nombre,
    documento: String(entre(rng, 20_000_000, 46_999_999)),
    telefono: `11${entre(rng, 3000, 6999)}${entre(rng, 1000, 9999)}`,
    primeraVez: rng() < 0.18,
  };
}

/** Duración real de una consulta: nominal, con cola larga hacia arriba. */
function duracionReal(rng: Rng, cfg: EspecialidadCfg): Minutos {
  const base = cfg.slot * cfg.sobrecarga;
  const ruido = 0.75 + rng() * 0.6; // 0.75× – 1.35×
  // 12% de las consultas se desbordan de verdad (estudio extra, paciente complejo).
  const desborde = rng() < 0.12 ? 1.5 + rng() * 0.8 : 1;
  return Math.max(6, Math.round(base * ruido * desborde));
}

export function generarRed(semilla = 20260813): Red {
  const rng = crearRng(semilla);

  const profesionales: Profesional[] = [];
  const consultorios: Consultorio[] = [];
  const planes: TurnoPlan[] = [];
  let pacienteIdx = 0;

  for (const sede of SEDES) {
    const cantConsultorios = entre(rng, 3, 6);

    for (let c = 0; c < cantConsultorios; c++) {
      const cfg = elegir(rng, ESPECIALIDADES);
      const profId = `${sede.id}-prof-${c}`;
      const consId = `${sede.id}-c${c + 1}`;

      profesionales.push({
        id: profId,
        nombre: `Dr${rng() < 0.55 ? 'a' : ''}. ${elegir(rng, APELLIDOS)}`,
        especialidad: cfg.nombre,
      });
      consultorios.push({
        id: consId,
        sedeId: sede.id,
        nombre: `Consultorio ${c + 1}`,
        profesionalId: profId,
      });

      /* ── Agenda del consultorio ──────────────────────────────────────────
       * Los slots se agendan en grilla regular. La cascada de demora emerge
       * sola de la regla `inicio = max(hora agendada, check-in, sala libre)`.
       * No hay que inyectarla: es consecuencia de sobreagendar contra
       * duraciones reales más largas que las nominales. Ese es exactamente
       * el mecanismo que produce los 45 minutos del brief. */

      // El arranque tardío del profesional es una causa real y medible.
      let libreA = JORNADA.apertura + entre(rng, 0, 18);
      const almuerzoDesde = 13 * 60 + entre(rng, -20, 20);
      const almuerzoHasta = almuerzoDesde + entre(rng, 30, 45);

      /* ── SOBREAGENDAMIENTO ─────────────────────────────────────────────────
       * ESTE ES EL MECANISMO CENTRAL DEL CASO.
       *
       * Los dos números que reportó la Directora —45 min de espera y 30% de
       * ausencias— parecen dos problemas separados. No lo son: con 30% de la
       * agenda vacía, la demora se disolvería sola en los huecos. Que convivan
       * solo se explica por sobreagendamiento.
       *
       * La clínica agenda turnos más juntos que la duración prometida, para
       * cubrirse de las ausencias. Los días que los pacientes sí vienen, la
       * sala de espera explota. Es una apuesta estadística contra el propio
       * paciente, y la paga el que llegó puntual.
       *
       * Consecuencia para el producto: bajar las ausencias es lo que HABILITA
       * dejar de sobreagendar, y eso es lo que baja la espera. El orden de las
       * fases del plan de implementación se sigue de acá, no al revés. */
      const paso = Math.max(5, Math.round(cfg.slot * (1 - cfg.tasaAusencia * 0.9)));

      for (let t = JORNADA.apertura; t < JORNADA.cierre; t += paso) {
        if (t >= almuerzoDesde && t < almuerzoHasta) continue;
        if (rng() < 0.04) continue; // slot no vendido

        const paciente = generarPaciente(rng, pacienteIdx++);
        const esSobreturno = rng() < 0.07;

        const plan: TurnoPlan = {
          id: `${consId}-${t}`,
          sedeId: sede.id,
          consultorioId: consId,
          profesionalId: profId,
          paciente,
          especialidad: cfg.nombre,
          agendadoA: t,
          duracionAgendada: cfg.slot,
          esSobreturno,
          desenlace: 'atendido',
        };

        const dado = rng();
        if (dado < cfg.tasaAusencia) {
          // Ausencia sin aviso: nadie se entera hasta que recepción lo marca,
          // y ese hueco es tiempo muerto del profesional.
          plan.desenlace = 'ausente';
          plan.marcadoAusenteA = t + entre(rng, 12, 25);
        } else if (dado < cfg.tasaAusencia + 0.05) {
          plan.desenlace = 'cancelado';
          plan.canceladoA = Math.max(JORNADA.apertura, t - entre(rng, 40, 220));
        } else {
          // Llegada: la mayoría se adelanta, una minoría llega tarde.
          const adelanto = rng() < 0.78 ? entre(rng, 3, 22) : -entre(rng, 2, 18);
          const checkIn = Math.max(JORNADA.apertura, t - adelanto);
          const inicio = Math.max(t, checkIn, libreA);
          const fin = inicio + duracionReal(rng, cfg);

          plan.checkInA = checkIn;
          plan.inicioA = inicio;
          plan.finA = fin;
          libreA = fin;
        }

        planes.push(plan);
      }
    }
  }

  return { sedes: SEDES, profesionales, consultorios, planes };
}

/* ── Proyección al instante actual ───────────────────────────────────────── */

/**
 * Deriva el estado observable de un turno a la hora `ahora`.
 * Solo expone los timestamps que ya ocurrieron: a las 10:00 el sistema no
 * puede "saber" a qué hora va a terminar una consulta que todavía no empezó.
 */
export function proyectar(plan: TurnoPlan, ahora: Minutos): Turno {
  const base = {
    id: plan.id,
    sedeId: plan.sedeId,
    consultorioId: plan.consultorioId,
    profesionalId: plan.profesionalId,
    paciente: plan.paciente,
    especialidad: plan.especialidad,
    agendadoA: plan.agendadoA,
    duracionAgendada: plan.duracionAgendada,
    esSobreturno: plan.esSobreturno,
  };

  let estado: EstadoTurno = 'agendado';
  let checkInA: Minutos | undefined;
  let inicioA: Minutos | undefined;
  let finA: Minutos | undefined;

  if (plan.desenlace === 'cancelado') {
    // Sin marca temporal no se puede afirmar que ya avisó: se asume que no.
    estado = ahora >= (plan.canceladoA ?? Infinity) ? 'cancelado' : 'agendado';
  } else if (plan.desenlace === 'ausente') {
    estado = ahora >= (plan.marcadoAusenteA ?? Infinity) ? 'ausente' : 'agendado';
  } else {
    if (plan.checkInA !== undefined && ahora >= plan.checkInA) {
      checkInA = plan.checkInA;
      estado = 'en_espera';
    }
    if (plan.inicioA !== undefined && ahora >= plan.inicioA) {
      inicioA = plan.inicioA;
      estado = 'en_consulta';
    }
    if (plan.finA !== undefined && ahora >= plan.finA) {
      finA = plan.finA;
      estado = 'finalizado';
    }
  }

  return { ...base, estado, checkInA, inicioA, finA };
}
