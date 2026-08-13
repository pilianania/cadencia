/**
 * MOTOR DE REASIGNACIÓN — el núcleo del producto.
 *
 * El tablero muestra que la agenda se desordena. Esto la reordena.
 *
 * ELECCIÓN DE ALGORITMO (la pregunta que va a hacer el CEO):
 * Esto es un balanceador greedy, no un solver de programación entera.
 * La decisión es deliberada:
 *
 *  · Corre en milisegundos en el navegador, sin backend de optimización.
 *  · Es AUDITABLE: recepción puede leer por qué se movió cada paciente.
 *    Un solver que devuelve una asignación óptima sin explicación no se
 *    usa en un mostrador — se desconfía de él y se vuelve a la planilla.
 *  · Captura la mayor parte de la ganancia. El cuello de botella real no
 *    es la optimalidad matemática: es que hoy nadie reasigna nada.
 *
 * El modelo de datos queda listo para un solver si algún día hace falta.
 * Cambiar el motor no toca el resto del sistema.
 *
 * RESTRICCIONES DURAS (no negociables, son clínicas):
 *  · Solo se mueve dentro de la misma especialidad.
 *  · No se adelanta a nadie que ya está en consulta.
 *  · Un paciente que ya esperó más se mueve antes (FIFO por espera).
 *  · No se mueve a alguien que empeoraría su propia hora.
 */

import {
  agruparPorConsultorio,
  esperaMinutos,
  type Consultorio,
  type Minutos,
  type Turno,
} from './domain';

/** Ganancia mínima para justificar mover a un paciente de sala. */
const GANANCIA_MINIMA: Minutos = 8;

export interface Reasignacion {
  turnoId: string;
  paciente: string;
  desdeConsultorio: string;
  haciaConsultorio: string;
  /** Cuándo lo atenderían si no se hace nada. */
  inicioSinAccion: Minutos;
  /** Cuándo lo atenderían con el movimiento. */
  inicioConPlan: Minutos;
  minutosAhorrados: Minutos;
}

export interface PlanReasignacion {
  reasignaciones: Reasignacion[];
  /** Suma de minutos de espera evitados a pacientes concretos. */
  minutosRecuperados: number;
  pacientesBeneficiados: number;
}

interface Carga {
  consultorioId: string;
  especialidad: string;
  /** Momento en que el consultorio queda libre para el siguiente. */
  libreA: Minutos;
  cola: Turno[];
}

/** Un paciente ya comprometido en la cola proyectada de un consultorio. */
interface EnCola {
  turnoId: string;
  /** Momento desde el cual está disponible para pasar. */
  desde: Minutos;
  duracion: Minutos;
}

/**
 * Momento en que arrancaría un paciente que entra a esta cola.
 *
 * CORRECCIÓN CENTRAL: un consultorio no está "libre" cuando termina el
 * paciente que tiene adentro — está libre cuando termina su propia cola.
 * Calcularlo con `libreA` a secas promete horarios que solo se cumplen
 * pasando por encima de gente que ya estaba esperando ahí, y el ahorro
 * declarado queda inflado a costa de pacientes invisibles.
 *
 * Se respeta prioridad por antigüedad: los que llevan esperando más que el
 * entrante pasan antes que él. `cola` viene ordenada por `desde`.
 */
function inicioEnCola(
  cola: readonly EnCola[],
  libreA: Minutos,
  desdeEntrante: Minutos,
  ahora: Minutos,
): Minutos {
  let t = Math.max(libreA, ahora);
  for (const q of cola) {
    if (q.desde > desdeEntrante) break; // el entrante tiene prioridad sobre este
    t = Math.max(t, q.desde) + q.duracion;
  }
  return Math.max(t, desdeEntrante);
}

function insertarEnCola(cola: EnCola[], entrante: EnCola): void {
  const i = cola.findIndex((q) => q.desde > entrante.desde);
  if (i === -1) cola.push(entrante);
  else cola.splice(i, 0, entrante);
}

/**
 * Duración esperada del próximo turno de un consultorio.
 * Se usa la mediana observada del día en ese consultorio y no la nominal:
 * si un profesional viene corriendo 1.4× sobre lo agendado, proyectar con
 * la nominal subestima la cola y el plan propone movimientos que no cierran.
 */
function duracionEsperada(turnos: readonly Turno[], porDefecto: Minutos): Minutos {
  const reales = turnos
    .filter((t) => t.inicioA !== undefined && t.finA !== undefined)
    .map((t) => t.finA! - t.inicioA!)
    .sort((a, b) => a - b);
  if (reales.length < 3) return porDefecto;
  return reales[Math.floor(reales.length / 2)];
}

function construirCargas(
  turnos: readonly Turno[],
  consultorios: readonly Consultorio[],
  ahora: Minutos,
): Carga[] {
  const porConsultorio = agruparPorConsultorio(turnos);

  return consultorios.map((c) => {
    const xs = porConsultorio.get(c.id) ?? [];
    const enCurso = xs.find((t) => t.estado === 'en_consulta');

    // Si hay alguien adentro, el consultorio se libera cuando termine.
    // Se proyecta con la duración observada, no con la agendada.
    const dur = duracionEsperada(xs, xs[0]?.duracionAgendada ?? 15);
    const libreA = enCurso
      ? Math.max(ahora, (enCurso.inicioA ?? ahora) + dur)
      : ahora;

    return {
      consultorioId: c.id,
      especialidad: xs[0]?.especialidad ?? '',
      libreA,
      cola: xs
        .filter((t) => t.estado === 'en_espera')
        .sort((a, b) => a.agendadoA - b.agendadoA),
    };
  });
}

export function planificar(
  turnos: readonly Turno[],
  consultorios: readonly Consultorio[],
  ahora: Minutos,
): PlanReasignacion {
  const cargas = construirCargas(turnos, consultorios, ahora);
  const porConsultorio = agruparPorConsultorio(turnos);

  const duraciones = new Map<string, Minutos>();
  const libre = new Map<string, Minutos>();
  const colas = new Map<string, EnCola[]>();

  for (const c of cargas) {
    const xs = porConsultorio.get(c.consultorioId) ?? [];
    const dur = duracionEsperada(xs, xs[0]?.duracionAgendada ?? 15);
    duraciones.set(c.consultorioId, dur);
    libre.set(c.consultorioId, c.libreA);
    colas.set(
      c.consultorioId,
      c.cola
        .map((t) => ({
          turnoId: t.id,
          desde: Math.max(t.agendadoA, t.checkInA ?? t.agendadoA),
          duracion: dur,
        }))
        .sort((a, b) => a.desde - b.desde),
    );
  }

  const desdeDe = (t: Turno) => Math.max(t.agendadoA, t.checkInA ?? t.agendadoA);

  /* Candidatos: todos los que esperan, del que más esperó al que menos.
   * Atender primero al que más sufrió no es solo justicia percibida — es lo
   * que evita que alguien quede olvidado mientras el promedio "mejora". */
  const candidatos = cargas
    .flatMap((c) => c.cola.map((t) => ({ turno: t, origen: c.consultorioId })))
    .sort(
      (a, b) => (esperaMinutos(b.turno, ahora) ?? 0) - (esperaMinutos(a.turno, ahora) ?? 0),
    );

  const reasignaciones: Reasignacion[] = [];
  /* Consultorios de los que ya sacamos a alguien. No se puede mandar un
   * paciente hacia uno de ellos.
   *
   * Sin esta regla el greedy produce intercambios cruzados —mover a A de C3
   * a C6 y a B de C6 a C3— que en minutos cierran, pero que en el mostrador
   * destruyen la confianza en el sistema: recepción lee dos órdenes que se
   * contradicen y vuelve a la planilla. La legibilidad del plan es una
   * restricción del producto, no una preferencia estética. */
  const consultoriosDrenados = new Set<string>();

  for (const { turno, origen } of candidatos) {
    const desde = desdeDe(turno);
    const colaOrigen = colas.get(origen)!;

    // Sin acción: arranca cuando le toque en la cola de su propio consultorio.
    const inicioSinAccion = inicioEnCola(
      colaOrigen.filter((q) => q.turnoId !== turno.id),
      libre.get(origen)!,
      desde,
      ahora,
    );

    let mejorDestino: string | undefined;
    let mejorInicio = inicioSinAccion;

    for (const c of cargas) {
      if (c.consultorioId === origen) continue;
      if (c.especialidad !== turno.especialidad) continue;
      if (consultoriosDrenados.has(c.consultorioId)) continue;

      // Cuándo arrancaría RESPETANDO la cola que ya tiene ese consultorio.
      const inicio = inicioEnCola(
        colas.get(c.consultorioId)!,
        libre.get(c.consultorioId)!,
        desde,
        ahora,
      );
      if (inicio < mejorInicio - GANANCIA_MINIMA) {
        mejorInicio = inicio;
        mejorDestino = c.consultorioId;
      }
    }

    if (!mejorDestino) continue;

    // El paciente deja su cola de origen y entra en la del destino, para que
    // los candidatos siguientes vean el estado ya actualizado.
    const iOrigen = colaOrigen.findIndex((q) => q.turnoId === turno.id);
    if (iOrigen !== -1) colaOrigen.splice(iOrigen, 1);
    insertarEnCola(colas.get(mejorDestino)!, {
      turnoId: turno.id,
      desde,
      duracion: duraciones.get(mejorDestino)!,
    });
    consultoriosDrenados.add(origen);

    reasignaciones.push({
      turnoId: turno.id,
      paciente: turno.paciente.nombre,
      desdeConsultorio: origen,
      haciaConsultorio: mejorDestino,
      inicioSinAccion,
      inicioConPlan: mejorInicio,
      minutosAhorrados: inicioSinAccion - mejorInicio,
    });
  }

  return {
    reasignaciones,
    minutosRecuperados: reasignaciones.reduce((s, r) => s + r.minutosAhorrados, 0),
    pacientesBeneficiados: reasignaciones.length,
  };
}
