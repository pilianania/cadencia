'use client';

/**
 * Tira de estado de la sede.
 *
 * DECISIÓN: no son tarjetas. Es una tira continua dividida por filetes.
 * Un mostrador mira esto de reojo entre paciente y paciente; las tarjetas
 * con sombra y padding generoso gastan espacio vertical que acá vale.
 *
 * Cada número se muestra contra la REFERENCIA REPORTADA por la Directora
 * (45′ de espera, 30% de ausencias). Que el simulador reproduzca esos valores
 * es la prueba de que el modelo está calibrado a la realidad del cliente y no
 * a un escenario cómodo.
 */

import type { MetricasSede } from '@/lib/metricas';
import { severidadDeEspera, type Severidad } from '@/lib/domain';

const TEXTO: Record<Severidad, string> = {
  normal: 'text-sev-normal',
  leve: 'text-sev-leve',
  moderada: 'text-sev-moderada',
  critica: 'text-sev-critica',
};

/** Valores que la Directora de Operaciones reportó en la reunión inicial. */
export const REFERENCIA = { esperaMedia: 45, tasaAusencia: 0.3 } as const;

export function TiraMetricas({ m }: { m: MetricasSede }) {
  const sevMedia = severidadDeEspera(m.esperaPromedio);
  const sevPeor = severidadDeEspera(m.peorEsperaActual);

  return (
    <section className="grid grid-cols-2 divide-rule border border-rule bg-surface sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
      {/* Se reporta la espera PERCIBIDA como titular —es la que genera la queja
          y la que la Directora midió— y debajo se descompone en la parte
          atribuible a la agenda. La brecha entre ambas dice cuánto se arregla
          ordenando consultorios y cuánto trabajando la puntualidad del paciente. */}
      <Metrica
        rotulo="Espera percibida"
        valor={Math.round(m.esperaPercibida)}
        unidad="min"
        clase={TEXTO[severidadDeEspera(m.esperaPercibida)]}
        pie={`${Math.round(m.esperaPromedio)}′ atribuibles a la agenda · P90 ${Math.round(m.esperaP90)}′`}
        clasePie={sevMedia === 'critica' ? TEXTO.critica : undefined}
      />
      <Metrica
        rotulo="En sala"
        valor={m.enEspera}
        unidad={m.enEspera === 1 ? 'paciente' : 'pacientes'}
        pie={
          m.peorEsperaActual > 0
            ? `El que más espera: ${Math.round(m.peorEsperaActual)}′`
            : 'Sala vacía'
        }
        clasePie={m.peorEsperaActual >= 25 ? TEXTO[sevPeor] : undefined}
      />
      <Metrica
        rotulo="En consulta"
        valor={m.enConsulta}
        unidad={m.enConsulta === 1 ? 'consultorio' : 'consultorios'}
        pie={`${m.finalizados} atendidos hoy`}
      />
      <Metrica
        rotulo="Ausencias"
        valor={Math.round(m.tasaAusencia * 100)}
        unidad="%"
        clase={m.tasaAusencia > 0.25 ? 'text-sev-critica' : 'text-ink'}
        pie={`${m.ausentes} sin aviso · referencia ${REFERENCIA.tasaAusencia * 100}%`}
      />
      <Metrica
        rotulo="Tiempo muerto"
        valor={Math.round(m.tiempoMuerto / 60)}
        unidad="h de consultorio"
        clase={m.ocupacion < 0.7 ? 'text-sev-moderada' : 'text-ink'}
        pie={`Ocupación ${Math.round(m.ocupacion * 100)}%`}
      />
    </section>
  );
}

function Metrica({
  rotulo,
  valor,
  unidad,
  pie,
  clase,
  clasePie,
}: {
  rotulo: string;
  valor: number;
  unidad: string;
  pie: string;
  clase?: string;
  clasePie?: string;
}) {
  return (
    <div className="border-b border-rule px-4 py-3 lg:border-b-0">
      <p className="eyebrow">{rotulo}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`tabular font-display text-3xl font-semibold leading-none ${clase ?? 'text-ink'}`}
        >
          {valor}
        </span>
        <span className="text-[0.8125rem] text-ink-soft">{unidad}</span>
      </p>
      <p className={`mt-1.5 text-[0.6875rem] ${clasePie ?? 'text-ink-faint'}`}>{pie}</p>
    </div>
  );
}
