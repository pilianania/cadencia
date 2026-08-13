/**
 * Motor de alertas.
 *
 * DECISIÓN DE PRODUCTO (defendible):
 * Toda alerta lleva una ACCIÓN concreta y ejecutable. Un tablero que solo
 * informa "hay demora" traslada el problema al humano; el brief ya describe
 * un equipo que sabe que hay demora y no puede hacer nada con esa información.
 * El valor está en decir QUÉ HACER AHORA, con nombre y apellido.
 *
 * Segunda decisión: las alertas se ordenan por costo evitable, no por
 * antigüedad. Un consultorio ocioso con cola cuesta más que un paciente
 * puntual esperando 16 minutos, aunque el segundo "se vea" más rojo.
 */

import {
  enRiesgoDeAusencia,
  esperaMinutos,
  formatoHora,
  type Minutos,
  type Severidad,
  type Turno,
} from './domain';
import type { EstadoConsultorio } from './metricas';

export type TipoAlerta =
  | 'consultorio_ocioso'
  | 'espera_excedida'
  | 'deriva_consultorio'
  | 'riesgo_ausencia';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  severidad: Severidad;
  titulo: string;
  detalle: string;
  /** Qué debería hacer recepción, ahora. */
  accion: string;
  consultorioId?: string;
  turnoId?: string;
  /** Minutos de espera que esta acción evita. Ordena la lista. */
  minutosEvitables: number;
}

export interface UmbralesAlerta {
  /** Espera del paciente a partir de la cual se avisa. */
  esperaAviso: Minutos;
  /** Deriva del consultorio a partir de la cual se avisa. */
  derivaAviso: Minutos;
  /** Minutos después de la hora sin check-in para marcar riesgo de ausencia. */
  riesgoAusencia: Minutos;
}

/**
 * Valores por defecto derivados del brief, no elegidos al azar:
 * · esperaAviso 15′ — es el objetivo declarado de experiencia del paciente.
 * · derivaAviso 20′ — punto donde la cascada deja de ser recuperable dentro
 *   del mismo turno y empieza a comerse los siguientes.
 * · riesgoAusencia 10′ — ventana en la que todavía sirve llamar por teléfono.
 * Son configurables por sede: el brief describe 8 sedes con realidades distintas.
 */
export const UMBRALES_POR_DEFECTO: UmbralesAlerta = {
  esperaAviso: 15,
  derivaAviso: 20,
  riesgoAusencia: 10,
};

const nombreConsultorio = (id: string) => `Consultorio ${id.split('-c')[1] ?? id}`;

export function generarAlertas(
  turnos: readonly Turno[],
  consultorios: readonly EstadoConsultorio[],
  ahora: Minutos,
  umbrales: UmbralesAlerta = UMBRALES_POR_DEFECTO,
): Alerta[] {
  const alertas: Alerta[] = [];

  /* 1. Consultorio ocioso con cola.
   * Es la alerta de mayor valor económico y la que ataca directamente el
   * "personal médico con tiempos muertos" del brief. */
  for (const c of consultorios) {
    if (!c.ocioso) continue;
    const peor = c.cola.reduce(
      (max, t) => Math.max(max, esperaMinutos(t, ahora) ?? 0),
      0,
    );
    alertas.push({
      id: `ocioso-${c.consultorioId}`,
      tipo: 'consultorio_ocioso',
      severidad: peor >= 25 ? 'critica' : 'moderada',
      titulo: `${nombreConsultorio(c.consultorioId)} libre con ${c.cola.length} en espera`,
      detalle: `El profesional está disponible y hay pacientes en sala. El primero espera hace ${Math.round(peor)} minutos.`,
      accion: `Llamar a ${c.cola[0]?.paciente.nombre ?? 'el siguiente paciente'}`,
      consultorioId: c.consultorioId,
      turnoId: c.cola[0]?.id,
      minutosEvitables: peor * c.cola.length,
    });
  }

  /* 2. Consultorio corriendo atrasado: la demora se va a propagar. */
  for (const c of consultorios) {
    if (c.deriva < umbrales.derivaAviso) continue;
    const porDelante = c.cola.length;
    alertas.push({
      id: `deriva-${c.consultorioId}`,
      tipo: 'deriva_consultorio',
      severidad: c.deriva >= 45 ? 'critica' : c.deriva >= 30 ? 'moderada' : 'leve',
      titulo: `${nombreConsultorio(c.consultorioId)} corre ${Math.round(c.deriva)}′ atrasado`,
      detalle: `La demora se arrastra al resto de la agenda: ${porDelante} turno${porDelante === 1 ? '' : 's'} por delante la van a heredar.`,
      accion:
        porDelante > 2
          ? 'Reasignar los próximos 2 turnos a un consultorio de la misma especialidad'
          : 'Avisar a los pacientes de la nueva hora estimada',
      consultorioId: c.consultorioId,
      minutosEvitables: c.deriva * Math.max(1, porDelante),
    });
  }

  /* 3. Paciente individual excedido. */
  for (const t of turnos) {
    if (t.estado !== 'en_espera') continue;
    const espera = esperaMinutos(t, ahora) ?? 0;
    if (espera < umbrales.esperaAviso) continue;
    alertas.push({
      id: `espera-${t.id}`,
      tipo: 'espera_excedida',
      severidad: espera >= 45 ? 'critica' : espera >= 25 ? 'moderada' : 'leve',
      titulo: `${t.paciente.nombre} espera hace ${Math.round(espera)}′`,
      detalle: `Turno de ${formatoHora(t.agendadoA)} en ${nombreConsultorio(t.consultorioId)}${t.paciente.primeraVez ? ' · primera consulta' : ''}.`,
      accion: espera >= 45 ? 'Priorizar en la cola y ofrecer disculpas' : 'Informar demora estimada',
      consultorioId: t.consultorioId,
      turnoId: t.id,
      minutosEvitables: espera,
    });
  }

  /* 4. Riesgo de ausencia: todavía hay ventana para recuperar el turno.
   * Cada llamado exitoso convierte una ausencia en una consulta facturada. */
  for (const t of turnos) {
    if (!enRiesgoDeAusencia(t, ahora, umbrales.riesgoAusencia)) continue;
    alertas.push({
      id: `ausencia-${t.id}`,
      tipo: 'riesgo_ausencia',
      severidad: 'leve',
      titulo: `${t.paciente.nombre} no llegó`,
      detalle: `Turno de ${formatoHora(t.agendadoA)}, ${Math.round(ahora - t.agendadoA)}′ de atraso sin check-in.`,
      accion: 'Llamar al paciente o liberar el slot para la lista de espera',
      consultorioId: t.consultorioId,
      turnoId: t.id,
      // El valor de recuperar el slot, no la espera de alguien.
      minutosEvitables: t.duracionAgendada,
    });
  }

  return alertas.sort((a, b) => b.minutosEvitables - a.minutosEvitables);
}
