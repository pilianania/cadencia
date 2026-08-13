'use client';

/**
 * Comparación de escenarios — la lámina para dirección.
 *
 * FORMA: líneas. El dato es evolución en el tiempo de cuatro políticas sobre
 * la misma población, y lo que hay que leer es la FORMA de cada curva, no el
 * valor puntual: si sube toda la jornada, la agenda no se recupera sola.
 *
 * COLOR: el escenario base va en gris punteado porque no es una serie más, es
 * la referencia contra la que se comparan las otras tres. Las tres políticas
 * usan slots categóricos validados (ΔE CVD 9.2 en el peor par, todos los pares).
 * No se usó una rampa secuencial —aunque los escenarios estén ordenados—
 * porque con cuatro curvas superpuestas la tarea real del lector es distinguir
 * identidades, y una rampa clara/oscura falla el piso de contraste.
 *
 * ALIVIO DE CONTRASTE: el aqua queda por debajo de 3:1 sobre blanco, así que
 * el gráfico lleva etiquetas directas Y vista de tabla, no solo leyenda.
 */

import { useMemo, useState } from 'react';
import { JORNADA, formatoHora, type Minutos } from '@/lib/domain';
import { horasDelEje, type ResumenEscenario } from '@/lib/escenarios';

/* Slots categóricos validados con scripts/validate_palette.js
 * (light, superficie #FFFFFF, --pairs all): PASS en banda de luminosidad,
 * piso de croma, separación CVD y visión normal. */
const SERIE = ['#2a78d6', '#eb6834', '#1baf7a'] as const;
const REFERENCIA = '#8d9aa8';

const W = 860;
const H = 360;
const M = { top: 24, right: 132, bottom: 40, left: 52 };

interface Props {
  resumenes: readonly ResumenEscenario[];
}

export function GraficoEscenarios({ resumenes }: Props) {
  const [tabla, setTabla] = useState(false);
  const [horaActiva, setHoraActiva] = useState<Minutos | null>(null);

  /* El eje se corta en el cierre agendado.
   *
   * Después de las 18:00 quedan poquísimos pacientes, pero con esperas de
   * 100–190 minutos: tres puntos marginales estiran la escala a 200′ y aplastan
   * las diez horas donde está el 95% de la jornada. Recortar acá NO es esconder
   * el dato —la cola posterior se reporta explícitamente abajo, y la tabla la
   * muestra completa— es evitar que el caso extremo tape el caso general. */
  const horasCompletas = useMemo(() => horasDelEje(resumenes), [resumenes]);
  const horas = useMemo(
    () => horasCompletas.filter((h) => h <= JORNADA.cierre),
    [horasCompletas],
  );

  const series = useMemo(
    () =>
      resumenes.map((r, i) => ({
        resumen: r,
        color: i === 0 ? REFERENCIA : SERIE[(i - 1) % SERIE.length],
        esReferencia: i === 0,
        valores: new Map(r.curva.map((p) => [p.hora, p.espera])),
      })),
    [resumenes],
  );

  const maxY = useMemo(() => {
    const valores = series.flatMap((s) =>
      horas.map((h) => s.valores.get(h)).filter((v): v is number => v !== undefined),
    );
    // Sin datos en el rango, Math.max(...[]) devuelve -Infinity y todo el SVG
    // sale en NaN: mejor un eje vacío con escala válida que un gráfico en blanco.
    const max = valores.length ? Math.max(...valores) : 20;
    return Math.max(20, Math.ceil(max / 20) * 20);
  }, [series, horas]);

  /* ¿Alguna fase empeora respecto de la anterior? Se detecta, no se asume:
   * es el hallazgo que sostiene el argumento de la propuesta. */
  const regresion = useMemo(() => {
    const i = resumenes.findIndex(
      (r, k) => k > 0 && r.espera > resumenes[k - 1].espera,
    );
    return i > 0 ? { peor: resumenes[i], mejor: resumenes[i - 1] } : null;
  }, [resumenes]);

  const x = (h: Minutos) =>
    M.left + ((h - horas[0]) / (horas[horas.length - 1] - horas[0])) * (W - M.left - M.right);
  const y = (v: number) => H - M.bottom - (v / maxY) * (H - M.top - M.bottom);

  /* Etiquetas directas sin superposición: se ordenan por altura y se separan
   * un mínimo de 15px. Sin esto las curvas que terminan cerca dejan los
   * nombres encimados e ilegibles, que es peor que no etiquetar. */
  const etiquetas = useMemo(() => {
    const ultima = horas[horas.length - 1];
    const xs = series
      .map((s) => ({
        id: s.resumen.escenario.id,
        texto: s.resumen.escenario.corto,
        valor: s.valores.get(ultima),
      }))
      .filter((e) => e.valor !== undefined)
      .map((e) => ({ ...e, y: y(e.valor!) }))
      .sort((a, b) => a.y - b.y);

    for (let i = 1; i < xs.length; i++) {
      if (xs[i].y - xs[i - 1].y < 15) xs[i].y = xs[i - 1].y + 15;
    }
    return xs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, horas, maxY]);

  const ticksY = useMemo(() => {
    const paso = maxY / 4;
    return [0, paso, paso * 2, paso * 3, maxY];
  }, [maxY]);

  return (
    <section className="rounded-sm border border-rule bg-surface">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className="eyebrow">Proyección de la jornada · red completa</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Espera del paciente hora por hora, según qué se implemente
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setTabla((t) => !t)}
          className="rounded-xs border border-rule px-2.5 py-1.5 text-[0.75rem] font-semibold text-ink-soft transition hover:text-ink"
          aria-pressed={tabla}
        >
          {tabla ? 'Ver gráfico' : 'Ver tabla'}
        </button>
      </header>

      {tabla ? (
        <Tabla series={series} horas={horasCompletas} />
      ) : (
        <div className="overflow-x-auto px-4 py-3">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full min-w-[40rem]"
            role="img"
            aria-label={`Espera media por hora en cuatro escenarios. Hoy alcanza ${Math.round(
              Math.max(...(series[0] ? [...series[0].valores.values()] : [0])),
            )} minutos al cierre; con las tres fases implementadas la jornada cierra sin cola.`}
            onMouseLeave={() => setHoraActiva(null)}
          >
            {/* Grilla: recesiva, solo horizontal. */}
            {ticksY.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={W - M.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--color-rule)"
                  strokeWidth={1}
                />
                <text
                  x={M.left - 10}
                  y={y(t) + 4}
                  textAnchor="end"
                  className="tabular"
                  fontSize={11}
                  fill="var(--color-ink-faint)"
                >
                  {Math.round(t)}
                </text>
              </g>
            ))}
            <text
              x={M.left - 10}
              y={M.top - 8}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-ink-faint)"
            >
              min
            </text>

            {/* Eje horario */}
            {horas.map((h, i) =>
              i % 2 === 0 ? (
                <text
                  key={h}
                  x={x(h)}
                  y={H - M.bottom + 18}
                  textAnchor="middle"
                  className="tabular"
                  fontSize={11}
                  fill="var(--color-ink-faint)"
                >
                  {formatoHora(h)}
                </text>
              ) : null,
            )}

            {/* Crosshair */}
            {horaActiva !== null && (
              <line
                x1={x(horaActiva)}
                x2={x(horaActiva)}
                y1={M.top}
                y2={H - M.bottom}
                stroke="var(--color-ink)"
                strokeWidth={1}
                opacity={0.25}
              />
            )}

            {/* Series */}
            {series.map((s) => {
              const puntos = horas
                .filter((h) => s.valores.has(h))
                .map((h) => `${x(h)},${y(s.valores.get(h)!)}`);
              if (puntos.length < 2) return null;
              return (
                <g key={s.resumen.escenario.id}>
                  <polyline
                    points={puntos.join(' ')}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.esReferencia ? '5 4' : undefined}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {horaActiva !== null && s.valores.has(horaActiva) && (
                    <circle
                      cx={x(horaActiva)}
                      cy={y(s.valores.get(horaActiva)!)}
                      r={4.5}
                      fill={s.color}
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}

            {/* Etiquetas directas: identidad sin depender del color. */}
            {etiquetas.map((e) => (
              <text
                key={e.id}
                x={W - M.right + 10}
                y={e.y + 4}
                fontSize={11}
                fontWeight={600}
                fill="var(--color-ink)"
              >
                {e.texto}
              </text>
            ))}

            {/* Zonas de captura del hover, más anchas que las marcas. */}
            {horas.map((h) => (
              <rect
                key={h}
                x={x(h) - 14}
                y={M.top}
                width={28}
                height={H - M.top - M.bottom}
                fill="transparent"
                onMouseEnter={() => setHoraActiva(h)}
              />
            ))}
          </svg>

          {horaActiva !== null && (
            <Tooltip hora={horaActiva} series={series} />
          )}

          <Leyenda series={series} />
        </div>
      )}

      <footer className="space-y-2 border-t border-rule bg-sunken px-4 py-3">
        {/* La afirmación se DERIVA de los datos, no se escribe a mano: si un
            cambio de parámetros hiciera que la fase 2 ya no empeore, el texto
            desaparece en vez de quedar mintiendo. */}
        {regresion && (
          <p className="text-[0.8125rem] leading-snug text-ink">
            <strong className="font-semibold">
              La {regresion.peor.escenario.nombre.toLowerCase()} empeora la
              espera respecto de la {regresion.mejor.escenario.nombre.toLowerCase()}
            </strong>{' '}
            ({regresion.peor.espera.toFixed(1).replace('.', ',')}′ contra{' '}
            {regresion.mejor.espera.toFixed(1).replace('.', ',')}′). Los
            recordatorios recuperan pacientes que entran en una grilla armada
            asumiendo que no iban a venir. Bajar ausencias y desagendar son una
            sola decisión, no dos.
          </p>
        )}
        {/* El eje se corta a las 18:00, así que la cola posterior se reporta
            acá con todas las letras en lugar de desaparecer del gráfico. */}
        <p className="text-[0.75rem] leading-snug text-ink-soft">
          <strong className="font-semibold text-ink">
            El eje termina en el cierre agendado (18:00).
          </strong>{' '}
          Después de esa hora quedan pocos pacientes pero con esperas de 100 a
          190 minutos, que estirarían la escala y taparían el resto de la
          jornada. La tabla los muestra completos.{' '}
          {resumenes.map((r, i) => (
            <span key={r.escenario.id}>
              {i > 0 && ' · '}
              <span className="text-ink">{r.escenario.corto}</span>: última
              consulta {formatoHora(r.cierre)}
            </span>
          ))}
          . En ese tramo las curvas se cruzan por composición, no por
          empeoramiento: al atender antes a más gente, los que quedan al final
          son justamente los casos más demorados.
        </p>
      </footer>
    </section>
  );
}

/**
 * Resumen por escenario. Va ANTES del gráfico porque responde la pregunta
 * de dirección ("¿cuánto mejora y cuánto cuesta?") sin obligar a leer curvas.
 * El gráfico explica el porqué; esta tabla da el qué.
 */
export function TablaResumen({
  resumenes,
}: {
  resumenes: readonly ResumenEscenario[];
}) {
  const base = resumenes[0];

  return (
    <section className="overflow-x-auto rounded-sm border border-rule bg-surface">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-rule">
            {[
              'Escenario',
              'Espera media',
              'Espera 14–17h',
              'P90',
              'Atendidos ≤15′',
              'Ausencias',
              'Consultas/día',
            ].map((h) => (
              <th key={h} className="eyebrow px-3 py-2 text-[0.625rem]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resumenes.map((r, i) => {
            const delta = r.espera - base.espera;
            const peorQueAnterior = i > 0 && r.espera > resumenes[i - 1].espera;
            return (
              <tr
                key={r.escenario.id}
                className="border-b border-rule/60 align-top last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  <span className="block text-[0.875rem] font-semibold text-ink">
                    {r.escenario.nombre}
                  </span>
                  <span className="mt-0.5 block max-w-[26rem] text-[0.6875rem] leading-snug text-ink-soft">
                    {r.escenario.nota}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`tabular text-lg font-semibold ${
                      peorQueAnterior ? 'text-sev-moderada' : 'text-ink'
                    }`}
                  >
                    {r.espera.toFixed(1)}′
                  </span>
                  {i > 0 && (
                    <span className="tabular ml-1.5 text-[0.6875rem] text-ink-faint">
                      {delta > 0 ? '+' : '−'}
                      {Math.abs(delta).toFixed(1)}′
                    </span>
                  )}
                </td>
                <td className="tabular px-3 py-2.5 text-[0.875rem] text-ink">
                  {r.tarde.toFixed(1)}′
                </td>
                <td className="tabular px-3 py-2.5 text-[0.875rem] text-ink">
                  {Math.round(r.p90)}′
                </td>
                <td className="tabular px-3 py-2.5 text-[0.875rem] text-ink">
                  {Math.round(r.dentroDe15 * 100)}%
                </td>
                <td className="tabular px-3 py-2.5 text-[0.875rem] text-ink">
                  {Math.round(r.tasaAusencia * 100)}%
                </td>
                <td className="tabular px-3 py-2.5 text-[0.875rem]">
                  <span className={i > 0 && r.atendidos < base.atendidos ? 'text-sev-moderada' : 'text-ink'}>
                    {r.atendidos}
                  </span>
                  {i > 0 && r.atendidos !== base.atendidos && (
                    <span className="tabular ml-1 text-[0.6875rem] text-ink-faint">
                      ({r.atendidos - base.atendidos})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

type Serie = {
  resumen: ResumenEscenario;
  color: string;
  esReferencia: boolean;
  valores: Map<Minutos, number>;
};

function Tooltip({ hora, series }: { hora: Minutos; series: readonly Serie[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xs border border-rule bg-surface px-3 py-2">
      <span className="tabular text-[0.8125rem] font-semibold text-ink">
        {formatoHora(hora)}
      </span>
      {series.map((s) => (
        <span key={s.resumen.escenario.id} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-0.5 w-3.5 rounded-full"
            style={{ background: s.color }}
          />
          <span className="text-[0.75rem] text-ink-soft">
            {s.resumen.escenario.corto}
          </span>
          <span className="tabular text-[0.8125rem] font-semibold text-ink">
            {s.valores.has(hora)
              ? `${Math.round(s.valores.get(hora)!)}′`
              : 'sin cola'}
          </span>
        </span>
      ))}
    </div>
  );
}

function Leyenda({ series }: { series: readonly Serie[] }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
      {series.map((s) => (
        <li key={s.resumen.escenario.id} className="flex items-center gap-1.5">
          <svg width={16} height={8} aria-hidden className="shrink-0">
            <line
              x1={0}
              x2={16}
              y1={4}
              y2={4}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.esReferencia ? '4 3' : undefined}
            />
          </svg>
          <span className="text-[0.75rem] text-ink-soft">
            {s.resumen.escenario.nombre}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Tabla({ series, horas }: { series: readonly Serie[]; horas: readonly Minutos[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <caption className="sr-only">
          Espera media en minutos por hora, para cada escenario
        </caption>
        <thead>
          <tr className="border-b border-rule">
            <th className="eyebrow px-3 py-2 text-[0.625rem]">Hora</th>
            {series.map((s) => (
              <th
                key={s.resumen.escenario.id}
                className="eyebrow px-3 py-2 text-[0.625rem]"
              >
                {s.resumen.escenario.corto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((h) => (
            <tr key={h} className="border-b border-rule/60 last:border-b-0">
              <td className="tabular px-3 py-1.5 text-[0.8125rem] text-ink-soft">
                {formatoHora(h)}
              </td>
              {series.map((s) => (
                <td
                  key={s.resumen.escenario.id}
                  className="tabular px-3 py-1.5 text-[0.8125rem] text-ink"
                >
                  {s.valores.has(h) ? `${Math.round(s.valores.get(h)!)}′` : '—'}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-rule">
            <td className="px-3 py-2 text-[0.75rem] font-semibold text-ink">
              Media jornada
            </td>
            {series.map((s) => (
              <td
                key={s.resumen.escenario.id}
                className="tabular px-3 py-2 text-[0.8125rem] font-semibold text-ink"
              >
                {s.resumen.espera.toFixed(1)}′
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
