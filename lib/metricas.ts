/**
 * Motor de métricas.
 *
 * Todo se deriva de los turnos. Nada se almacena precalculado: el dashboard,
 * las alertas y el reporte a dirección leen de la misma función, así que es
 * imposible que discrepen entre sí.
 */

import {
  agruparPorConsultorio,
  esperaMinutos,
  esperaPercibidaMinutos,
  derivaMinutos,
  duracionRealMinutos,
  severidadDeEspera,
  type Minutos,
  type Severidad,
  type Turno,
} from './domain';

export interface MetricasSede {
  /** Espera promedio atribuible a la clínica, sobre turnos ya iniciados hoy. */
  esperaPromedio: number;
  /** Espera tal como la percibe el paciente (desde su hora prometida). */
  esperaPercibida: number;
  /** Percentil 90: el número que define la percepción del paciente. */
  esperaP90: number;
  /** Pacientes actualmente en sala de espera. */
  enEspera: number;
  /** Espera del que más lleva esperando ahora mismo. */
  peorEsperaActual: number;
  enConsulta: number;
  finalizados: number;
  ausentes: number;
  cancelados: number;
  /** Ausencias sin aviso sobre turnos cuya hora ya pasó. */
  tasaAusencia: number;
  /** Minutos de consultorio disponibles pero sin usar (tiempo muerto médico). */
  tiempoMuerto: number;
  /** Ocupación efectiva del recurso médico. */
  ocupacion: number;
  totalDelDia: number;
}

export function calcularMetricas(turnos: readonly Turno[], ahora: Minutos): MetricasSede {
  const esperas: number[] = [];
  const percibidas: number[] = [];
  let enEspera = 0;
  let peorEsperaActual = 0;
  let enConsulta = 0;
  let finalizados = 0;
  let ausentes = 0;
  let cancelados = 0;
  let vencidos = 0;
  let minutosAtendidos = 0;

  for (const t of turnos) {
    const espera = esperaMinutos(t, ahora);
    const percibida = esperaPercibidaMinutos(t, ahora);
    if (percibida !== undefined) percibidas.push(percibida);

    switch (t.estado) {
      case 'en_espera':
        enEspera++;
        if (espera !== undefined) {
          peorEsperaActual = Math.max(peorEsperaActual, espera);
          esperas.push(espera);
        }
        break;
      case 'en_consulta':
        enConsulta++;
        if (espera !== undefined) esperas.push(espera);
        if (t.inicioA !== undefined) minutosAtendidos += ahora - t.inicioA;
        break;
      case 'finalizado':
        finalizados++;
        if (espera !== undefined) esperas.push(espera);
        minutosAtendidos += duracionRealMinutos(t) ?? 0;
        break;
      case 'ausente':
        ausentes++;
        break;
      case 'cancelado':
        cancelados++;
        break;
    }

    if (t.agendadoA <= ahora && t.estado !== 'cancelado') vencidos++;
  }

  esperas.sort((a, b) => a - b);
  const promedio = esperas.length
    ? esperas.reduce((s, x) => s + x, 0) / esperas.length
    : 0;
  const p90 = esperas.length
    ? esperas[Math.min(esperas.length - 1, Math.floor(esperas.length * 0.9))]
    : 0;

  // Capacidad instalada transcurrida = consultorios × minutos de jornada corridos.
  const consultorios = new Set(turnos.map((t) => t.consultorioId)).size;
  const primerSlot = turnos.length
    ? Math.min(...turnos.map((t) => t.agendadoA))
    : ahora;
  const capacidad = Math.max(1, consultorios * Math.max(0, ahora - primerSlot));

  return {
    esperaPromedio: promedio,
    esperaPercibida: percibidas.length
      ? percibidas.reduce((s, x) => s + x, 0) / percibidas.length
      : 0,
    esperaP90: p90,
    enEspera,
    peorEsperaActual,
    enConsulta,
    finalizados,
    ausentes,
    cancelados,
    tasaAusencia: vencidos ? ausentes / vencidos : 0,
    tiempoMuerto: Math.max(0, capacidad - minutosAtendidos),
    ocupacion: Math.min(1, minutosAtendidos / capacidad),
    totalDelDia: turnos.length,
  };
}

export interface EstadoConsultorio {
  consultorioId: string;
  /** Turno actualmente en consulta, si lo hay. */
  enCurso?: Turno;
  /** Pacientes esperando asignados a este consultorio. */
  cola: Turno[];
  /** Deriva del último turno iniciado: cuánto corre atrasado el consultorio. */
  deriva: number;
  /** Está libre y hay gente esperando en la sede: tiempo muerto evitable. */
  ocioso: boolean;
  severidad: Severidad;
}

export function estadoPorConsultorio(
  turnos: readonly Turno[],
  ahora: Minutos,
): EstadoConsultorio[] {
  return [...agruparPorConsultorio(turnos).entries()]
    .map(([consultorioId, xs]) => {
      const enCurso = xs.find((t) => t.estado === 'en_consulta');
      const cola = xs
        .filter((t) => t.estado === 'en_espera')
        .sort((a, b) => a.agendadoA - b.agendadoA);

      // La deriva del consultorio la marca el turno más reciente que arrancó.
      const iniciados = xs
        .filter((t) => t.inicioA !== undefined)
        .sort((a, b) => (b.inicioA ?? 0) - (a.inicioA ?? 0));
      const deriva = iniciados.length ? derivaMinutos(iniciados[0], ahora) : 0;

      const peorEspera = cola.reduce(
        (max, t) => Math.max(max, esperaMinutos(t, ahora) ?? 0),
        0,
      );

      return {
        consultorioId,
        enCurso,
        cola,
        deriva,
        ocioso: !enCurso && cola.length > 0,
        severidad: severidadDeEspera(Math.max(peorEspera, deriva)),
      };
    })
    .sort((a, b) => a.consultorioId.localeCompare(b.consultorioId));
}
