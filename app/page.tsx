'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CarrilDeriva } from '@/components/CarrilDeriva';
import { PanelAlertas } from '@/components/PanelAlertas';
import { PanelOptimizacion, type Oferta } from '@/components/PanelOptimizacion';
import { PanelRecepcion, type AccionRecepcion } from '@/components/PanelRecepcion';
import { TiraMetricas } from '@/components/TiraMetricas';
import { VistaPaciente } from '@/components/VistaPaciente';
import { VistaRed, construirFilas } from '@/components/VistaRed';
import { VistaGerencia } from '@/components/VistaGerencia';
import { generarAlertas, type Alerta } from '@/lib/alertas';
import {
  JORNADA,
  formatoHora,
  puedeTransicionar,
  type Minutos,
  type Turno,
} from '@/lib/domain';
import { indicadoresGerencia } from '@/lib/gerencia';
import { expandir, type DatosCompactos } from '@/lib/periodos';
import datosGerenciaCompactos from '@/data/gerencia.json';
import { calcularMetricas, estadoPorConsultorio } from '@/lib/metricas';
import { planificar, type Reasignacion } from '@/lib/optimizador';
import { generarRed, proyectar, type TurnoPlan } from '@/lib/seed';

/** Hora de arranque de la demo: media mañana, con el día ya desordenado. */
const HORA_INICIAL: Minutos = 11 * 60 + 20;

/** Minutos que tiene el paciente para responder una oferta de cambio. */
const VENTANA_OFERTA: Minutos = 3;

/** Respuesta determinista del paciente simulado: acepta 8 de cada 10. */
function aceptaSimulado(turnoId: string): boolean {
  let h = 0;
  for (let i = 0; i < turnoId.length; i++) h = (h * 31 + turnoId.charCodeAt(i)) >>> 0;
  return h % 10 < 8;
}

/**
 * Intervención manual sobre el día.
 *
 * DECISIÓN: una acción no fija el estado, REESCRIBE EL PLAN, y después se
 * re-proyecta a la hora actual como cualquier otro turno. Por eso el reloj
 * puede seguir corriendo (o retrocederse) después de intervenir sin que el
 * tablero quede incoherente — que es lo que rompe en un mockup.
 */
interface Ajuste {
  /** Recepción registró la llegada a mano. */
  checkInA?: Minutos;
  inicioA?: Minutos;
  ausente?: boolean;
  /** Cuándo recepción lo marcó ausente; si ya había llegado, cuenta como que esperó hasta ahí. */
  ausenteDesde?: Minutos;
  /** El paciente avisó que no viene: el turno se libera. */
  cancelado?: boolean;
  /** Reasignación a otro consultorio de la misma especialidad. */
  consultorioId?: string;
}

type Vista = 'red' | 'sede' | 'paciente';
/** Red y Sede tienen dos alcances: lo que pasa hoy, y los indicadores por período. */
type Alcance = 'hoy' | 'periodo';

function aplicarAjuste(p: TurnoPlan, aj: Ajuste | undefined, ahora: Minutos): Turno {
  if (!aj) return proyectar(p, ahora);

  if (aj.ausente) {
    const marcado = aj.ausenteDesde ?? p.agendadoA;
    return proyectar(
      { ...p, desenlace: 'ausente', marcadoAusenteA: marcado, checkInA: aj.checkInA ?? p.checkInA },
      ahora,
    );
  }

  /* Avisar no es lo mismo que faltar: el turno se libera y puede reasignarse
   * a la lista de espera. Colapsar ambos casos haría imposible medir —y
   * cobrar— el efecto de los recordatorios. */
  if (aj.cancelado) {
    return proyectar({ ...p, desenlace: 'cancelado', canceladoA: ahora }, ahora);
  }

  const reasignado = aj.consultorioId !== undefined && aj.consultorioId !== p.consultorioId;
  let base: TurnoPlan = reasignado ? { ...p, consultorioId: aj.consultorioId! } : p;

  /* Llegada registrada en el mostrador. Si el generador tenía a este paciente
   * como ausente, la llegada lo desmiente: pasa a la sala y queda ahí hasta
   * que recepción lo pase a consulta (o el plan lo mueva). Si ya tenía una
   * llegada simulada, gana la más temprana. */
  if (aj.checkInA !== undefined) {
    const veniaAusente = base.desenlace !== 'atendido';
    base = {
      ...base,
      desenlace: 'atendido',
      checkInA: Math.min(aj.checkInA, base.checkInA ?? Infinity),
      inicioA: veniaAusente ? undefined : base.inicioA,
      finA: veniaAusente ? undefined : base.finA,
    };
  }

  // El consultorio de origen viaja con el turno: es lo que permite avisarle
  // al paciente que se movió, en lugar de cambiarle la puerta sin decir nada.
  const marca = reasignado ? { reasignadoDesde: p.consultorioId } : {};

  if (aj.inicioA !== undefined) {
    return {
      ...proyectar(
        {
          ...base,
          desenlace: 'atendido',
          checkInA: base.checkInA ?? base.agendadoA,
          inicioA: aj.inicioA,
          finA: aj.inicioA + base.duracionAgendada,
        },
        ahora,
      ),
      ...marca,
    };
  }
  return { ...proyectar(base, ahora), ...marca };
}

export default function Tablero() {
  const red = useMemo(() => generarRed(), []);
  const [vista, setVista] = useState<Vista>('red');
  const [alcance, setAlcance] = useState<Alcance>('hoy');
  const [sedeId, setSedeId] = useState(red.sedes[0].id);
  const [ahora, setAhora] = useState<Minutos>(HORA_INICIAL);
  const [corriendo, setCorriendo] = useState(true);
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());


  const turnos: Turno[] = useMemo(
    () =>
      red.planes
        .filter((p) => p.sedeId === sedeId)
        .map((p) => aplicarAjuste(p, ajustes[p.id], ahora))
        .sort((a, b) => a.agendadoA - b.agendadoA),
    [red.planes, sedeId, ahora, ajustes],
  );

  const consultorios = useMemo(
    () => red.consultorios.filter((c) => c.sedeId === sedeId),
    [red.consultorios, sedeId],
  );

  const metricas = useMemo(() => calcularMetricas(turnos, ahora), [turnos, ahora]);
  const estados = useMemo(() => estadoPorConsultorio(turnos, ahora), [turnos, ahora]);
  const plan = useMemo(
    () => planificar(turnos, consultorios, ahora),
    [turnos, consultorios, ahora],
  );

  const alertas = useMemo(
    () => generarAlertas(turnos, estados, ahora).filter((a) => !descartadas.has(a.id)),
    [turnos, estados, ahora, descartadas],
  );

  // Vista de red: se proyectan las ocho sedes con los mismos ajustes.
  const turnosPorSede = useMemo(() => {
    if (vista !== 'red') return new Map<string, Turno[]>();
    const porSede = new Map<string, Turno[]>();
    for (const s of red.sedes) {
      porSede.set(
        s.id,
        red.planes
          .filter((p) => p.sedeId === s.id)
          .map((p) => aplicarAjuste(p, ajustes[p.id], ahora)),
      );
    }
    return porSede;
  }, [vista, red.sedes, red.planes, ajustes, ahora]);

  const filasRed = useMemo(
    () => (vista === 'red' ? construirFilas(red.sedes, turnosPorSede, ahora) : []),
    [vista, red.sedes, turnosPorSede, ahora],
  );

  const gerencia = useMemo(
    () => indicadoresGerencia(turnosPorSede, ahora),
    [turnosPorSede, ahora],
  );

  /* Vista de gerencia: un año de operación precalculado con `npm run periodos`
   * (semillas deterministas, mismo simulador). Calcularlo en el navegador
   * congelaba la pestaña. */
  const datosGerencia = useMemo(() => expandir(datosGerenciaCompactos as DatosCompactos), []);

  /**
   * Toda intervención pasa por la máquina de estados antes de aplicarse.
   * El tablero se refresca cada 600 ms: entre que el operador lee una alerta
   * y hace clic, el turno pudo haber cambiado solo. Sin esta guarda, un clic
   * tardío "revive" un turno ya cerrado.
   */
  const ejecutar = useCallback(
    (a: Alerta) => {
      const turno = a.turnoId ? turnos.find((t) => t.id === a.turnoId) : undefined;

      if (turno && (a.tipo === 'consultorio_ocioso' || a.tipo === 'espera_excedida')) {
        if (!puedeTransicionar(turno.estado, 'en_consulta')) return;
        setAjustes((prev) => ({ ...prev, [turno.id]: { ...prev[turno.id], inicioA: ahora } }));
        return;
      }
      if (turno && a.tipo === 'riesgo_ausencia') {
        if (!puedeTransicionar(turno.estado, 'ausente')) return;
        setAjustes((prev) => ({ ...prev, [turno.id]: { ...prev[turno.id], ausente: true, ausenteDesde: ahora } }));
        return;
      }
      setDescartadas((prev) => new Set(prev).add(a.id));
    },
    [ahora, turnos],
  );

  /* Qué turnos se movieron por oferta aceptada, para contarlos en el panel. */
  const [movidosPorPlan, setMovidosPorPlan] = useState<string[]>([]);

  /**
   * DECISIÓN DE PRODUCTO: el sistema ofrece y el paciente decide. Reasignar
   * es cambiar de profesional, y si al paciente le importa la continuidad
   * solo él lo sabe. Las ofertas salen solas, sin que recepción las apruebe,
   * y cada paciente la acepta o la rechaza desde su teléfono. Sin respuesta
   * en la ventana, cuenta como rechazo y el lugar pasa al siguiente. Los
   * turnos marcados como no reasignables no entran al motor (en el prototipo
   * no hay ninguno marcado).
   *
   * En la demo, si nadie responde desde la vista de paciente, el paciente
   * simulado contesta solo a los VENTANA_OFERTA minutos: acepta 8 de cada 10.
   */
  const [ofertas, setOfertas] = useState<Record<string, Oferta>>({});
  const [rechazadas, setRechazadas] = useState<Set<string>>(new Set());

  /* La oferta se aplica solo si el turno sigue esperando: entre que salió y
   * que se acepta, recepción pudo pasarlo a consulta o marcarlo ausente. Y el
   * inicio nunca queda en el pasado: si la aceptación llega después de la hora
   * prometida, se arranca ahora. La oferta se retira en cualquier caso. */
  const aplicarMovimiento = useCallback((r: Reasignacion, turnosAhora: readonly Turno[], hora: Minutos) => {
    const turno = turnosAhora.find((t) => t.id === r.turnoId);
    if (turno && puedeTransicionar(turno.estado, 'en_consulta')) {
      setAjustes((prev) => ({
        ...prev,
        [r.turnoId]: {
          ...prev[r.turnoId],
          consultorioId: r.haciaConsultorio,
          inicioA: Math.max(r.inicioConPlan, hora),
        },
      }));
      setMovidosPorPlan((prev) => (prev.includes(r.turnoId) ? prev : [...prev, r.turnoId]));
    }
    setOfertas((prev) => {
      const sig = { ...prev };
      delete sig[r.turnoId];
      return sig;
    });
  }, []);

  const rechazarOferta = useCallback((turnoId: string) => {
    setOfertas((prev) => {
      const sig = { ...prev };
      delete sig[turnoId];
      return sig;
    });
    setRechazadas((prev) => new Set(prev).add(turnoId));
  }, []);

  /* El panel muestra solo las ofertas de la sede que se está mirando. */
  const ofertasSede = useMemo(
    () => Object.fromEntries(Object.entries(ofertas).filter(([id]) => turnos.some((t) => t.id === id))),
    [ofertas, turnos],
  );

  /* El reloj lee el último estado por ref para no re-armar el intervalo en
   * cada render. */
  const ultimo = useRef({ ahora, plan, turnos, ofertas, rechazadas, aplicarMovimiento, rechazarOferta });
  useEffect(() => {
    ultimo.current = { ahora, plan, turnos, ofertas, rechazadas, aplicarMovimiento, rechazarOferta };
  });

  /* Reloj de la simulación: 1 minuto clínico cada 600 ms. En cada minuto,
   * además de avanzar la hora, las ofertas salen solas (cada movimiento del
   * plan que todavía no se ofreció ni se rechazó le llega al paciente) y el
   * paciente simulado responde las que vencieron su ventana. */
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => {
      setAhora((t) => (t >= JORNADA.cierre ? JORNADA.apertura : t + 1));
      const u = ultimo.current;
      /* Al dar la vuelta al día, las ofertas y respuestas del día anterior no
       * valen: si quedaran, una oferta de las 17:58 seguiría "pendiente" toda
       * la jornada siguiente. */
      if (u.ahora >= JORNADA.cierre) {
        setOfertas({});
        setRechazadas(new Set());
        setMovidosPorPlan([]);
        return;
      }

      const nuevas = u.plan.reasignaciones.filter((r) => {
        const t = u.turnos.find((x) => x.id === r.turnoId);
        return (
          t !== undefined &&
          t.estado === 'en_espera' &&
          !u.ofertas[r.turnoId] &&
          !u.rechazadas.has(r.turnoId)
        );
      });
      if (nuevas.length > 0) {
        setOfertas((prev) => {
          const sig = { ...prev };
          for (const r of nuevas) sig[r.turnoId] = { ...r, ofrecidaEn: u.ahora };
          return sig;
        });
      }

      for (const o of Object.values(u.ofertas)) {
        if (u.ahora - o.ofrecidaEn < VENTANA_OFERTA) continue;
        if (aceptaSimulado(o.turnoId)) u.aplicarMovimiento(o, u.turnos, u.ahora);
        else u.rechazarOferta(o.turnoId);
      }
    }, 600);
    return () => clearInterval(id);
  }, [corriendo]);

  const aceptarOferta = useCallback(
    (turnoId: string) => {
      const r = ofertas[turnoId];
      if (r) aplicarMovimiento(r, turnos, ahora);
    },
    [ofertas, aplicarMovimiento, turnos, ahora],
  );

  /* Vista de paciente: a quién le estamos mirando la pantalla, y quiénes
   * confirmaron asistencia. */
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [confirmados, setConfirmados] = useState<Set<string>>(new Set());

  const turnoPaciente = useMemo(() => {
    const elegido = pacienteId ? turnos.find((t) => t.id === pacienteId) : undefined;
    if (elegido) return elegido;
    /* Sin selección explícita se muestra a quien más está esperando, porque
     * es el caso que importa. Si la sala está vacía se cae al próximo turno
     * agendado: el selector ofrece ambos estados, y quedarse solo con los que
     * esperan dejaba el teléfono en blanco con una opción elegida arriba. */
    const porHora = (a: Turno, b: Turno) => a.agendadoA - b.agendadoA;
    return (
      turnos.filter((t) => t.estado === 'en_espera').sort(porHora)[0] ??
      turnos.filter((t) => t.estado === 'agendado').sort(porHora)[0]
    );
  }, [pacienteId, turnos]);

  const confirmar = useCallback((id: string) => {
    setConfirmados((prev) => new Set(prev).add(id));
  }, []);

  const cancelar = useCallback((id: string) => {
    setAjustes((prev) => ({ ...prev, [id]: { ...prev[id], cancelado: true } }));
  }, []);

  /* Acciones del mostrador. Pasan por la misma máquina de estados que las
   * alertas: si el turno cambió solo entre que recepción miró y tocó, el clic
   * no hace nada en vez de romper la coherencia del día. */
  const accionRecepcion = useCallback(
    (turnoId: string, accion: AccionRecepcion) => {
      const turno = turnos.find((t) => t.id === turnoId);
      if (!turno) return;
      switch (accion) {
        case 'llego':
          if (!puedeTransicionar(turno.estado, 'en_espera')) return;
          setAjustes((prev) => ({ ...prev, [turnoId]: { ...prev[turnoId], checkInA: ahora } }));
          return;
        case 'pasar':
          if (!puedeTransicionar(turno.estado, 'en_consulta')) return;
          setAjustes((prev) => ({ ...prev, [turnoId]: { ...prev[turnoId], inicioA: ahora } }));
          return;
        case 'aviso':
          if (!puedeTransicionar(turno.estado, 'cancelado')) return;
          setAjustes((prev) => ({ ...prev, [turnoId]: { ...prev[turnoId], cancelado: true } }));
          return;
        case 'no_vino':
          if (!puedeTransicionar(turno.estado, 'ausente')) return;
          setAjustes((prev) => ({ ...prev, [turnoId]: { ...prev[turnoId], ausente: true, ausenteDesde: ahora } }));
          return;
      }
    },
    [turnos, ahora],
  );

  const sede = red.sedes.find((s) => s.id === sedeId)!;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Cadencia
            </span>
            {/* La propuesta escrita vive en el mismo sitio: quien evalúa tiene que
                poder ir y volver sin que nadie le explique dónde está cada cosa. */}
            <a
              href="/propuesta.html"
              target="_blank"
              rel="noopener"
              className="rounded-xs border border-accent/40 px-2.5 py-1.5 text-[0.8125rem] font-semibold text-accent transition hover:bg-accent-soft"
            >
              Propuesta escrita
            </a>
            <nav className="flex rounded-xs border border-rule" aria-label="Vista">
              {(
                [
                  ['red', `Red · ${red.sedes.length} sedes`],
                  ['sede', 'Sede'],
                  ['paciente', 'Paciente'],
                ] as const
              ).map(([v, rotulo]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVista(v)}
                  aria-current={vista === v ? 'page' : undefined}
                  className={`px-2.5 py-1.5 text-[0.8125rem] font-semibold transition ${
                    vista === v
                      ? 'bg-ink text-white'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(vista === 'red' || vista === 'sede') && (
              <nav className="flex rounded-xs border border-rule" aria-label="Alcance">
                {(
                  [
                    ['hoy', 'Hoy'],
                    ['periodo', 'Por período'],
                  ] as const
                ).map(([a, rotulo]) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlcance(a)}
                    aria-current={alcance === a ? 'page' : undefined}
                    className={`px-2.5 py-1.5 text-[0.8125rem] font-semibold transition ${
                      alcance === a ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </nav>
            )}
            {(vista === 'sede' || vista === 'paciente') && (
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                aria-label="Sede"
                className="rounded-xs border border-rule bg-surface px-2.5 py-1.5 text-[0.875rem] font-semibold text-ink"
              >
                {red.sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {s.localidad}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2 rounded-xs border border-rule px-2.5 py-1.5">
              <span className="tabular text-[0.875rem] font-semibold text-ink">
                {formatoHora(ahora)}
              </span>
              <button
                type="button"
                onClick={() => setCorriendo((c) => !c)}
                className="text-[0.75rem] font-semibold text-accent"
                aria-pressed={corriendo}
              >
                {corriendo ? 'Pausar' : 'Reanudar'}
              </button>
            </div>

            <input
              type="range"
              min={JORNADA.apertura}
              max={JORNADA.cierre}
              value={ahora}
              onChange={(e) => {
                setCorriendo(false);
                setAhora(Number(e.target.value));
              }}
              className="w-32 accent-[#17457a]"
              aria-label="Mover la hora de la jornada"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-4 px-4 py-4">
        {vista !== 'paciente' && alcance === 'periodo' ? (
          <>
            <h1 className="sr-only">
              Indicadores por período · {vista === 'red' ? 'red completa' : sede.nombre}
            </h1>
            <VistaGerencia
              datos={datosGerencia}
              sedeId={vista === 'sede' ? sede.id : undefined}
              sedeNombre={vista === 'sede' ? sede.nombre : undefined}
            />
          </>
        ) : vista === 'paciente' ? (
          <>
            <h1 className="sr-only">
              Vista del paciente — {sede.nombre}, {formatoHora(ahora)}
            </h1>
            <VistaPaciente
              turnos={turnos}
              turnoSeleccionado={turnoPaciente}
              ahora={ahora}
              sedeNombre={sede.nombre}
              onSeleccionar={setPacienteId}
              onConfirmar={confirmar}
              onCancelar={cancelar}
              confirmados={confirmados}
              oferta={turnoPaciente ? ofertas[turnoPaciente.id] : undefined}
              onAceptarOferta={aceptarOferta}
              onRechazarOferta={rechazarOferta}
            />
          </>
        ) : vista === 'red' ? (
          <>
            <h1 className="sr-only">Red completa — {formatoHora(ahora)}</h1>
            <VistaRed
              filas={filasRed}
              ahora={ahora}
              gerencia={gerencia}
              onAbrirSede={(id) => {
                setSedeId(id);
                setVista('sede');
              }}
            />
          </>
        ) : (
          <>
            <h1 className="sr-only">
              Agenda del día — {sede.nombre}, {formatoHora(ahora)}
            </h1>
            <TiraMetricas m={metricas} />
            <PanelOptimizacion
              plan={plan}
              ofertas={ofertasSede}
              movidos={movidosPorPlan.length}
              rechazadas={rechazadas.size}
            />
            <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
              <PanelRecepcion
                turnos={turnos}
                consultorios={consultorios}
                profesionales={red.profesionales}
                ahora={ahora}
                onAccion={accionRecepcion}
              />
              <PanelAlertas alertas={alertas} onEjecutar={ejecutar} />
            </div>
            <CarrilDeriva consultorios={consultorios} turnos={turnos} ahora={ahora} />
          </>
        )}
      </main>
    </div>
  );
}
