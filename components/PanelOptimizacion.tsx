'use client';

/**
 * Panel del motor de reasignación.
 *
 * DECISIÓN DE PRODUCTO: el plan se PROPONE, no se aplica solo.
 *
 * La tentación es automatizar la reasignación. No se hace, por dos razones
 * que hay que poder defender:
 *
 *  1. Clínica: mover a un paciente de consultorio puede ser incorrecto por
 *     motivos que el sistema no ve (continuidad con su médico de siempre,
 *     un estudio que quedó en la otra sala, un acompañante). Recepción sí
 *     los ve. El sistema propone; la persona decide.
 *  2. Adopción: un sistema que reordena la sala sin avisar se apaga a la
 *     semana. Uno que sugiere y acierta se gana el permiso de automatizar
 *     más adelante. La confianza se construye en ese orden.
 */

import { formatoHora, type Minutos } from '@/lib/domain';
import type { PlanReasignacion } from '@/lib/optimizador';

const nombreConsultorio = (id: string) => `C${id.split('-c')[1] ?? id}`;

interface Props {
  plan: PlanReasignacion;
  aplicado: boolean;
  onAplicar: () => void;
  onDeshacer: () => void;
}

export function PanelOptimizacion({ plan, aplicado, onAplicar, onDeshacer }: Props) {
  const { reasignaciones, minutosRecuperados, pacientesBeneficiados } = plan;

  if (!aplicado && reasignaciones.length === 0) {
    return (
      <section className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-rule bg-surface px-4 py-3">
        <span className="eyebrow">Motor de reasignación</span>
        <p className="text-[0.875rem] text-ink-soft">
          La carga está equilibrada entre consultorios de la misma especialidad.
          No hay movimiento que mejore la espera en más de 8 minutos.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-sm border ${aplicado ? 'border-sev-normal/40 bg-sev-normal-bg' : 'border-accent/30 bg-accent-soft'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">Motor de reasignación</p>
          {aplicado ? (
            <p className="text-[0.9375rem] font-semibold text-ink">
              Plan aplicado · {pacientesBeneficiados}{' '}
              {pacientesBeneficiados === 1 ? 'paciente reubicado' : 'pacientes reubicados'},{' '}
              {Math.round(minutosRecuperados)} minutos de espera evitados
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
            Solo dentro de la misma especialidad, sin adelantar a nadie que ya
            esté en consulta.
          </p>
        </div>

        <button
          type="button"
          onClick={aplicado ? onDeshacer : onAplicar}
          className={`shrink-0 rounded-xs px-3 py-2 text-[0.8125rem] font-semibold transition ${
            aplicado
              ? 'border border-rule bg-surface text-ink hover:bg-ground'
              : 'bg-accent text-white hover:brightness-110'
          }`}
        >
          {aplicado ? 'Deshacer' : 'Aplicar plan'}
        </button>
      </div>

      {!aplicado && (
        <ul className="divide-y divide-rule/50 border-t border-rule/50">
          {reasignaciones.slice(0, 5).map((r) => (
            <li
              key={r.turnoId}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2"
            >
              <span className="text-[0.8125rem] text-ink">
                <span className="font-semibold">{r.paciente}</span>
                <span className="tabular ml-2 text-ink-soft">
                  {nombreConsultorio(r.desdeConsultorio)} →{' '}
                  {nombreConsultorio(r.haciaConsultorio)}
                </span>
              </span>
              <span className="tabular text-[0.8125rem] text-ink-soft">
                {formatoHora(r.inicioSinAccion as Minutos)} →{' '}
                <span className="font-semibold text-sev-normal">
                  {formatoHora(r.inicioConPlan as Minutos)}
                </span>
                <span className="ml-2 text-ink-faint">
                  −{Math.round(r.minutosAhorrados)}′
                </span>
              </span>
            </li>
          ))}
          {reasignaciones.length > 5 && (
            <li className="px-4 py-2 text-[0.75rem] text-ink-faint">
              y {reasignaciones.length - 5} movimientos más
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
