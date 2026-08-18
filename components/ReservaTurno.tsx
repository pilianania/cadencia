'use client';

/**
 * RESERVA DE TURNO desde el teléfono del paciente.
 *
 * Tres pasos: especialidad, ¿es tu primera consulta?, horario. La pregunta
 * del medio es la que importa: es donde el turno diferenciado por tipo entra
 * al sistema. Una primera consulta bloquea un turno más largo, y se le dice
 * al paciente por qué, en su idioma: para que no espere el que sigue.
 */

import { useMemo, useState } from 'react';
import { formatoHora, type Minutos } from '@/lib/domain';
import {
  duracionTurno,
  formatoFecha,
  opcionesDeTurno,
  type OpcionTurno,
} from '@/lib/reserva';

interface Props {
  especialidades: readonly string[];
  sedeNombre: string;
  /** Fecha de hoy en la demo: los turnos se ofrecen a partir de mañana. */
  hoy: Date;
  onVolver: () => void;
}

type Paso = 'especialidad' | 'tipo' | 'horario' | 'listo';

export function ReservaTurno({ especialidades, sedeNombre, hoy, onVolver }: Props) {
  const [paso, setPaso] = useState<Paso>('especialidad');
  const [especialidad, setEspecialidad] = useState<string | null>(null);
  const [primeraVez, setPrimeraVez] = useState<boolean | null>(null);
  const [elegido, setElegido] = useState<OpcionTurno | null>(null);

  const opciones = useMemo(
    () =>
      especialidad && primeraVez !== null
        ? opcionesDeTurno(especialidad, primeraVez, hoy)
        : [],
    [especialidad, primeraVez, hoy],
  );

  const duracion: Minutos | null =
    especialidad && primeraVez !== null ? duracionTurno(especialidad, primeraVez) : null;

  return (
    <div className="mt-3 rounded-sm bg-surface p-3">
      <p className="text-[0.6875rem] text-ink-soft">{sedeNombre}</p>
      <p className="mt-0.5 text-[0.9375rem] font-semibold text-ink">Sacar un turno</p>

      {paso === 'especialidad' && (
        <div className="mt-3">
          <p className="eyebrow text-[0.5625rem]">¿Para qué especialidad?</p>
          <ul className="mt-1.5 space-y-1">
            {especialidades.map((e) => (
              <li key={e}>
                <button
                  type="button"
                  onClick={() => {
                    setEspecialidad(e);
                    setPaso('tipo');
                  }}
                  className="w-full rounded-sm border border-rule bg-ground px-2.5 py-2 text-left text-[0.8125rem] font-semibold text-ink transition hover:border-accent"
                >
                  {e}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {paso === 'tipo' && especialidad && (
        <div className="mt-3">
          <p className="text-[0.6875rem] text-ink-soft">{especialidad}</p>
          <p className="mt-1 text-[0.875rem] font-semibold leading-snug text-ink">
            ¿Es tu primera consulta de {especialidad} en la clínica?
          </p>
          <div className="mt-2 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setPrimeraVez(true);
                setPaso('horario');
              }}
              className="w-full rounded-sm bg-accent px-2.5 py-2 text-left text-[0.8125rem] font-semibold text-white transition hover:brightness-110"
            >
              Sí, es la primera vez
              <span className="block text-[0.6875rem] font-normal text-white/80">
                Te reservamos {duracionTurno(especialidad, true)} minutos
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPrimeraVez(false);
                setPaso('horario');
              }}
              className="w-full rounded-sm border border-rule bg-ground px-2.5 py-2 text-left text-[0.8125rem] font-semibold text-ink transition hover:border-accent"
            >
              No, ya me atendí antes
              <span className="block text-[0.6875rem] font-normal text-ink-soft">
                Control de {duracionTurno(especialidad, false)} minutos
              </span>
            </button>
          </div>
          <p className="mt-2 text-[0.625rem] leading-snug text-ink-faint">
            La primera consulta lleva más tiempo. Reservarla más larga evita
            que espere el que sigue.
          </p>
        </div>
      )}

      {paso === 'horario' && especialidad && duracion !== null && (
        <div className="mt-3">
          <p className="text-[0.6875rem] text-ink-soft">
            {especialidad} · {primeraVez ? 'primera consulta' : 'control'} · {duracion} min
          </p>
          <p className="eyebrow mt-2 text-[0.5625rem]">Elegí un horario</p>
          <ul className="mt-1.5 space-y-1">
            {opciones.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    setElegido(o);
                    setPaso('listo');
                  }}
                  className="flex w-full items-baseline justify-between rounded-sm border border-rule bg-ground px-2.5 py-2 text-left transition hover:border-accent"
                >
                  <span className="text-[0.8125rem] font-semibold text-ink">
                    {formatoFecha(o.fecha)}
                  </span>
                  <span className="tabular text-[0.8125rem] font-semibold text-accent">
                    {formatoHora(o.hora)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {paso === 'listo' && especialidad && elegido && duracion !== null && (
        <div className="mt-3">
          <p className="rounded-sm bg-sev-normal-bg px-2.5 py-2 text-[0.8125rem] font-semibold text-sev-normal">
            Turno reservado
          </p>
          <dl className="mt-2 space-y-1.5 text-[0.8125rem]">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Cuándo</dt>
              <dd className="tabular text-right font-semibold text-ink">
                {formatoFecha(elegido.fecha)}, {formatoHora(elegido.hora)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Qué</dt>
              <dd className="text-right font-semibold text-ink">
                {especialidad}
                <span className="block text-[0.6875rem] font-normal text-ink-soft">
                  {primeraVez ? 'Primera consulta' : 'Control'} · {duracion} min
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-soft">Dónde</dt>
              <dd className="text-right font-semibold text-ink">
                {sedeNombre}
                <span className="block text-[0.6875rem] font-normal text-ink-soft">
                  {elegido.consultorio}
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[0.625rem] leading-snug text-ink-faint">
            Te vamos a preguntar si venís 45 minutos antes. Si no podés ir,
            avisá desde acá y el turno queda libre para otra persona.
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {paso !== 'especialidad' && paso !== 'listo' && (
          <button
            type="button"
            onClick={() =>
              setPaso(paso === 'horario' ? 'tipo' : 'especialidad')
            }
            className="flex-1 rounded-sm border border-rule bg-surface px-2 py-1.5 text-[0.75rem] font-semibold text-ink-soft transition hover:text-ink"
          >
            Atrás
          </button>
        )}
        <button
          type="button"
          onClick={onVolver}
          className="flex-1 rounded-sm border border-rule bg-surface px-2 py-1.5 text-[0.75rem] font-semibold text-ink-soft transition hover:text-ink"
        >
          {paso === 'listo' ? 'Volver a mi turno' : 'Cancelar'}
        </button>
      </div>
    </div>
  );
}
