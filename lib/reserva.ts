/**
 * Reserva de turno desde el teléfono del paciente.
 *
 * Es el lugar donde el turno diferenciado por tipo se vuelve operativo: al
 * reservar se pregunta si es la primera consulta con esa especialidad, y la
 * respuesta define cuánto dura el turno que se bloquea en la agenda. Sin esa
 * pregunta, la palanca de "primera vez ×1,5" no tiene por dónde entrar al
 * sistema: nadie más que el paciente sabe si ya se atendió antes.
 *
 * Las opciones de horario son de demostración: el prototipo no tiene agenda
 * futura, así que se generan de forma determinista para la especialidad.
 */

import { JORNADA, type Minutos } from './domain';
import { ESCENARIOS } from './escenarios';
import { slotNominal } from './seed';

/**
 * Cuánto más largo es el turno de una primera consulta. Es el valor del
 * escenario "primera vez ×1,5" del análisis; en operación sale de la duración
 * real medida en la fase 0, por especialidad.
 */
export const FACTOR_PRIMERA_VEZ =
  ESCENARIOS.find((e) => e.id === 'primeravez')?.factorPrimeraVez ?? 1.5;

export function duracionTurno(especialidad: string, primeraVez: boolean): Minutos {
  const base = slotNominal(especialidad);
  return primeraVez ? Math.round(base * FACTOR_PRIMERA_VEZ) : base;
}

export interface OpcionTurno {
  id: string;
  fecha: Date;
  hora: Minutos;
  consultorio: string;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatoFecha(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/**
 * Próximos huecos para la especialidad a partir de `desde` (exclusive).
 * Determinista: misma especialidad y misma fecha, mismas opciones.
 */
export function opcionesDeTurno(
  especialidad: string,
  primeraVez: boolean,
  desde: Date,
  cantidad = 6,
): OpcionTurno[] {
  const paso = duracionTurno(especialidad, primeraVez);
  const semilla = [...especialidad].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
  const opciones: OpcionTurno[] = [];
  let dia = 1;
  while (opciones.length < cantidad && dia < 30) {
    const fecha = new Date(desde);
    fecha.setDate(desde.getDate() + dia);
    dia++;
    if (fecha.getDay() === 0 || fecha.getDay() === 6) continue;
    // Dos huecos por día, en momentos distintos de la jornada.
    const porDia = 2;
    for (let k = 0; k < porDia && opciones.length < cantidad; k++) {
      const offset = (semilla * (dia + 3) + k * 137) % 20; // 0..19 pasos
      const hora = JORNADA.apertura + 30 + offset * paso;
      if (hora + paso > JORNADA.cierre) continue;
      opciones.push({
        id: `${especialidad}-${fecha.toISOString().slice(0, 10)}-${hora}`,
        fecha,
        hora,
        consultorio: `Consultorio ${1 + ((semilla + k + dia) % 6)}`,
      });
    }
  }
  return opciones.sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.hora - b.hora);
}
