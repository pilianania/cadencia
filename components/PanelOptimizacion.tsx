/**
 * Panel del motor de reasignación.
 *
 * DECISIÓN DE PRODUCTO: el sistema ofrece y el paciente decide.
 *
 * Reasignar es cambiar de profesional (cada consultorio tiene uno), y si al
 * paciente le importa la continuidad con su médico solo él lo sabe. Por eso
 * el plan no se aplica: se OFRECE, directo al teléfono del paciente, sin que
 * recepción lo apruebe. El paciente acepta o rechaza; sin respuesta en la
 * ventana, cuenta como rechazo. Recepción ve acá qué se ofreció y qué pasó,
 * nada más.
 *
 * La ventana tiene que ser corta: el pool funciona porque el consultorio libre
 * se llena ahora. Una oferta que espera diez minutos ya perdió su valor.
 */

import { formatoHora, type Minutos } from '@/lib/domain';
import {
  GANANCIA_MINIMA_POR_DEFECTO,
  type PlanReasignacion,
  type Reasignacion,
} from '@/lib/optimizador';

const nombreConsultorio = (id: string) => `C${id.split('-c')[1] ?? id}`;

/** Una reasignación ya ofrecida al paciente, con el minuto en que salió. */
export type Oferta = Reasignacion & { ofrecidaEn: Minutos };

interface Props {
  plan: PlanReasignacion;
  ofertas: Record<string, Oferta>;
  /** Ofertas aceptadas hasta ahora (pacientes que ya cambiaron de lista). */
  movidos: number;
  /** Ofertas rechazadas o sin respuesta. */
  rechazadas: number;
}

export function PanelOptimizacion({ plan, ofertas, movidos, rechazadas }: Props) {
  const { reasignaciones, minutosRecuperados, pacientesBeneficiados } = plan;
  const pendientes = Object.values(ofertas);
  const hayPendientes = pendientes.length > 0;
  const huboRespuestas = movidos + rechazadas > 0;

  if (!hayPendientes && reasignaciones.length === 0) {
    return (
      <section className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-rule bg-surface px-4 py-3">
        <span className="eyebrow">Motor de reasignación</span>
        <p className="text-[0.875rem] text-ink-soft">
          La carga está equilibrada entre consultorios de la misma especialidad.
          No hay movimiento que mejore la espera en más de {GANANCIA_MINIMA_POR_DEFECTO} minutos.
        </p>
      </section>
    );
  }

  const tono = hayPendientes ? 'border-sev-leve/40 bg-sev-leve-bg' : 'border-sev-normal/40 bg-sev-normal-bg';

  return (
    <section className={`rounded-sm border ${tono}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">Motor de reasignación</p>
          {hayPendientes ? (
            <p className="text-[0.9375rem] font-semibold text-ink">
              {pendientes.length}{' '}
              {pendientes.length === 1 ? 'oferta enviada' : 'ofertas enviadas'} ·
              esperando respuesta del paciente ·{' '}
              <span className="text-accent">
                {Math.round(minutosRecuperados)} minutos de espera evitables
              </span>
            </p>
          ) : (
            <p className="text-[0.9375rem] font-semibold text-ink">
              {pacientesBeneficiados}{' '}
              {pacientesBeneficiados === 1 ? 'paciente puede' : 'pacientes pueden'} pasar
              antes ·{' '}
              <span className="text-accent">
                {Math.round(minutosRecuperados)} minutos de espera evitables
              </span>
            </p>
          )}
          <p className="mt-0.5 text-[0.75rem] text-ink-soft">
            Solo dentro de la misma especialidad. La oferta le llega al paciente a su teléfono
            y él acepta o rechaza; sin respuesta, cuenta como rechazo.
            {huboRespuestas &&
              ` Hoy: ${movidos} ${movidos === 1 ? 'aceptada' : 'aceptadas'}, ${rechazadas} ${rechazadas === 1 ? 'rechazada' : 'rechazadas'}.`}
          </p>
        </div>
      </div>

      {(hayPendientes || reasignaciones.length > 0) && (
        <ul className="divide-y divide-rule/50 border-t border-rule/50">
          {(hayPendientes ? pendientes : reasignaciones.slice(0, 5)).map((r) => (
            <li
              key={r.turnoId}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2"
            >
              <span className="text-[0.8125rem] text-ink">
                <span className="font-semibold">{r.paciente}</span>
                <span className="tabular ml-2 text-ink-soft">
                  {nombreConsultorio(r.desdeConsultorio)} →{' '}
                  {nombreConsultorio(r.haciaConsultorio)}
                </span>
              </span>
              <span className="flex items-baseline gap-3">
                <span className="tabular text-[0.8125rem] text-ink-soft">
                  {formatoHora(r.inicioSinAccion as Minutos)} →{' '}
                  <span className="font-semibold text-sev-normal">
                    {formatoHora(r.inicioConPlan as Minutos)}
                  </span>
                  <span className="ml-2 text-ink-faint">−{Math.round(r.minutosAhorrados)}′</span>
                </span>
              </span>
            </li>
          ))}
          {!hayPendientes && reasignaciones.length > 5 && (
            <li className="px-4 py-2 text-[0.75rem] text-ink-faint">
              y {reasignaciones.length - 5} movimientos más
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
