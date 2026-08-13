'use client';

/**
 * VISTA DE RED — la pantalla de la Directora de Operaciones.
 *
 * DECISIÓN DE PRODUCTO: no es el dashboard de sede repetido ocho veces.
 * Es una pantalla distinta porque responde otra pregunta.
 *
 * El mostrador pregunta "¿a quién llamo ahora?".
 * La Directora pregunta "¿a cuál de mis ocho sedes voy hoy?".
 *
 * Por eso las sedes se ordenan por severidad y no alfabéticamente: la lista
 * es una cola de intervención, no un directorio. Lo primero que se lee es
 * dónde está el incendio.
 */

import { useMemo } from 'react';
import {
  formatoHora,
  severidadDeEspera,
  type Minutos,
  type Sede,
  type Severidad,
  type Turno,
} from '@/lib/domain';
import { calcularMetricas, estadoPorConsultorio } from '@/lib/metricas';
import { generarAlertas } from '@/lib/alertas';

const TEXTO: Record<Severidad, string> = {
  normal: 'text-sev-normal',
  leve: 'text-sev-leve',
  moderada: 'text-sev-moderada',
  critica: 'text-sev-critica',
};

const TRAZO: Record<Severidad, string> = {
  normal: 'bg-sev-normal',
  leve: 'bg-sev-leve',
  moderada: 'bg-sev-moderada',
  critica: 'bg-sev-critica',
};

const ORDEN: Record<Severidad, number> = {
  critica: 0,
  moderada: 1,
  leve: 2,
  normal: 3,
};

export interface FilaSede {
  sede: Sede;
  esperaPercibida: number;
  esperaP90: number;
  enSala: number;
  peorEspera: number;
  tasaAusencia: number;
  ocupacion: number;
  consultoriosOciosos: number;
  criticas: number;
  severidad: Severidad;
  /** Espera percibida por hora hasta ahora — para la miniatura. */
  curva: number[];
}

export function construirFilas(
  sedes: readonly Sede[],
  turnosPorSede: Map<string, Turno[]>,
  ahora: Minutos,
): FilaSede[] {
  return sedes
    .map((sede) => {
      const turnos = turnosPorSede.get(sede.id) ?? [];
      const m = calcularMetricas(turnos, ahora);
      const estados = estadoPorConsultorio(turnos, ahora);
      const alertas = generarAlertas(turnos, estados, ahora);

      // Curva: espera media de los turnos iniciados en cada hora transcurrida.
      const porHora = new Map<number, number[]>();
      for (const t of turnos) {
        if (t.inicioA === undefined) continue;
        const h = Math.floor(t.inicioA / 60);
        const xs = porHora.get(h) ?? [];
        xs.push(Math.max(0, t.inicioA - t.agendadoA));
        porHora.set(h, xs);
      }
      const curva = [...porHora.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, xs]) => xs.reduce((s, x) => s + x, 0) / xs.length);

      return {
        sede,
        esperaPercibida: m.esperaPercibida,
        esperaP90: m.esperaP90,
        enSala: m.enEspera,
        peorEspera: m.peorEsperaActual,
        tasaAusencia: m.tasaAusencia,
        ocupacion: m.ocupacion,
        consultoriosOciosos: estados.filter((e) => e.ocioso).length,
        criticas: alertas.filter((a) => a.severidad === 'critica').length,
        severidad: severidadDeEspera(m.esperaPercibida),
        curva,
      };
    })
    .sort(
      (a, b) =>
        ORDEN[a.severidad] - ORDEN[b.severidad] ||
        b.esperaPercibida - a.esperaPercibida,
    );
}

interface Props {
  filas: readonly FilaSede[];
  ahora: Minutos;
  onAbrirSede: (sedeId: string) => void;
}

export function VistaRed({ filas, ahora, onAbrirSede }: Props) {
  const total = useMemo(() => {
    const n = filas.length || 1;
    return {
      espera: filas.reduce((s, f) => s + f.esperaPercibida, 0) / n,
      enSala: filas.reduce((s, f) => s + f.enSala, 0),
      ociosos: filas.reduce((s, f) => s + f.consultoriosOciosos, 0),
      criticas: filas.reduce((s, f) => s + f.criticas, 0),
    };
  }, [filas]);

  return (
    <section className="rounded-sm border border-rule bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className="eyebrow">Red completa · {formatoHora(ahora)}</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Dónde intervenir hoy
          </h2>
        </div>
        <dl className="flex flex-wrap items-baseline gap-x-6">
          <Resumen rotulo="Espera media red" valor={`${Math.round(total.espera)}′`} />
          <Resumen rotulo="En sala" valor={String(total.enSala)} />
          <Resumen
            rotulo="Consultorios ociosos"
            valor={String(total.ociosos)}
            clase={total.ociosos > 0 ? TEXTO.moderada : undefined}
          />
          <Resumen
            rotulo="Alertas críticas"
            valor={String(total.criticas)}
            clase={total.criticas > 0 ? TEXTO.critica : undefined}
          />
        </dl>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {['Sede', 'Espera', 'Curva del día', 'En sala', 'Ociosos', 'Ausencias', 'Ocupación', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="eyebrow px-3 py-2 text-[0.625rem] font-semibold"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr
                key={f.sede.id}
                className="border-b border-rule/60 last:border-b-0 hover:bg-ground/60"
              >
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-6 w-0.5 rounded-full ${TRAZO[f.severidad]}`}
                    />
                    <span>
                      <span className="block text-[0.875rem] font-semibold leading-tight text-ink">
                        {f.sede.nombre}
                      </span>
                      <span className="block text-[0.6875rem] text-ink-faint">
                        {f.sede.localidad}
                      </span>
                    </span>
                  </span>
                </td>

                <td className="px-3 py-2.5">
                  <span className={`tabular text-lg font-semibold ${TEXTO[f.severidad]}`}>
                    {Math.round(f.esperaPercibida)}′
                  </span>
                  <span className="tabular ml-1.5 text-[0.6875rem] text-ink-faint">
                    P90 {Math.round(f.esperaP90)}′
                  </span>
                </td>

                <td className="px-3 py-2.5">
                  <Miniatura valores={f.curva} severidad={f.severidad} />
                </td>

                <td className="tabular px-3 py-2.5 text-[0.875rem] text-ink">
                  {f.enSala}
                  {f.peorEspera >= 25 && (
                    <span className={`ml-1.5 text-[0.6875rem] ${TEXTO.critica}`}>
                      peor {Math.round(f.peorEspera)}′
                    </span>
                  )}
                </td>

                <td className="tabular px-3 py-2.5 text-[0.875rem]">
                  <span className={f.consultoriosOciosos > 0 ? TEXTO.moderada : 'text-ink-faint'}>
                    {f.consultoriosOciosos}
                  </span>
                </td>

                <td className="tabular px-3 py-2.5 text-[0.875rem]">
                  <span className={f.tasaAusencia > 0.3 ? TEXTO.critica : 'text-ink'}>
                    {Math.round(f.tasaAusencia * 100)}%
                  </span>
                </td>

                <td className="px-3 py-2.5">
                  <Barra valor={f.ocupacion} />
                </td>

                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onAbrirSede(f.sede.id)}
                    className="text-[0.8125rem] font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Miniatura de la curva del día. Sin ejes: acá solo importa la forma —
 *  si sube, la sede no se está recuperando. */
function Miniatura({ valores, severidad }: { valores: number[]; severidad: Severidad }) {
  if (valores.length < 2) {
    return <span className="text-[0.6875rem] text-ink-faint">—</span>;
  }
  const max = Math.max(...valores, 20);
  const w = 88;
  const h = 22;
  const paso = w / (valores.length - 1);
  const puntos = valores
    .map((v, i) => `${(i * paso).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(' ');

  const color =
    severidad === 'critica'
      ? 'var(--color-sev-critica)'
      : severidad === 'moderada'
        ? 'var(--color-sev-moderada)'
        : severidad === 'leve'
          ? 'var(--color-sev-leve)'
          : 'var(--color-sev-normal)';

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Evolución de la espera: de ${Math.round(valores[0])} a ${Math.round(valores[valores.length - 1])} minutos`}
      className="overflow-visible"
    >
      <polyline
        points={puntos}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={(valores.length - 1) * paso}
        cy={h - (valores[valores.length - 1] / max) * h}
        r={2.2}
        fill={color}
      />
    </svg>
  );
}

function Barra({ valor }: { valor: number }) {
  const pct = Math.round(valor * 100);
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-sunken">
        <span
          className={`block h-full rounded-full ${pct < 70 ? 'bg-sev-moderada' : 'bg-sev-normal'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </span>
      <span className="tabular text-[0.6875rem] text-ink-soft">{pct}%</span>
    </span>
  );
}

function Resumen({
  rotulo,
  valor,
  clase,
}: {
  rotulo: string;
  valor: string;
  clase?: string;
}) {
  return (
    <div>
      <dt className="eyebrow text-[0.625rem]">{rotulo}</dt>
      <dd className={`tabular text-base font-semibold ${clase ?? 'text-ink'}`}>
        {valor}
      </dd>
    </div>
  );
}
