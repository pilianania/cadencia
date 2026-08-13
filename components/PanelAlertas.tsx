'use client';

/**
 * Panel de alertas.
 *
 * DECISIÓN DE PRODUCTO: cada alerta tiene un botón que ejecuta la acción.
 * El brief describe un equipo que YA SABE que hay demora — se enteran cuando
 * el paciente se queja en el mostrador. Informar de nuevo no agrega valor.
 * Lo que falta es cerrar el bucle: detectar, recomendar y ejecutar en el
 * mismo lugar, sin cambiar de pantalla ni de sistema.
 *
 * El orden de la lista es por minutos evitables, no por severidad visual.
 * Un consultorio ocioso con tres personas en sala cuesta más que un paciente
 * puntual esperando 16 minutos, aunque el segundo "se vea" más urgente.
 */

import type { Alerta } from '@/lib/alertas';
import type { Severidad } from '@/lib/domain';

const ESTILO: Record<Severidad, { barra: string; texto: string; fondo: string }> = {
  normal: { barra: 'bg-sev-normal', texto: 'text-sev-normal', fondo: 'bg-sev-normal-bg' },
  leve: { barra: 'bg-sev-leve', texto: 'text-sev-leve', fondo: 'bg-sev-leve-bg' },
  moderada: {
    barra: 'bg-sev-moderada',
    texto: 'text-sev-moderada',
    fondo: 'bg-sev-moderada-bg',
  },
  critica: {
    barra: 'bg-sev-critica',
    texto: 'text-sev-critica',
    fondo: 'bg-sev-critica-bg',
  },
};

interface Props {
  alertas: readonly Alerta[];
  onEjecutar: (a: Alerta) => void;
}

export function PanelAlertas({ alertas, onEjecutar }: Props) {
  const criticas = alertas.filter((a) => a.severidad === 'critica').length;

  return (
    <section className="flex h-full flex-col rounded-sm border border-rule bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className="eyebrow">Requiere acción</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            {alertas.length === 0 ? 'Todo en orden' : `${alertas.length} alertas`}
          </h2>
        </div>
        {criticas > 0 && (
          <span className="tabular rounded-xs bg-sev-critica-bg px-2 py-1 text-[0.6875rem] font-semibold text-sev-critica">
            {criticas} críticas
          </span>
        )}
      </header>

      {alertas.length === 0 ? (
        <div className="flex flex-1 items-center px-4 py-10">
          <p className="text-sm text-ink-soft">
            Ningún consultorio ocioso, ninguna espera por encima del umbral.
            Cuando algo se corra, aparece acá con la acción sugerida.
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-rule overflow-y-auto">
          {alertas.slice(0, 12).map((a) => {
            const est = ESTILO[a.severidad];
            return (
              <li key={a.id} className="flex gap-3 px-4 py-3">
                <span
                  aria-hidden
                  className={`mt-1 w-0.5 shrink-0 self-stretch rounded-full ${est.barra}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.875rem] font-semibold leading-snug text-ink">
                    {a.titulo}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-soft">
                    {a.detalle}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEjecutar(a)}
                    className={`mt-2 rounded-xs px-2 py-1 text-[0.75rem] font-semibold ${est.fondo} ${est.texto} transition hover:brightness-95`}
                  >
                    {a.accion}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
