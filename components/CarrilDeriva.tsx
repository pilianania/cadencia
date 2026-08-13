'use client';

/**
 * CARRIL DE DERIVA — elemento central del tablero.
 *
 * TESIS DE DISEÑO (esto es lo que se defiende):
 * Un dashboard de turnos suele abrir con tarjetas de KPIs. Una tarjeta que
 * dice "espera promedio: 45 min" informa el síntoma y esconde la causa.
 *
 * Acá el eje horizontal es el tiempo real de la jornada. Cada turno se dibuja
 * DOS veces: el contorno punteado es la hora que se le prometió al paciente,
 * el bloque sólido es lo que efectivamente pasó. La distancia entre ambos es
 * la espera, a escala.
 *
 * Eso hace visible la CASCADA: una consulta larga a las 09:10 empuja
 * horizontalmente todo lo que viene después. El operador no ve un número
 * malo, ve de dónde salió y dónde cortarlo. Es el argumento visual de toda
 * la propuesta.
 */

import { useMemo, useState } from 'react';
import {
  JORNADA,
  agruparPorConsultorio,
  derivaMinutos,
  esperaMinutos,
  formatoDelta,
  formatoHora,
  severidadDeEspera,
  type Consultorio,
  type Minutos,
  type Severidad,
  type Turno,
} from '@/lib/domain';

const VENTANA = JORNADA.cierre - JORNADA.apertura;
const pos = (m: Minutos) => ((m - JORNADA.apertura) / VENTANA) * 100;

const TRAZO: Record<Severidad, string> = {
  normal: 'bg-sev-normal',
  leve: 'bg-sev-leve',
  moderada: 'bg-sev-moderada',
  critica: 'bg-sev-critica',
};

const TEXTO: Record<Severidad, string> = {
  normal: 'text-sev-normal',
  leve: 'text-sev-leve',
  moderada: 'text-sev-moderada',
  critica: 'text-sev-critica',
};

interface Props {
  consultorios: readonly Consultorio[];
  turnos: readonly Turno[];
  ahora: Minutos;
}

interface Detalle {
  turno: Turno;
  espera?: number;
  deriva: number;
}

export function CarrilDeriva({ consultorios, turnos, ahora }: Props) {
  const [detalle, setDetalle] = useState<Detalle | null>(null);

  const porConsultorio = useMemo(() => agruparPorConsultorio(turnos), [turnos]);

  const horas = useMemo(() => {
    const xs: number[] = [];
    for (let h = JORNADA.apertura; h <= JORNADA.cierre; h += 60) xs.push(h);
    return xs;
  }, []);

  return (
    <section className="rounded-sm border border-rule bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <p className="eyebrow">Carril de deriva</p>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Agenda prometida contra agenda real
          </h2>
        </div>
        <Leyenda />
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[52rem] px-4 pb-4 pt-3">
          {/* Eje horario */}
          <div className="relative mb-2 ml-28 h-5 border-b border-rule">
            {horas.map((h) => (
              <span
                key={h}
                className="tabular absolute -translate-x-1/2 text-[0.6875rem] text-ink-faint"
                style={{ left: `${pos(h)}%` }}
              >
                {formatoHora(h)}
              </span>
            ))}
          </div>

          <div className="relative">
            {/* Línea AHORA: única pieza animada de la pantalla. */}
            {ahora >= JORNADA.apertura && ahora <= JORNADA.cierre && (
              <div
                className="pointer-events-none absolute inset-y-0 z-20 ml-28 w-px"
                style={{ left: `calc(${pos(ahora)}% - 0.5px)` }}
              >
                <div className="latido h-full w-px bg-accent" />
                <span className="tabular absolute -top-[1.4rem] left-1/2 -translate-x-1/2 rounded-xs bg-accent px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                  {formatoHora(ahora)}
                </span>
              </div>
            )}

            {consultorios.map((c) => (
              <Carril
                key={c.id}
                consultorio={c}
                turnos={porConsultorio.get(c.id) ?? []}
                ahora={ahora}
                onSeleccionar={setDetalle}
              />
            ))}
          </div>
        </div>
      </div>

      {detalle && <FichaTurno detalle={detalle} onCerrar={() => setDetalle(null)} />}
    </section>
  );
}

function Carril({
  consultorio,
  turnos,
  ahora,
  onSeleccionar,
}: {
  consultorio: Consultorio;
  turnos: readonly Turno[];
  ahora: Minutos;
  onSeleccionar: (d: Detalle) => void;
}) {
  return (
    <div className="flex items-stretch border-b border-rule/60 last:border-b-0">
      <div className="flex w-28 shrink-0 flex-col justify-center py-2 pr-3">
        <span className="text-[0.8125rem] font-semibold leading-tight text-ink">
          {consultorio.nombre}
        </span>
      </div>

      <div className="relative h-11 flex-1">
        {turnos.map((t) => (
          <BloqueTurno
            key={t.id}
            turno={t}
            ahora={ahora}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </div>
    </div>
  );
}

function BloqueTurno({
  turno: t,
  ahora,
  onSeleccionar,
}: {
  turno: Turno;
  ahora: Minutos;
  onSeleccionar: (d: Detalle) => void;
}) {
  // Los cancelados avisaron: el slot se pudo reasignar. No ensucian el carril.
  if (t.estado === 'cancelado') return null;

  const espera = esperaMinutos(t, ahora);
  const deriva = derivaMinutos(t, ahora);
  const sev = severidadDeEspera(Math.max(espera ?? 0, deriva));

  const xAgendado = pos(t.agendadoA);
  const anchoAgendado = (t.duracionAgendada / VENTANA) * 100;

  const abrir = () => onSeleccionar({ turno: t, espera, deriva });

  /* Ausencia: el hueco que dejó. Se dibuja como vacío rayado, no como alarma
     roja — no es una demora, es capacidad perdida. Verlo en el carril es
     literalmente ver el 30% de ausencias del brief como agujeros en el día. */
  if (t.estado === 'ausente') {
    return (
      <button
        type="button"
        onClick={abrir}
        title={`${t.paciente.nombre} — ausente sin aviso`}
        className="absolute top-1/2 h-5 -translate-y-1/2 rounded-[2px] border border-dashed border-sev-void bg-sev-void-bg transition hover:brightness-95"
        style={{ left: `${xAgendado}%`, width: `${anchoAgendado}%` }}
      >
        <span className="sr-only">{t.paciente.nombre}, ausente</span>
      </button>
    );
  }

  /* Todavía no llegó su hora. Se dibuja como un filete al pie, no como una
     caja: lo que ya pasó es dato, lo que falta es solo plan. Darles el mismo
     peso visual haría que la mitad derecha del carril compita con la
     izquierda, que es donde está la información. */
  if (t.estado === 'agendado') {
    return (
      <div
        className="absolute bottom-1.5 h-[3px] rounded-full bg-rule-strong/70"
        style={{ left: `${xAgendado}%`, width: `${Math.max(0.3, anchoAgendado - 0.1)}%` }}
        title={`${formatoHora(t.agendadoA)} · ${t.paciente.nombre}`}
      />
    );
  }

  const inicio = t.inicioA ?? ahora;
  const fin = t.finA ?? (t.estado === 'en_consulta' ? ahora : inicio);
  const xReal = pos(inicio);
  const anchoReal = Math.max(0.25, ((fin - inicio) / VENTANA) * 100);

  // El paciente está en sala: la barra crece desde su hora hasta ahora.
  if (t.estado === 'en_espera') {
    const desde = Math.max(t.agendadoA, t.checkInA ?? t.agendadoA);
    const ancho = Math.max(0.2, ((ahora - desde) / VENTANA) * 100);
    return (
      <button
        type="button"
        onClick={abrir}
        title={`${t.paciente.nombre} — esperando ${Math.round(espera ?? 0)}′`}
        className="group absolute top-1/2 -translate-y-1/2"
        style={{ left: `${pos(desde)}%`, width: `${ancho}%` }}
      >
        <span
          className={`block h-1.5 rounded-full ${TRAZO[sev]} opacity-45 transition group-hover:opacity-70`}
        />
        <span
          className={`absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-surface ${TRAZO[sev]}`}
        />
        <span className="sr-only">
          {t.paciente.nombre}, esperando {Math.round(espera ?? 0)} minutos
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Fantasma: la hora prometida. */}
      <div
        className="pointer-events-none absolute top-1/2 h-5 -translate-y-1/2 rounded-[2px] border border-dashed border-rule-strong"
        style={{ left: `${xAgendado}%`, width: `${anchoAgendado}%` }}
      />

      {/* Conector: la deriva, dibujada a escala. */}
      {deriva > 2 && (
        <div
          className={`pointer-events-none absolute top-1/2 h-px -translate-y-1/2 ${TRAZO[sev]} opacity-55`}
          style={{
            left: `${xAgendado + anchoAgendado}%`,
            width: `${Math.max(0, xReal - xAgendado - anchoAgendado)}%`,
          }}
        />
      )}

      {/* Lo que realmente pasó. */}
      <button
        type="button"
        onClick={abrir}
        title={`${t.paciente.nombre} · agendado ${formatoHora(t.agendadoA)} · atendido ${formatoHora(inicio)}`}
        className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-[2px] ${TRAZO[sev]} ${
          t.estado === 'en_consulta' ? 'ring-2 ring-accent ring-offset-1' : ''
        } transition hover:brightness-110`}
        style={{ left: `${xReal}%`, width: `${anchoReal}%` }}
      >
        <span className="sr-only">
          {t.paciente.nombre}, {t.estado}, deriva {formatoDelta(deriva)}
        </span>
      </button>
    </>
  );
}

function FichaTurno({ detalle, onCerrar }: { detalle: Detalle; onCerrar: () => void }) {
  const { turno: t, espera, deriva } = detalle;
  const sev = severidadDeEspera(Math.max(espera ?? 0, deriva));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule bg-sunken px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-base font-semibold text-ink">
          {t.paciente.nombre}
        </span>
        <span className="text-[0.8125rem] text-ink-soft">{t.especialidad}</span>
        {t.paciente.primeraVez && (
          <span className="rounded-xs bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-semibold text-accent">
            Primera consulta
          </span>
        )}
        {t.esSobreturno && (
          <span className="rounded-xs bg-sev-leve-bg px-1.5 py-0.5 text-[0.6875rem] font-semibold text-sev-leve">
            Sobreturno
          </span>
        )}
      </div>

      <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <Dato rotulo="Agendado" valor={formatoHora(t.agendadoA)} />
        <Dato
          rotulo="Check-in"
          valor={t.checkInA !== undefined ? formatoHora(t.checkInA) : '—'}
        />
        <Dato
          rotulo="Atendido"
          valor={t.inicioA !== undefined ? formatoHora(t.inicioA) : '—'}
        />
        <Dato
          rotulo="Espera"
          valor={espera !== undefined ? `${Math.round(espera)}′` : '—'}
          clase={espera !== undefined ? TEXTO[sev] : undefined}
        />
        <Dato rotulo="Deriva" valor={formatoDelta(deriva)} clase={TEXTO[sev]} />
        <button
          type="button"
          onClick={onCerrar}
          className="text-[0.8125rem] font-semibold text-accent underline-offset-2 hover:underline"
        >
          Cerrar
        </button>
      </dl>
    </div>
  );
}

function Dato({
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
      <dd className={`tabular text-sm font-semibold ${clase ?? 'text-ink'}`}>
        {valor}
      </dd>
    </div>
  );
}

function Leyenda() {
  const items: Array<[string, string]> = [
    ['border border-dashed border-rule-strong bg-surface', 'Hora prometida'],
    ['bg-rule-strong/70 !h-[3px]', 'Aún no llegó'],
    ['bg-sev-normal', 'En hora'],
    ['bg-sev-moderada', 'Demorado'],
    ['bg-sev-critica', 'Crítico'],
    ['border border-dashed border-sev-void bg-sev-void-bg', 'Ausente'],
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map(([clase, rotulo]) => (
        <li key={rotulo} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-4 rounded-[2px] ${clase}`} />
          <span className="text-[0.6875rem] text-ink-soft">{rotulo}</span>
        </li>
      ))}
    </ul>
  );
}
