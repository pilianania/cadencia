'use client';

/**
 * PANEL DE RECEPCIÓN: la agenda del día como la trabaja el mostrador.
 *
 * El carril de deriva es el argumento visual de la propuesta; esto es la
 * herramienta de trabajo. Recepción opera con una lista de nombres y horas,
 * y las cuatro cosas que hace todo el día son: registrar que alguien llegó,
 * pasarlo al consultorio cuando el profesional pide el siguiente, anotar
 * que avisó que no viene, y marcar que no vino. Cada fila ofrece SOLO las
 * acciones que la máquina de estados permite desde su estado actual: no hay
 * forma de "hacer llegar" a alguien que ya está en consulta.
 *
 * "Terminó" no está: el cierre de la consulta lo marca el profesional (en el
 * prototipo, el simulador). Inventar ese flujo excedería lo que el brief
 * describe de recepción.
 */

import { useMemo, useState } from 'react';
import {
  TRANSICIONES,
  esperaMinutos,
  formatoHora,
  severidadDeEspera,
  type Consultorio,
  type EstadoTurno,
  type Minutos,
  type Profesional,
  type Severidad,
  type Turno,
} from '@/lib/domain';

export type AccionRecepcion = 'llego' | 'pasar' | 'aviso' | 'no_vino';

const HACIA: Record<AccionRecepcion, EstadoTurno> = {
  llego: 'en_espera',
  pasar: 'en_consulta',
  aviso: 'cancelado',
  no_vino: 'ausente',
};

/* "Ausente" desde la sala no es "no vino": es que se lo llamó y no respondió
 * (se fue sin avisar). La máquina de estados es la misma; el rótulo, no. */
const rotuloAccion = (a: AccionRecepcion, estado: EstadoTurno): string => {
  switch (a) {
    case 'llego':
      return 'Llegó';
    case 'pasar':
      return 'Pasar a consulta';
    case 'aviso':
      return 'Avisó que no viene';
    case 'no_vino':
      return estado === 'en_espera' ? 'No respondió al llamado' : 'No vino';
  }
};

const ROTULO_ESTADO: Record<EstadoTurno, string> = {
  agendado: 'Sin llegar',
  en_espera: 'En sala',
  en_consulta: 'En consulta',
  finalizado: 'Atendido',
  ausente: 'No vino',
  cancelado: 'Avisó',
};

const CLASE_ESTADO: Record<EstadoTurno, string> = {
  agendado: 'text-ink-faint',
  en_espera: 'text-accent',
  en_consulta: 'text-sev-normal',
  finalizado: 'text-ink-faint',
  ausente: 'text-sev-void',
  cancelado: 'text-sev-void',
};

const TEXTO_SEV: Record<Severidad, string> = {
  normal: 'text-ink',
  leve: 'text-sev-leve',
  moderada: 'text-sev-moderada',
  critica: 'text-sev-critica',
};

type Filtro = 'ahora' | 'sala' | 'todos';

interface Props {
  turnos: readonly Turno[];
  consultorios: readonly Consultorio[];
  profesionales: readonly Profesional[];
  ahora: Minutos;
  onAccion: (turnoId: string, accion: AccionRecepcion) => void;
}

/** Acciones que recepción puede tomar desde el estado actual del turno. */
function accionesDe(t: Turno): AccionRecepcion[] {
  return (Object.keys(HACIA) as AccionRecepcion[]).filter((a) =>
    TRANSICIONES[t.estado].includes(HACIA[a]),
  );
}

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function PanelRecepcion({ turnos, consultorios, profesionales, ahora, onAccion }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('ahora');

  const consultorioDe = useMemo(() => new Map(consultorios.map((c) => [c.id, c])), [consultorios]);
  const profesionalDe = useMemo(() => new Map(profesionales.map((p) => [p.id, p])), [profesionales]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return turnos.filter((t) => {
      if (q) {
        return normalizar(t.paciente.nombre).includes(q) || t.paciente.documento.includes(q);
      }
      if (filtro === 'sala') return t.estado === 'en_espera';
      if (filtro === 'todos') return true;
      /* "Ahora": lo que está vivo en el mostrador. Los turnos de la próxima
       * hora, los que están en sala o en consulta, y los vencidos sin
       * resolver. Lo cerrado (atendidos, ausentes, avisos) sale de la vista. */
      if (t.estado === 'en_espera' || t.estado === 'en_consulta') return true;
      if (t.estado === 'agendado') return t.agendadoA <= ahora + 60;
      return false;
    });
  }, [turnos, busqueda, filtro, ahora]);

  /* Consultorios con alguien adentro: a esos no se les puede "pasar" otro
   * paciente hasta que salga el que está. */
  const ocupados = useMemo(
    () => new Set(turnos.filter((t) => t.estado === 'en_consulta').map((t) => t.consultorioId)),
    [turnos],
  );

  const enSala = turnos.filter((t) => t.estado === 'en_espera').length;
  const sinResolver = turnos.filter((t) => t.estado === 'agendado' && t.agendadoA < ahora).length;

  return (
    <section className="flex flex-col rounded-sm border border-rule bg-surface">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className="eyebrow">Recepción</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            {enSala} en sala
            {sinResolver > 0 && (
              <span className="ml-2 text-[0.8125rem] font-semibold text-sev-moderada">
                · {sinResolver} con la hora pasada y sin llegar
              </span>
            )}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o documento"
            aria-label="Buscar paciente por nombre o documento"
            className="w-56 rounded-xs border border-rule bg-surface px-2 py-1.5 text-[0.8125rem] text-ink placeholder:text-ink-faint"
          />
          <nav className="flex rounded-xs border border-rule" aria-label="Filtro de la agenda">
            {(
              [
                ['ahora', 'Ahora'],
                ['sala', 'En sala'],
                ['todos', 'Todo el día'],
              ] as const
            ).map(([f, rotulo]) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                aria-current={filtro === f && !busqueda ? 'page' : undefined}
                className={`px-3 py-1.5 text-[0.8125rem] font-semibold transition ${
                  filtro === f && !busqueda ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {visibles.length === 0 ? (
        <p className="px-4 py-8 text-[0.875rem] text-ink-soft">
          {busqueda ? 'Ningún paciente coincide con la búsqueda.' : 'Nada pendiente en este momento.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {['Hora', 'Paciente', 'Consultorio', 'Estado', 'Espera', ''].map((h, i) => (
                  <th key={i} className="eyebrow px-3 py-2 text-[0.625rem] font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((t) => (
                <Fila
                  key={t.id}
                  t={t}
                  consultorio={consultorioDe.get(t.consultorioId)}
                  profesional={profesionalDe.get(t.profesionalId)}
                  ocupado={ocupados.has(t.consultorioId)}
                  ahora={ahora}
                  onAccion={onAccion}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Fila({
  t,
  consultorio,
  profesional,
  ocupado,
  ahora,
  onAccion,
}: {
  t: Turno;
  consultorio?: Consultorio;
  profesional?: Profesional;
  ocupado: boolean;
  ahora: Minutos;
  onAccion: Props['onAccion'];
}) {
  const espera = esperaMinutos(t, ahora);
  const vencido = t.estado === 'agendado' && t.agendadoA < ahora;
  const acciones = accionesDe(t);
  const cerrado = acciones.length === 0;

  return (
    <tr className={`border-b border-rule/60 last:border-b-0 ${cerrado ? 'opacity-60' : ''}`}>
      <td className={`tabular px-3 py-2 text-[0.875rem] ${vencido ? 'font-semibold text-sev-moderada' : 'text-ink'}`}>
        {formatoHora(t.agendadoA)}
      </td>
      <td className="px-3 py-2">
        <span className="block text-[0.875rem] font-semibold text-ink">{t.paciente.nombre}</span>
        <span className="block text-[0.6875rem] text-ink-faint">
          {t.paciente.documento}
          {t.paciente.primeraVez && ' · primera consulta'}
          {t.esSobreturno && ' · sobreturno'}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="block text-[0.875rem] text-ink">{consultorio?.nombre ?? t.consultorioId}</span>
        <span className="block text-[0.6875rem] text-ink-faint">
          {profesional?.nombre ?? ''}
          {t.reasignadoDesde && ' · movido de sala'}
        </span>
      </td>
      <td className={`px-3 py-2 text-[0.8125rem] font-semibold ${CLASE_ESTADO[t.estado]}`}>
        {ROTULO_ESTADO[t.estado]}
        {t.estado === 'en_espera' && t.checkInA !== undefined && (
          <span className="block text-[0.6875rem] font-normal text-ink-faint">
            llegó {formatoHora(t.checkInA)}
          </span>
        )}
      </td>
      <td
        className={`tabular px-3 py-2 text-[0.875rem] ${
          espera !== undefined ? TEXTO_SEV[severidadDeEspera(espera)] : 'text-ink-faint'
        }`}
      >
        {espera !== undefined ? `${Math.round(espera)}′` : '·'}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap justify-end gap-1.5">
          {acciones.map((a) => {
            const bloqueado = a === 'pasar' && ocupado;
            return (
              <button
                key={a}
                type="button"
                disabled={bloqueado}
                title={bloqueado ? 'El consultorio está ocupado' : undefined}
                onClick={() => onAccion(t.id, a)}
                className={
                  a === 'llego' || a === 'pasar'
                    ? 'rounded-xs bg-accent px-2.5 py-1 text-[0.75rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'
                    : 'rounded-xs border border-rule bg-surface px-2.5 py-1 text-[0.75rem] font-semibold text-ink-soft transition hover:bg-ground hover:text-ink'
                }
              >
                {rotuloAccion(a, t.estado)}
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
