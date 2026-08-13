'use client';

/**
 * LA CARA AL PACIENTE — dos superficies, no una.
 *
 * El objetivo del brief pide "visibilidad en tiempo real para staff Y
 * pacientes". Pero "el paciente" no es un solo contexto:
 *
 *  · EL TELÉFONO es privado y autenticado. Puede mostrar nombre, especialidad
 *    y profesional, y es donde el paciente CONFIRMA o AVISA que no viene —
 *    la palanca que baja las ausencias, sin la cual la fase 2 del plan no
 *    tiene por dónde ejecutarse.
 *
 *  · LA PANTALLA DE SALA es pública y se lee a cinco metros. Va en oscuro y
 *    con tipografía grande porque es otro dispositivo en otro contexto, y
 *    NUNCA muestra nombres: mostrar "María Gómez — Endocrinología" le revela
 *    la condición de salud de una persona identificada a toda la sala.
 *    Ley 25.326, arts. 2 y 7: los datos de salud son sensibles.
 */

import { useMemo } from 'react';
import {
  formatoHora,
  severidadDeEspera,
  type Minutos,
  type Turno,
} from '@/lib/domain';
import { asignarCodigos, estimar, type Estimacion } from '@/lib/estimacion';

const nombreConsultorio = (id: string) => `Consultorio ${id.split('-c')[1] ?? id}`;

interface Props {
  turnos: readonly Turno[];
  turnoSeleccionado?: Turno;
  ahora: Minutos;
  sedeNombre: string;
  onSeleccionar: (turnoId: string) => void;
  onConfirmar: (turnoId: string) => void;
  onCancelar: (turnoId: string) => void;
  confirmados: ReadonlySet<string>;
}

export function VistaPaciente({
  turnos,
  turnoSeleccionado,
  ahora,
  sedeNombre,
  onSeleccionar,
  onConfirmar,
  onCancelar,
  confirmados,
}: Props) {
  const enSala = turnos.filter((t) => t.estado === 'en_espera');

  /* El selector lista a quien puede esperar, PERO siempre incluye al que se
   * está mostrando aunque ya no califique —recién cancelado, o pasado a
   * consulta por el reloj—. Si no, el control queda en blanco mientras el
   * panel de abajo sigue mostrando a esa persona, y control y contenido se
   * contradicen justo después de tocar "No voy a poder ir". */
  const elegibles = turnos.filter(
    (t) => t.estado === 'en_espera' || t.estado === 'agendado',
  );
  const candidatos = useMemo(() => {
    const base = elegibles.slice(0, 40);
    if (turnoSeleccionado && !base.some((t) => t.id === turnoSeleccionado.id)) {
      return [turnoSeleccionado, ...base];
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnos, turnoSeleccionado]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <Telefono
        turnos={turnos}
        turno={turnoSeleccionado}
        candidatos={candidatos}
        ahora={ahora}
        sedeNombre={sedeNombre}
        onSeleccionar={onSeleccionar}
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
        confirmado={
          turnoSeleccionado ? confirmados.has(turnoSeleccionado.id) : false
        }
      />
      <PantallaSala
        turnos={turnos}
        enSala={enSala}
        ahora={ahora}
        sedeNombre={sedeNombre}
      />
    </div>
  );
}

/* ── Teléfono del paciente ────────────────────────────────────────────────── */

function Telefono({
  turnos,
  turno,
  candidatos,
  ahora,
  sedeNombre,
  onSeleccionar,
  onConfirmar,
  onCancelar,
  confirmado,
}: {
  turnos: readonly Turno[];
  turno?: Turno;
  candidatos: readonly Turno[];
  ahora: Minutos;
  sedeNombre: string;
  onSeleccionar: (id: string) => void;
  onConfirmar: (id: string) => void;
  onCancelar: (id: string) => void;
  confirmado: boolean;
}) {
  const estimacion = turno ? estimar(turno, turnos, ahora) : null;
  /* El mismo código que aparece en la pantalla de sala: el paciente tiene que
     poder cruzar las dos superficies sin preguntarle a nadie. */
  const codigos = useMemo(() => asignarCodigos(turnos), [turnos]);
  const codigo = turno ? codigos.get(turno.id) : undefined;

  return (
    <section className="rounded-sm border border-rule bg-surface">
      <header className="border-b border-rule px-4 py-3">
        <p className="eyebrow">Lo que ve el paciente en su teléfono</p>
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          Su turno, en vivo
        </h2>
        <label className="mt-2 block">
          <span className="sr-only">Elegir paciente</span>
          <select
            value={turno?.id ?? ''}
            onChange={(e) => onSeleccionar(e.target.value)}
            className="w-full rounded-xs border border-rule bg-surface px-2 py-1.5 text-[0.8125rem] text-ink"
          >
            {candidatos.length === 0 && <option value="">Nadie esperando</option>}
            {candidatos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.paciente.nombre} — {formatoHora(t.agendadoA)}
                {t.estado === 'cancelado' && ' (avisó que no viene)'}
                {t.estado === 'en_consulta' && ' (en consulta)'}
              </option>
            ))}
          </select>
        </label>
      </header>

      {!turno ? (
        <p className="px-4 py-8 text-[0.875rem] text-ink-soft">
          Elegí un paciente para ver su pantalla.
        </p>
      ) : !estimacion ? (
        /* Con el reloj corriendo, el paciente elegido pasa a consulta o
         * termina en medio de la demo. Dejar la pantalla en blanco haría
         * parecer que se rompió: se muestra su estado actual. */
        <div className="px-4 py-8">
          <p className="text-center text-[0.9375rem] font-semibold text-ink">
            {turno.paciente.nombre}
          </p>
          <p className="mt-1 text-center text-[0.875rem] text-ink-soft">
            {turno.estado === 'en_consulta'
              ? `En consulta desde las ${formatoHora(turno.inicioA ?? 0)}.`
              : turno.estado === 'finalizado'
                ? `Consulta finalizada a las ${formatoHora(turno.finA ?? 0)}.`
                : turno.estado === 'cancelado'
                  ? 'Avisó que no venía. El turno quedó liberado.'
                  : 'No se presentó ni avisó.'}
          </p>
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Marco de teléfono: deja claro que es otra superficie, no una
              sección más del tablero de la clínica. */}
          <div className="mx-auto max-w-[19rem] rounded-[1.75rem] border-[6px] border-ink bg-ground p-3 shadow-sm">
            <p className="text-center text-[0.625rem] font-semibold uppercase tracking-widest text-ink-faint">
              Cadencia
            </p>

            <div className="mt-3 rounded-sm bg-surface p-3">
              <p className="text-[0.6875rem] text-ink-soft">
                {sedeNombre} · {turno.especialidad}
              </p>
              <p className="mt-0.5 text-[0.9375rem] font-semibold text-ink">
                {turno.paciente.nombre}
              </p>

              <Ventana estimacion={estimacion} agendado={turno.agendadoA} />

              {/* El código va en su propia fila y destacado: es lo que el
                  paciente busca en la pantalla de la sala. Con tres columnas
                  en el ancho de un teléfono las etiquetas se encimaban. */}
              <div className="mt-3 flex items-center justify-between rounded-sm bg-ground px-2.5 py-2">
                <span className="eyebrow text-[0.5625rem]">Tu código</span>
                <span className="tabular font-display text-lg font-semibold text-ink">
                  {codigo ?? '—'}
                </span>
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-rule pt-3">
                <div>
                  <dt className="eyebrow text-[0.5625rem]">Consultorio</dt>
                  <dd className="text-[0.8125rem] font-semibold text-ink">
                    {nombreConsultorio(turno.consultorioId)}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-[0.5625rem]">Por delante</dt>
                  <dd className="tabular text-[0.8125rem] font-semibold text-ink">
                    {estimacion.porDelante}{' '}
                    {estimacion.porDelante === 1 ? 'paciente' : 'pacientes'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Confirmar / avisar: ESTA es la palanca que baja las ausencias.
                Sin este par de botones, la fase 2 del plan no tiene cómo
                ejecutarse — y avisar vale más que asistir, porque libera
                el turno con tiempo para la lista de espera. */}
            {turno.estado === 'agendado' && (
              <div className="mt-3 space-y-2">
                {confirmado ? (
                  <p className="rounded-sm bg-sev-normal-bg px-3 py-2 text-center text-[0.75rem] font-semibold text-sev-normal">
                    Asistencia confirmada. Gracias.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConfirmar(turno.id)}
                    className="w-full rounded-sm bg-accent px-3 py-2.5 text-[0.8125rem] font-semibold text-white transition hover:brightness-110"
                  >
                    Confirmo que voy
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onCancelar(turno.id)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-[0.75rem] font-semibold text-ink-soft transition hover:text-ink"
                >
                  No voy a poder ir
                </button>
                <p className="px-1 text-center text-[0.625rem] leading-snug text-ink-faint">
                  Avisar libera el turno para alguien de la lista de espera.
                </p>
              </div>
            )}

            {turno.estado === 'en_espera' && (
              <p className="mt-3 rounded-sm bg-accent-soft px-3 py-2 text-center text-[0.75rem] font-semibold text-accent">
                Estás en sala. Te avisamos cuando sea tu turno.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** La ventana estimada, no una hora exacta. */
function Ventana({
  estimacion,
  agendado,
}: {
  estimacion: Estimacion;
  agendado: Minutos;
}) {
  const sev = severidadDeEspera(Math.max(0, estimacion.desvio));
  const color =
    sev === 'critica'
      ? 'text-sev-critica'
      : sev === 'moderada'
        ? 'text-sev-moderada'
        : sev === 'leve'
          ? 'text-sev-leve'
          : 'text-sev-normal';

  return (
    <div className="mt-3">
      <p className="eyebrow text-[0.5625rem]">Te atendemos entre</p>
      <p className={`tabular font-display text-2xl font-semibold ${color}`}>
        {formatoHora(estimacion.desde)} y {formatoHora(estimacion.hasta)}
      </p>

      {estimacion.desvio > 5 ? (
        // Decirlo antes de que lo note. El desvío ya existe: ocultarlo solo
        // cambia el momento en que el paciente se entera, y empeora la reacción.
        <p className="mt-1 text-[0.6875rem] leading-snug text-ink-soft">
          Tu turno era {formatoHora(agendado)}. Vamos{' '}
          <strong className="font-semibold text-ink">
            {Math.round(estimacion.desvio)} minutos
          </strong>{' '}
          demorados y lo lamentamos.
        </p>
      ) : (
        <p className="mt-1 text-[0.6875rem] text-ink-soft">
          Tu turno de {formatoHora(agendado)} está en horario.
        </p>
      )}

      <p className="mt-1.5 text-[0.625rem] text-ink-faint">
        Estimación de confianza {estimacion.confianza}
        {estimacion.confianza !== 'alta' &&
          ' — se actualiza sola a medida que avanza la agenda'}
        .
      </p>
    </div>
  );
}

/* ── Pantalla de sala de espera ──────────────────────────────────────────── */

function PantallaSala({
  turnos,
  enSala,
  ahora,
  sedeNombre,
}: {
  turnos: readonly Turno[];
  enSala: readonly Turno[];
  ahora: Minutos;
  sedeNombre: string;
}) {
  const codigos = useMemo(() => asignarCodigos(turnos), [turnos]);

  const llamando = turnos
    .filter((t) => t.estado === 'en_consulta' && t.inicioA !== undefined)
    .sort((a, b) => (b.inicioA ?? 0) - (a.inicioA ?? 0))
    .slice(0, 3);

  const proximos = [...enSala]
    .sort((a, b) => a.agendadoA - b.agendadoA)
    .slice(0, 7);

  return (
    <section className="overflow-hidden rounded-sm border border-rule">
      <header className="flex items-baseline justify-between border-b border-rule bg-surface px-4 py-3">
        <div>
          <p className="eyebrow">Pantalla de sala de espera</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Sin nombres, por diseño
          </h2>
        </div>
        <p className="max-w-[17rem] text-right text-[0.625rem] leading-snug text-ink-faint">
          El vínculo entre una persona y una especialidad ya es un dato de
          salud. Ley 25.326, arts. 2 y 7.
        </p>
      </header>

      {/* Superficie oscura deliberada: es un display de pared que se lee a
          cinco metros, no una pantalla de escritorio. Otro dispositivo,
          otro contraste, otra escala tipográfica. */}
      <div className="bg-[#0f1a26] px-5 py-5 text-white">
        <div className="flex items-baseline justify-between border-b border-white/15 pb-3">
          <p className="font-display text-lg font-semibold">{sedeNombre}</p>
          <p className="tabular text-lg font-semibold">{formatoHora(ahora)}</p>
        </div>

        <p className="mt-4 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/50">
          Pasá al consultorio
        </p>
        {llamando.length === 0 ? (
          <p className="mt-2 text-white/50">Ningún llamado en curso</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {llamando.map((t, i) => (
              <li
                key={t.id}
                className={`flex items-baseline justify-between rounded-sm px-3 py-2 ${
                  i === 0 ? 'bg-white/15' : 'bg-white/5'
                }`}
              >
                <span
                  className={`tabular font-display font-semibold ${i === 0 ? 'text-3xl' : 'text-xl text-white/70'}`}
                >
                  {codigos.get(t.id) ?? '—'}
                </span>
                <span
                  className={`font-semibold ${i === 0 ? 'text-xl' : 'text-base text-white/70'}`}
                >
                  {nombreConsultorio(t.consultorioId)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/50">
          En sala · {enSala.length}
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {proximos.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-2">
              <span className="tabular text-base font-semibold text-white/85">
                {codigos.get(t.id) ?? '—'}
              </span>
              <span className="tabular text-[0.75rem] text-white/45">
                {formatoHora(t.agendadoA)}
              </span>
            </li>
          ))}
        </ul>

        {proximos.length === 0 && (
          <p className="mt-2 text-white/50">Sala vacía</p>
        )}
      </div>
    </section>
  );
}
