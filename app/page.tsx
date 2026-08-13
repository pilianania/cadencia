'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CarrilDeriva } from '@/components/CarrilDeriva';
import { PanelAlertas } from '@/components/PanelAlertas';
import { TiraMetricas } from '@/components/TiraMetricas';
import { generarAlertas } from '@/lib/alertas';
import {
  JORNADA,
  formatoHora,
  puedeTransicionar,
  type Minutos,
  type Turno,
} from '@/lib/domain';
import { calcularMetricas, estadoPorConsultorio } from '@/lib/metricas';
import { generarRed, proyectar } from '@/lib/seed';
import type { Alerta } from '@/lib/alertas';

/** Hora de arranque de la demo: media mañana, con el día ya desordenado. */
const HORA_INICIAL: Minutos = 11 * 60 + 20;

/**
 * Intervención manual del operador sobre el día.
 *
 * DECISIÓN: una acción no fija el estado, REESCRIBE EL PLAN. Después se
 * re-proyecta a la hora actual como cualquier otro turno. Por eso el reloj
 * puede seguir corriendo (o retrocederse) después de intervenir sin que el
 * tablero quede incoherente — que es exactamente lo que rompe en un mockup.
 */
interface Ajuste {
  inicioA?: Minutos;
  ausente?: boolean;
}

export default function Tablero() {
  const red = useMemo(() => generarRed(), []);
  const [sedeId, setSedeId] = useState(red.sedes[0].id);
  const [ahora, setAhora] = useState<Minutos>(HORA_INICIAL);
  const [corriendo, setCorriendo] = useState(true);
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});

  // Reloj de la simulación: 1 minuto clínico cada 600 ms.
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => {
      setAhora((t) => (t >= JORNADA.cierre ? JORNADA.apertura : t + 1));
    }, 600);
    return () => clearInterval(id);
  }, [corriendo]);

  const turnos: Turno[] = useMemo(() => {
    return red.planes
      .filter((p) => p.sedeId === sedeId)
      .map((p) => {
        const aj = ajustes[p.id];
        if (!aj) return proyectar(p, ahora);

        if (aj.ausente) {
          return proyectar(
            { ...p, desenlace: 'ausente', marcadoAusenteA: p.agendadoA },
            ahora,
          );
        }
        if (aj.inicioA !== undefined) {
          return proyectar(
            {
              ...p,
              desenlace: 'atendido',
              checkInA: p.checkInA ?? p.agendadoA,
              inicioA: aj.inicioA,
              finA: aj.inicioA + p.duracionAgendada,
            },
            ahora,
          );
        }
        return proyectar(p, ahora);
      })
      .sort((a, b) => a.agendadoA - b.agendadoA);
  }, [red.planes, sedeId, ahora, ajustes]);

  const consultorios = useMemo(
    () => red.consultorios.filter((c) => c.sedeId === sedeId),
    [red.consultorios, sedeId],
  );

  const metricas = useMemo(() => calcularMetricas(turnos, ahora), [turnos, ahora]);
  const estados = useMemo(() => estadoPorConsultorio(turnos, ahora), [turnos, ahora]);

  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());
  const alertas = useMemo(
    () => generarAlertas(turnos, estados, ahora).filter((a) => !descartadas.has(a.id)),
    [turnos, estados, ahora, descartadas],
  );

  /**
   * Toda intervención pasa por la máquina de estados antes de aplicarse.
   *
   * No es ceremonia: el tablero se refresca cada 600 ms y las alertas se
   * recalculan con él. Entre que el operador lee una alerta y hace clic, el
   * turno pudo haber cambiado de estado solo. Sin esta guarda, un clic tardío
   * "revive" un turno ya cerrado y el carril queda mostrando algo que no pasó.
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

      // Alertas sin turno asociado (deriva de consultorio): se acusan recibo.
      setDescartadas((prev) => new Set(prev).add(a.id));
    },
    [ahora, turnos],
  );

  const sede = red.sedes.find((s) => s.id === sedeId)!;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Cadencia
            </span>
            <span className="hidden text-[0.8125rem] text-ink-faint sm:inline">
              Red ambulatoria · {red.sedes.length} sedes
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="sede">
              Sede
            </label>
            <select
              id="sede"
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
              className="rounded-xs border border-rule bg-surface px-2.5 py-1.5 text-[0.875rem] font-semibold text-ink"
            >
              {red.sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.localidad}
                </option>
              ))}
            </select>

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
        <div>
          <h1 className="sr-only">
            Agenda del día — {sede.nombre}, {formatoHora(ahora)}
          </h1>
          <TiraMetricas m={metricas} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
          <CarrilDeriva consultorios={consultorios} turnos={turnos} ahora={ahora} />
          <PanelAlertas alertas={alertas} onEjecutar={ejecutar} />
        </div>
      </main>
    </div>
  );
}
