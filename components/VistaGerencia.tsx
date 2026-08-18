'use client';

/**
 * INDICADORES POR PERÍODO, de la red o de una sede.
 *
 * Es la misma vista en dos alcances: la Dirección la mira para la red
 * completa; la coordinación de una sede, para su sede. No compara
 * escenarios ni habla de fases: el producto es para siempre, y las fases del
 * despliegue son solo hitos que se marcan en el gráfico del año. Los datos
 * son un año simulado en el que el módulo se despliega por fases, que es lo
 * que la Dirección vería si el proyecto se hiciera.
 */

import { useCallback, useMemo, useState } from 'react';
import { SEDES } from '@/lib/seed';
import { VALORES } from '@/lib/gerencia';
import {
  DIAS_POR_MES,
  MESES,
  agregar,
  jornadasDe,
  porMes,
  porSedeDe,
  type DatosGerencia,
  type IndicadoresSede,
  type Jornada,
  type Periodo,
} from '@/lib/periodos';

const ROTULO: Record<Periodo, string> = { dia: 'Día', mes: 'Mes', anio: 'Año' };
const MES_NOMBRE = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
/** Hitos del despliegue, para anotar el gráfico del año. No son estados del producto. */
const HITO_ROTULO = [
  'Medición',
  'Reasignación',
  'Confirmación y agenda ajustada',
  'Primera consulta más larga',
];

const num = (n: number) => Math.round(n).toLocaleString('es-AR');
const usd = (n: number) => `USD ${num(n)}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const min = (v: number) => `${Math.round(v)} min`;

interface Props {
  datos: DatosGerencia;
  /** Sin sede: la red completa. Con sede: solo esa sede. */
  sedeId?: string;
  sedeNombre?: string;
}

export function VistaGerencia({ datos, sedeId, sedeNombre }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [mes, setMes] = useState(MESES);
  const [dia, setDia] = useState(DIAS_POR_MES);

  const jornadas = useMemo(() => jornadasDe(datos, periodo, mes, dia), [datos, periodo, mes, dia]);
  /* El indicador de una jornada según el alcance: la red o la sede elegida. */
  const de = useCallback(
    (j: Jornada): IndicadoresSede => (sedeId ? j.porSede.find((x) => x.sedeId === sedeId)! : j.red),
    [sedeId],
  );
  const actual = useMemo(() => agregar(jornadas.map(de)), [jornadas, de]);
  const dias = jornadas.length;

  /* Contra qué se compara. Un mes contra el anterior mide sobre todo ruido:
   * de un mes a otro la espera se mueve ±10% sin que cambie nada. Lo que la
   * Dirección quiere saber es cuánto cambió respecto de ANTES del despliegue,
   * así que desde que arranca la fase 1 la referencia es la línea de base (el
   * primer trimestre, fase 0). Durante la fase 0 no hay línea de base todavía
   * y se compara con el mes anterior. El día se compara con el mismo día de
   * la semana anterior, no con ayer. */
  const anterior = useMemo(() => {
    const lineaDeBase = () => {
      const js = datos.jornadas.filter((j) => j.mes <= 3);
      return { rotulo: 'la línea de base (primer trimestre, antes del despliegue)', ind: agregar(js.map(de)), dias: js.length };
    };
    if (periodo === 'dia') {
      const j = jornadas[0];
      if (j.fase >= 1) return lineaDeBase();
      const prev = datos.jornadas[j.dia - 5];
      return prev ? { rotulo: 'el mismo día de la semana anterior', ind: de(prev), dias: 1 } : null;
    }
    if (periodo === 'mes') {
      if (mes > 3) return lineaDeBase();
      if (mes <= 1) return null;
      const js = jornadasDe(datos, 'mes', mes - 1);
      return { rotulo: MES_NOMBRE[mes - 2], ind: agregar(js.map(de)), dias: js.length };
    }
    const js = datos.jornadas.filter((j) => j.mes <= 3);
    return { rotulo: 'primer trimestre, línea de base', ind: agregar(js.map(de)), dias: js.length };
  }, [datos, jornadas, periodo, mes, de]);

  const porSede = useMemo(() => porSedeDe(jornadas), [jornadas]);

  /* Rango de la espera media dentro del período: por jornada en el mes y el
   * año, por sede en el día. */
  const rango = useMemo(() => {
    const valores =
      periodo === 'dia' && !sedeId ? porSede.map((s) => s.esperaMedia) : jornadas.map((j) => de(j).esperaMedia);
    return {
      rotulo: periodo === 'dia' && !sedeId ? 'según la sede' : 'según la jornada',
      min: Math.min(...valores),
      max: Math.max(...valores),
    };
  }, [periodo, porSede, jornadas, sedeId, de]);

  const serieMes = useMemo(
    () =>
      sedeId
        ? Array.from({ length: MESES }, (_, i) =>
            agregar(datos.jornadas.filter((j) => j.mes === i + 1).map(de), `m${i + 1}`),
          )
        : porMes(datos),
    [datos, sedeId, de],
  );

  const fase = jornadas[jornadas.length - 1]?.fase ?? 0;

  return (
    <section className="rounded-sm border border-rule bg-surface">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className="eyebrow">Indicadores por período · {sedeNombre ?? 'red completa'}</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            {periodo === 'dia' && `Jornada ${dia} de ${MES_NOMBRE[mes - 1]}`}
            {periodo === 'mes' && `${MES_NOMBRE[mes - 1]} · ${dias} jornadas`}
            {periodo === 'anio' && `Año · ${dias} jornadas`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periodo === 'dia' && (
            <select
              value={dia}
              onChange={(e) => setDia(Number(e.target.value))}
              aria-label="Día operativo del mes"
              className="rounded-xs border border-rule bg-surface px-2 py-1.5 text-[0.8125rem] font-semibold text-ink"
            >
              {Array.from({ length: DIAS_POR_MES }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Jornada {i + 1}
                </option>
              ))}
            </select>
          )}
          {periodo !== 'anio' && (
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              aria-label="Mes"
              className="rounded-xs border border-rule bg-surface px-2 py-1.5 text-[0.8125rem] font-semibold text-ink"
            >
              {MES_NOMBRE.map((n, i) => (
                <option key={n} value={i + 1}>
                  {n}
                </option>
              ))}
            </select>
          )}
          <nav className="flex rounded-xs border border-rule" aria-label="Período">
            {(['dia', 'mes', 'anio'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                aria-current={periodo === p ? 'page' : undefined}
                className={`px-3 py-1.5 text-[0.8125rem] font-semibold transition ${
                  periodo === p ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {ROTULO[p]}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Cifras del período, con variación contra el período anterior */}
      <div className="grid grid-cols-2 divide-rule border-b border-rule bg-sunken md:grid-cols-3 lg:grid-cols-5 lg:divide-x">
        {/* La espera va en una sola tarjeta con su rango y su cola: la media
            sola esconde tanto la peor sede como el peor paciente. */}
        <Cifra
          rotulo="Espera media"
          valor={min(actual.esperaMedia)}
          sub={`${rango.rotulo}: de ${Math.round(rango.min)} a ${Math.round(rango.max)} min · el 10% que más espera: ${min(actual.p90)}`}
          delta={anterior && rel(actual.esperaMedia, anterior.ind.esperaMedia)}
          bajarEsBueno
        />
        <Cifra
          rotulo="Ausencias sin aviso"
          valor={pct(actual.ausentesSinAviso / actual.ofrecidos)}
          sub={`${num(actual.ausentesSinAviso)} turnos · ${usd(actual.ausentesSinAviso * VALORES.facturacionPorConsultaUsd)}`}
          delta={anterior && rel(actual.ausentesSinAviso / actual.ofrecidos, anterior.ind.ausentesSinAviso / anterior.ind.ofrecidos)}
          bajarEsBueno
        />
        <Cifra
          rotulo="Uso de la agenda"
          valor={pct(actual.atendidos / actual.ofrecidos)}
          sub={`${num(actual.atendidos)} atendidos de ${num(actual.ofrecidos)}`}
          delta={anterior && rel(actual.atendidos / actual.ofrecidos, anterior.ind.atendidos / anterior.ind.ofrecidos)}
        />
        <Cifra
          rotulo="Liberados con aviso"
          valor={num(actual.liberadosConAviso)}
          sub="reasignables"
          delta={anterior && rel(actual.liberadosConAviso / dias, anterior.ind.liberadosConAviso / anterior.dias)}
        />
        <Cifra
          rotulo="Consultorio libre con pacientes de su especialidad esperando"
          valor={`${num(actual.minutosLibreRecuperables / 60)} h`}
          sub={`${usd((actual.minutosLibreRecuperables / 60) * VALORES.horaMedicaUsd)} · además ${num((actual.minutosLibreConSala - actual.minutosLibreRecuperables) / 60)} h libres con gente de otra especialidad esperando`}
          delta={
            anterior && anterior.ind.minutosLibreRecuperables > 0
              ? rel(actual.minutosLibreRecuperables / dias, anterior.ind.minutosLibreRecuperables / anterior.dias)
              : null
          }
          bajarEsBueno
        />
      </div>
      {anterior && (
        <p className="border-b border-rule px-4 py-1.5 text-[0.6875rem] text-ink-faint">
          Variación contra {anterior.rotulo}
          {periodo !== 'dia' && ', por día operativo donde corresponde'}.
        </p>
      )}

      {/* MÉTRICAS DEL PRODUCTO. Lo que el módulo mide de forma continua además
          de las cifras de arriba: los supuestos del análisis que la fase 0
          convierte en datos propios, y las palancas de cada fase. Lo que el
          prototipo no simula se muestra como pendiente, no se inventa. */}
      <div className="border-b border-rule px-4 py-3">
        <p className="eyebrow mb-2">Métricas que el módulo sigue de forma continua</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          <Metrica
            rotulo="Sobreagendamiento"
            valor={`${actual.sobreagenda.toFixed(2).replace('.', ',')}×`}
            nota="Minutos de turno ofrecidos por minuto de consultorio disponible"
            delta={anterior && rel(actual.sobreagenda, anterior.ind.sobreagenda)}
            bajarEsBueno
          />
          <Metrica
            rotulo="Primeras consultas"
            valor={pct(actual.primerasConsultas / actual.ofrecidos)}
            nota="Sobre el total de turnos ofrecidos"
            delta={anterior && rel(actual.primerasConsultas / actual.ofrecidos, anterior.ind.primerasConsultas / anterior.ind.ofrecidos)}
          />
          <Metrica
            rotulo="Consulta real sobre turno agendado"
            valor={`${actual.brechaDuracion.toFixed(2).replace('.', ',')}×`}
            nota="Cuánto más dura la consulta que el turno agendado"
            delta={anterior && rel(actual.brechaDuracion, anterior.ind.brechaDuracion)}
            bajarEsBueno
          />
          <Metrica
            rotulo="Atendidos dentro de los 15 min"
            valor={pct(actual.dentroDe15)}
            nota="Umbral de satisfacción según la literatura"
            delta={anterior && rel(actual.dentroDe15, anterior.ind.dentroDe15)}
          />
          <Metrica
            rotulo="Reasignaciones por día"
            valor={num(actual.reasignados / dias)}
            nota={fase >= 1 ? 'Pacientes atendidos en otro consultorio de la misma especialidad' : 'Todavía sin reasignación en este período'}
            delta={anterior && anterior.ind.reasignados > 0 ? rel(actual.reasignados / dias, anterior.ind.reasignados / anterior.dias) : null}
          />
          <Metrica rotulo="Confirmaciones respondidas" valor="pendiente" nota="Sin registro en este período" delta={null} />
          <Metrica rotulo="Ofertas de reasignación aceptadas" valor="pendiente" nota="Sin registro en este período" delta={null} />
          <Metrica rotulo="Pacientes que vuelven" valor="pendiente" nota="Atendidos que vuelven a la red dentro de los 12 meses; ventana configurable por especialidad" delta={null} />
          <Metrica rotulo="Satisfacción con la espera" valor="pendiente" nota="Dos preguntas desde el teléfono al terminar la consulta, unidas a la espera real" delta={null} />
        </div>
      </div>

      {/* Evolución */}
      {periodo !== 'dia' && (
        <div className="border-b border-rule px-4 py-3">
          <p className="eyebrow mb-2">
            {periodo === 'mes' ? 'Espera media por jornada' : 'Espera media y ausencias por mes'}
          </p>
          {periodo === 'mes' ? (
            <Evolucion
              puntos={jornadas.map((j, i) => ({ etiqueta: String(i + 1), valor: de(j).esperaMedia }))}
              unidad="min"
              media={actual.esperaMedia}
              rotuloMedia="media del mes"
            />
          ) : (
            <EvolucionAnual serie={serieMes} jornadas={datos.jornadas} />
          )}
        </div>
      )}

      {/* Por sede, solo cuando el alcance es la red */}
      {!sedeId && (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {['Sede', 'Espera media', 'P90', 'Ausencias', 'Uso', 'Liberados', 'Libre con su especialidad esperando'].map((h) => (
                <th key={h} className="eyebrow px-3 py-2 text-[0.625rem] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...porSede]
              .sort((a, b) => b.esperaMedia - a.esperaMedia)
              .map((s) => (
                <FilaSede key={s.sedeId} s={s} />
              ))}
          </tbody>
        </table>
      </div>
      )}

      <p className="border-t border-rule px-4 py-2.5 text-[0.6875rem] text-ink-faint">
        Datos simulados: un año de operación de la red (22 jornadas por mes) en el que el módulo
        se fue desplegando: medición en el primer trimestre, reasignación desde abril, confirmación
        y agenda ajustada desde junio, primera consulta más larga desde septiembre. Los hitos se
        marcan en el gráfico del año. Valores a USD {VALORES.facturacionPorConsultaUsd} por consulta y USD{' '}
        {VALORES.horaMedicaUsd} por hora médica.
      </p>
    </section>
  );
}

const rel = (a: number, b: number) => (b ? (a - b) / b : 0);

function Cifra({
  rotulo,
  valor,
  sub,
  delta,
  bajarEsBueno,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  delta: number | null;
  bajarEsBueno?: boolean;
}) {
  const mejora = delta === null ? null : bajarEsBueno ? delta < 0 : delta > 0;
  const clase =
    delta === null || Math.abs(delta) < 0.005
      ? 'text-ink-faint'
      : mejora
        ? 'text-sev-normal'
        : 'text-sev-critica';
  return (
    <div className="border-b border-rule px-4 py-2.5 lg:border-b-0">
      <p className="eyebrow text-[0.625rem]">{rotulo}</p>
      <p className="tabular font-display text-xl font-semibold leading-tight text-ink">{valor}</p>
      {sub && <p className="text-[0.6875rem] text-ink-faint">{sub}</p>}
      {delta !== null && (
        <p className={`tabular text-[0.6875rem] font-semibold ${clase}`}>
          {delta > 0 ? '+' : ''}
          {Math.round(delta * 100)}%
        </p>
      )}
    </div>
  );
}

function Metrica({
  rotulo,
  valor,
  nota,
  delta,
  bajarEsBueno,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  delta: number | null;
  bajarEsBueno?: boolean;
}) {
  const pendiente = valor === 'pendiente';
  const mejora = delta === null ? null : bajarEsBueno ? delta < 0 : delta > 0;
  const clase =
    delta === null || Math.abs(delta) < 0.005 ? 'text-ink-faint' : mejora ? 'text-sev-normal' : 'text-sev-critica';
  return (
    <div>
      <p className="eyebrow text-[0.625rem]">{rotulo}</p>
      <p className={`tabular font-display text-lg font-semibold leading-tight ${pendiente ? 'text-ink-faint' : 'text-ink'}`}>
        {pendiente ? 'Sin dato' : valor}
        {delta !== null && (
          <span className={`ml-2 text-[0.6875rem] font-semibold ${clase}`}>
            {delta > 0 ? '+' : ''}
            {Math.round(delta * 100)}%
          </span>
        )}
      </p>
      <p className="text-[0.6875rem] leading-snug text-ink-faint">{nota}</p>
    </div>
  );
}

function FilaSede({ s }: { s: IndicadoresSede }) {
  const sede = SEDES.find((x) => x.id === s.sedeId);
  const aus = s.ausentesSinAviso / s.ofrecidos;
  return (
    <tr className="border-b border-rule/60 last:border-b-0">
      <td className="px-3 py-2">
        <span className="block text-[0.875rem] font-semibold text-ink">{sede?.nombre ?? s.sedeId}</span>
        <span className="block text-[0.6875rem] text-ink-faint">{sede?.localidad}</span>
      </td>
      <td className={`tabular px-3 py-2 text-[0.875rem] ${s.esperaMedia >= 45 ? 'text-sev-critica' : s.esperaMedia >= 25 ? 'text-sev-moderada' : 'text-ink'}`}>
        {min(s.esperaMedia)}
      </td>
      <td className="tabular px-3 py-2 text-[0.875rem] text-ink">{min(s.p90)}</td>
      <td className={`tabular px-3 py-2 text-[0.875rem] ${aus > 0.3 ? 'text-sev-critica' : 'text-ink'}`}>{pct(aus)}</td>
      <td className="tabular px-3 py-2 text-[0.875rem] text-ink">{pct(s.atendidos / s.ofrecidos)}</td>
      <td className="tabular px-3 py-2 text-[0.875rem] text-ink">{num(s.liberadosConAviso)}</td>
      <td className="tabular px-3 py-2 text-[0.875rem] text-ink">
        {num(s.minutosLibreRecuperables / 60)} h
        <span className="block text-[0.6875rem] text-ink-faint">{num(s.minutosLibreConSala / 60)} h con cualquier especialidad</span>
      </td>
    </tr>
  );
}

/** Línea simple con ejes, para la evolución dentro del mes. */
function Evolucion({
  puntos,
  unidad,
  media,
  rotuloMedia,
}: {
  puntos: Array<{ etiqueta: string; valor: number }>;
  unidad: string;
  /** Línea de referencia horizontal: la media del período. */
  media?: number;
  rotuloMedia?: string;
}) {
  const W = 1000, H = 150, L = 44, B = 26, T = 12;
  const max = Math.max(20, Math.ceil(Math.max(...puntos.map((p) => p.valor)) / 10) * 10);
  const x = (i: number) => L + (i / Math.max(1, puntos.length - 1)) * (W - L - 10);
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Evolución de la espera media, en ${unidad}`}>
      <g fontFamily="var(--font-sans)" fontSize={10} fill="var(--color-ink-faint)">
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="var(--color-rule)" />
            <text x={L - 6} y={y(v) + 3} textAnchor="end" className="tabular">{Math.round(v)}</text>
          </g>
        ))}
        <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--color-ink-faint)" />
        {puntos.map((p, i) => (i % 3 === 0 || i === puntos.length - 1) && (
          <text key={p.etiqueta} x={x(i)} y={H - B + 14} textAnchor="middle" className="tabular">{p.etiqueta}</text>
        ))}
        <text x={L - 6} y={T - 2} textAnchor="end">{unidad}</text>
      </g>
      <polyline
        points={puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {media !== undefined && (
        <g>
          <line x1={L} x2={W - 10} y1={y(media)} y2={y(media)} stroke="var(--color-ink-soft)" strokeWidth={1.5} strokeDasharray="6 4" />
          <text
            x={L + 6}
            y={y(media) - 4}
            textAnchor="start"
            fontSize={10}
            fontFamily="var(--font-sans)"
            fill="var(--color-ink-soft)"
            className="tabular"
          >
            {rotuloMedia ?? 'media'}: {Math.round(media)} {unidad}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Año: espera media por mes con los hitos del despliegue marcados, y ausencias debajo. */
function EvolucionAnual({ serie, jornadas }: { serie: IndicadoresSede[]; jornadas: Jornada[] }) {
  const W = 1000, H = 190, L = 44, B = 34, T = 16;
  const max = 60;
  const x = (i: number) => L + ((i + 0.5) / serie.length) * (W - L - 10);
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const faseDe = (m: number) => jornadas.find((j) => j.mes === m + 1)?.fase ?? 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Espera media por mes con los hitos del despliegue">
      {/* fondo por hito del despliegue */}
      {[0, 1, 2, 3].map((f) => {
        const meses = serie.map((_, i) => i).filter((i) => faseDe(i) === f);
        if (!meses.length) return null;
        const x0 = L + (meses[0] / serie.length) * (W - L - 10);
        const x1 = L + ((meses[meses.length - 1] + 1) / serie.length) * (W - L - 10);
        return (
          <g key={f}>
            <rect x={x0} y={T} width={x1 - x0} height={H - B - T} fill="var(--color-accent)" opacity={0.03 + f * 0.04} />
            <text x={(x0 + x1) / 2} y={T + 10} textAnchor="middle" fontSize={9} fill="var(--color-ink-faint)" fontFamily="var(--font-sans)">
              {HITO_ROTULO[f]}
            </text>
          </g>
        );
      })}
      <g fontFamily="var(--font-sans)" fontSize={10} fill="var(--color-ink-faint)">
        {[0, 20, 40, 60].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="var(--color-rule)" />
            <text x={L - 6} y={y(v) + 3} textAnchor="end" className="tabular">{v}</text>
          </g>
        ))}
        <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--color-ink-faint)" />
        {serie.map((_, i) => (
          <text key={i} x={x(i)} y={H - B + 14} textAnchor="middle">{MES_NOMBRE[i]}</text>
        ))}
        <text x={L - 6} y={T - 3} textAnchor="end">min</text>
      </g>
      <polyline
        points={serie.map((m, i) => `${x(i)},${y(m.esperaMedia)}`).join(' ')}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {serie.map((m, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(m.esperaMedia)} r={3} fill="var(--color-accent)" />
          <text x={x(i)} y={H - B + 26} textAnchor="middle" fontSize={9} fill="var(--color-ink-soft)" fontFamily="var(--font-sans)" className="tabular">
            {pct(m.ausentesSinAviso / m.ofrecidos)} aus.
          </text>
        </g>
      ))}
    </svg>
  );
}
