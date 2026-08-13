/**
 * Generación de eventos de calendario (iCalendar, RFC 5545).
 *
 * POR QUÉ EL CALENDARIO Y NO SOLO EL RECORDATORIO:
 * El olvido explica cerca del 44% de las ausencias. Un recordatorio ataca esa
 * causa 24 horas antes; un evento de calendario la ataca EN EL MOMENTO DE
 * RESERVAR, que es cuando el paciente todavía tiene la intención fresca.
 *
 * Y no depende de que el paciente lea un mensaje de un número desconocido: la
 * alarma la dispara su propio teléfono, con su propia configuración. Para el
 * segmento que tiene smartphone pero ignora los WhatsApp comerciales —que es
 * grande— es el único canal que efectivamente llega.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * DECISIÓN DE PRIVACIDAD — la más importante de este archivo:
 *
 * El evento NO dice la especialidad ni el nombre del profesional.
 *
 * Un calendario personal se comparte: con la pareja, con el equipo de trabajo,
 * con quien tenga acceso al dispositivo. Un evento que diga "Oncología — Dr.
 * Pérez" convierte el calendario del paciente en una filtración de su condición
 * de salud, hacia gente que él nunca eligió informar.
 *
 * Es exactamente el mismo razonamiento que sostiene que la pantalla de sala no
 * muestre nombres (Ley 25.326, arts. 2 y 7: los datos de salud son sensibles),
 * aplicado a otra superficie. El detalle clínico vive detrás del enlace, que
 * requiere autenticación.
 * ──────────────────────────────────────────────────────────────────────────── */

import { JORNADA, type Minutos, type Turno } from './domain';

/** Escape de caracteres reservados en valores de texto iCalendar. */
function escapar(texto: string): string {
  return texto
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Marca temporal en HORA FLOTANTE de iCalendar (sin sufijo Z, sin TZID).
 *
 * DECISIÓN, y no es un atajo:
 * Convertir a UTC obliga a fijar un huso horario, y la jurisdicción de esta red
 * es un supuesto abierto —el brief no dice en qué país opera—. Peor: derivar el
 * huso del reloj del dispositivo hace que el mismo turno figure a distinta hora
 * según dónde se generó el archivo. Un turno a las 09:31 pasaba a 12:31Z.
 *
 * La hora flotante significa "esta hora, en el lugar donde estés". Para un turno
 * presencial en una clínica es la semántica correcta: el paciente y la clínica
 * están en el mismo huso por definición, porque tiene que ir hasta ahí.
 *
 * Si el cliente opera en varios husos, se reemplaza por TZID por sede.
 */
function marca(fecha: Date, minutos: Minutos): string {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutos);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `T${p(d.getHours())}${p(d.getMinutes())}00`
  );
}

export interface OpcionesEvento {
  turno: Turno;
  sedeNombre: string;
  /** Día de la consulta. */
  fecha: Date;
  /** Enlace autenticado donde vive el detalle clínico. */
  enlace?: string;
  /** Momento de generación, para DTSTAMP. */
  generadoEn: Date;
}

/**
 * Construye el .ics de un turno.
 *
 * Lleva DOS alarmas, no una:
 *  · 24 h antes — la ventana en la que todavía se puede avisar y liberar el
 *    turno para la lista de espera. Es la alarma que le sirve a la clínica.
 *  · 2 h antes — la que le sirve al paciente: cubre el tiempo de traslado, que
 *    es una causa de ausencia distinta del olvido.
 */
export function generarEvento({
  turno,
  sedeNombre,
  fecha,
  enlace,
  generadoEn,
}: OpcionesEvento): string {
  const inicio = marca(fecha, turno.agendadoA);
  const fin = marca(fecha, turno.agendadoA + turno.duracionAgendada);

  const descripcion = [
    'Turno médico.',
    enlace ? `Consultá el estado en tiempo real y avisá si no podés ir: ${enlace}` : '',
    'Si no vas a poder asistir, avisanos: liberamos el turno para otra persona.',
  ]
    .filter(Boolean)
    .join('\n');

  // Sin especialidad ni profesional: ver la nota de privacidad arriba.
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadencia//Turnos ambulatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${turno.id}@cadencia`,
    `DTSTAMP:${generadoEn.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${inicio}`,
    `DTEND:${fin}`,
    `SUMMARY:${escapar(`Turno médico · ${sedeNombre}`)}`,
    `LOCATION:${escapar(sedeNombre)}`,
    `DESCRIPTION:${escapar(descripcion)}`,
    enlace ? `URL:${escapar(enlace)}` : '',
    'STATUS:CONFIRMED',
    // Alarma para la clínica: última ventana útil para reasignar el turno.
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapar(`Mañana tenés turno en ${sedeNombre}. Si no podés ir, avisá.`)}`,
    'END:VALARM',
    // Alarma para el paciente: cubre el traslado.
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapar(`Tu turno en ${sedeNombre} es en 2 horas.`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  // RFC 5545 exige CRLF como terminador de línea.
  return lineas.join('\r\n');
}

/** URL de descarga del .ics, para un enlace de un solo clic en el teléfono. */
export function enlaceDescarga(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/**
 * Nombre de archivo sugerido. Tampoco lleva especialidad: el nombre del archivo
 * queda visible en la carpeta de descargas y en la notificación del sistema.
 */
export function nombreArchivo(turno: Turno): string {
  const hh = String(Math.floor(turno.agendadoA / 60)).padStart(2, '0');
  const mm = String(turno.agendadoA % 60).padStart(2, '0');
  return `turno-${hh}${mm}.ics`;
}

/** Día de referencia de la jornada simulada. En producción viene del turno. */
export const FECHA_DEMO = new Date(2026, 7, 17, 0, 0, 0);

export function esHorarioValido(m: Minutos): boolean {
  return m >= JORNADA.apertura && m <= JORNADA.cierre;
}
