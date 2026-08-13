'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CarrilDeriva } from '@/components/CarrilDeriva';
import { GraficoEscenarios, TablaResumen } from '@/components/GraficoEscenarios';
import { PanelAlertas } from '@/components/PanelAlertas';
import { PanelOptimizacion } from '@/components/PanelOptimizacion';
import { TiraMetricas } from '@/components/TiraMetricas';
import { VistaPaciente } from '@/components/VistaPaciente';
import { VistaRed, construirFilas } from '@/components/VistaRed';
import { generarAlertas, type Alerta } from '@/lib/alertas';
import {
  JORNADA,
  formatoHora,
  puedeTransicionar,
  type Minutos,
  type Turno,
} from '@/lib/domain';
import { compararEscenarios } from '@/lib/escenarios';
import { calcularMetricas, estadoPorConsultorio } from '@/lib/metricas';
import { planificar } from '@/lib/optimizador';
import { generarRed, proyectar, type TurnoPlan } from '@/lib/seed';

/** Hora de arranque de la demo: media mañana, con el día ya desordenado. */
const HORA_INICIAL: Minutos = 11 * 60 + 20;

/**
 * Intervención manual sobre el día.
 *
 * DECISIÓN: una acción no fija el estado, REESCRIBE EL PLAN, y después se
 * re-proyecta a la hora actual como cualquier otro turno. Por eso el reloj
 * puede seguir corriendo (o retrocederse) después de intervenir sin que el
 * tablero quede incoherente — que es lo que rompe en un mockup.
 */
interface Ajuste {
  inicioA?: Minutos;
  ausente?: boolean;
  /** El paciente avisó que no viene: el turno se libera. */
  cancelado?: boolean;
  /** Reasignación a otro consultorio de la misma especialidad. */
  consultorioId?: string;
}

type Vista = 'red' | 'sede' | 'escenarios' | 'paciente';

function aplicarAjuste(p: TurnoPlan, aj: Ajuste | undefined, ahora: Minutos): Turno {
  if (!aj) return proyectar(p, ahora);

  if (aj.ausente) {
    return proyectar({ ...p, desenlace: 'ausente', marcadoAusenteA: p.agendadoA }, ahora);
  }

  /* Avisar no es lo mismo que faltar: el turno se libera y puede reasignarse
   * a la lista de espera. Colapsar ambos casos haría imposible medir —y
   * cobrar— el efecto de los recordatorios. */
  if (aj.cancelado) {
    return proyectar({ ...p, desenlace: 'cancelado', canceladoA: ahora }, ahora);
  }

  const base: TurnoPlan = aj.consultorioId
    ? { ...p, consultorioId: aj.consultorioId }
    : p;

  if (aj.inicioA !== undefined) {
    return proyectar(
      {
        ...base,
        desenlace: 'atendido',
        checkInA: base.checkInA ?? base.agendadoA,
        inicioA: aj.inicioA,
        finA: aj.inicioA + base.duracionAgendada,
      },
      ahora,
    );
  }
  return proyectar(base, ahora);
}

export default function Tablero() {
  const red = useMemo(() => generarRed(), []);
  const [vista, setVista] = useState<Vista>('red');
  const [sedeId, setSedeId] = useState(red.sedes[0].id);
  const [ahora, setAhora] = useState<Minutos>(HORA_INICIAL);
  const [corriendo, setCorriendo] = useState(true);
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [planAplicado, setPlanAplicado] = useState(false);
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());

  // Reloj de la simulación: 1 minuto clínico cada 600 ms.
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => {
      setAhora((t) => (t >= JORNADA.cierre ? JORNADA.apertura : t + 1));
    }, 600);
    return () => clearInterval(id);
  }, [corriendo]);

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

  /* Los escenarios reejecutan la jornada completa cuatro veces (~60 ms).
   * Se calculan al abrir la pestaña y no dependen del reloj ni de las
   * intervenciones: son la proyección del día entero, no el estado de ahora. */
  const resumenes = useMemo(
    () => (vista === 'escenarios' ? compararEscenarios() : []),
    [vista],
  );

  // Vista de red: se proyectan las ocho sedes con los mismos ajustes.
  const filasRed = useMemo(() => {
    if (vista !== 'red') return [];
    const porSede = new Map<string, Turno[]>();
    for (const s of red.sedes) {
      porSede.set(
        s.id,
        red.planes
          .filter((p) => p.sedeId === s.id)
          .map((p) => aplicarAjuste(p, ajustes[p.id], ahora)),
      );
    }
    return construirFilas(red.sedes, porSede, ahora);
  }, [vista, red.sedes, red.planes, ajustes, ahora]);

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
        setAjustes((prev) => ({ ...prev, [turno.id]: { inicioA: ahora } }));
        return;
      }
      if (turno && a.tipo === 'riesgo_ausencia') {
        if (!puedeTransicionar(turno.estado, 'ausente')) return;
        setAjustes((prev) => ({ ...prev, [turno.id]: { ausente: true } }));
        return;
      }
      setDescartadas((prev) => new Set(prev).add(a.id));
    },
    [ahora, turnos],
  );

  /* Qué turnos movió el plan, para poder deshacer SOLO eso.
   * Las intervenciones manuales del operador (llamar, marcar ausente) no son
   * parte del plan y no se pierden al deshacerlo. */
  const [movidosPorPlan, setMovidosPorPlan] = useState<string[]>([]);

  const aplicarPlan = useCallback(() => {
    const aplicables = plan.reasignaciones.filter((r) => {
      const t = turnos.find((x) => x.id === r.turnoId);
      // Un paciente que recepción ya marcó ausente no vuelve a la cola.
      return t !== undefined && t.estado === 'en_espera';
    });

    setAjustes((prev) => {
      const siguiente = { ...prev };
      for (const r of aplicables) {
        siguiente[r.turnoId] = {
          ...prev[r.turnoId],
          consultorioId: r.haciaConsultorio,
          inicioA: r.inicioConPlan,
        };
      }
      return siguiente;
    });
    setMovidosPorPlan(aplicables.map((r) => r.turnoId));
    setPlanAplicado(true);
  }, [plan, turnos]);

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

  const deshacerPlan = useCallback(() => {
    setAjustes((prev) => {
      const siguiente = { ...prev };
      for (const id of movidosPorPlan) delete siguiente[id];
      return siguiente;
    });
    setMovidosPorPlan([]);
    setPlanAplicado(false);
  }, [movidosPorPlan]);

  const sede = red.sedes.find((s) => s.id === sedeId)!;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Cadencia
            </span>
            <nav className="flex rounded-xs border border-rule" aria-label="Vista">
              {(
                [
                  ['red', `Red · ${red.sedes.length} sedes`],
                  ['sede', sede.nombre],
                  ['paciente', 'Paciente'],
                  ['escenarios', 'Escenarios'],
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
        {vista === 'escenarios' ? (
          <>
            <h1 className="sr-only">Comparación de escenarios</h1>
            {resumenes.length === 0 ? (
              <p className="rounded-sm border border-rule bg-surface px-4 py-8 text-[0.875rem] text-ink-soft">
                Simulando la jornada bajo cada política…
              </p>
            ) : (
              <>
                <TablaResumen resumenes={resumenes} />
                <GraficoEscenarios resumenes={resumenes} />
              </>
            )}
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
            />
          </>
        ) : vista === 'red' ? (
          <>
            <h1 className="sr-only">Red completa — {formatoHora(ahora)}</h1>
            <VistaRed
              filas={filasRed}
              ahora={ahora}
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
              aplicado={planAplicado}
              onAplicar={aplicarPlan}
              onDeshacer={deshacerPlan}
            />
            <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
              <CarrilDeriva consultorios={consultorios} turnos={turnos} ahora={ahora} />
              <PanelAlertas alertas={alertas} onEjecutar={ejecutar} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
