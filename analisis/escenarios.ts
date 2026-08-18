/**
 * ANÁLISIS DE ESCENARIOS — genera los números del caso de negocio.
 *
 * Correr con: npm run analisis
 *
 * Existe para que ninguna cifra de la propuesta sea una afirmación suelta.
 * Cada número del documento sale de acá y se puede reproducir delante del
 * cliente. Si alguien discute un supuesto, se cambia el parámetro y se vuelve
 * a correr en el momento.
 *
 * Lee de `lib/escenarios.ts`, con las mismas palancas que despliega por fases
 * la vista de gerencia: el documento y la pantalla no pueden divergir.
 */

import { formatoHora } from '../lib/domain';
import { ESCENARIOS, compararEscenarios, evaluarEscenario, horasDelEje } from '../lib/escenarios';

const pad = (s: string | number, n: number) => String(s).padStart(n);

function main(): void {
  const resumenes = compararEscenarios();
  const base = resumenes[0];
  /* El efecto total se mide contra la fase 2 (agenda ajustada), que es la
   * solución sin costo de volumen. Las opciones con costo se listan aparte. */
  const fin = resumenes.find((r) => r.escenario.id === 'desagendar') ?? resumenes[resumenes.length - 1];

  console.log(
    `\n═══ ESCENARIOS · red de 8 sedes · promedio de ${base.replicas} réplicas ═══\n`,
  );
  console.log('escenario                  media (±sd)     tarde     P90   ≤15′  ausenc.  consultas (±sd)');
  console.log('─'.repeat(94));

  for (const r of resumenes) {
    console.log(
      `${r.escenario.nombre.padEnd(24)}${pad(r.espera.toFixed(1), 6)}′ ±${r.desvio.espera.toFixed(1).padStart(4)} ` +
        `${pad(r.tarde.toFixed(1), 8)}′ ${pad(r.p90.toFixed(0), 6)}′ ${pad((r.dentroDe15 * 100).toFixed(0), 5)}% ` +
        `${pad((r.tasaAusencia * 100).toFixed(1), 7)}% ${pad(r.atendidos, 9)} ±${r.desvio.atendidos.toFixed(0)}`,
    );
  }

  console.log('\n─── Qué hace cada fase ───');
  for (const r of resumenes) {
    console.log(`\n${r.escenario.nombre}`);
    console.log(`  ${r.escenario.nota}`);
  }

  console.log('\n─── Efecto total ───');
  console.log(
    `Espera media       ${base.espera.toFixed(1)}′ → ${fin.espera.toFixed(1)}′   (${(((fin.espera / base.espera) - 1) * 100).toFixed(0)}%)`,
  );
  console.log(
    `Espera de la tarde ${base.tarde.toFixed(1)}′ → ${fin.tarde.toFixed(1)}′   (${(((fin.tarde / base.tarde) - 1) * 100).toFixed(0)}%)`,
  );
  console.log(`P90                ${base.p90.toFixed(0)}′ → ${fin.p90.toFixed(0)}′`);
  console.log(
    `Atendidos ≤15′     ${(base.dentroDe15 * 100).toFixed(0)}% → ${(fin.dentroDe15 * 100).toFixed(0)}%`,
  );
  const deltaConsultas = fin.atendidos - base.atendidos;
  const ruido = Math.max(base.desvio.atendidos, fin.desvio.atendidos);
  console.log(
    `Consultas por día  ${base.atendidos} → ${fin.atendidos}   (${deltaConsultas >= 0 ? '+' : ''}${deltaConsultas})`,
  );
  console.log(
    `                   dispersión entre réplicas ±${ruido.toFixed(0)} · ` +
      (Math.abs(deltaConsultas) < ruido
        ? 'la diferencia NO es distinguible del ruido del modelo'
        : 'la diferencia excede el ruido y es un efecto real'),
  );
  console.log(
    `Cierre de jornada  ${formatoHora(base.cierre)} → ${formatoHora(fin.cierre)}`,
  );

  console.log('\n─── Opciones con costo de volumen (sobre la fase 2) ───');
  console.log('opción                              media    P90   ≤15′  consultas   vs. fase 2');
  const desag = ESCENARIOS.find((e) => e.id === 'desagendar')!;
  const opciones: Array<[string, Partial<typeof desag>]> = [
    ['Sin ninguna sobreagenda', { factorSobreagenda: 0 }],
    ['Primera consulta ×1,5', { factorPrimeraVez: 1.5 }],
    ['Ambas', { factorSobreagenda: 0, factorPrimeraVez: 1.5 }],
    ['Todos los turnos 15% más largos', { factorSlot: 1.15 }],
    ['Todos los turnos 30% más largos', { factorSlot: 1.3 }],
    ['Todos con su duración real (50% más largos)', { factorSlot: 1.5 }],
  ];
  for (const [nombre, extra] of opciones) {
    const r = evaluarEscenario({ ...desag, id: `opt-${nombre}`, ...extra });
    console.log(
      `${nombre.padEnd(34)}${pad(r.espera.toFixed(1), 6)}′ ${pad(r.p90.toFixed(0), 6)}′ ${pad((r.dentroDe15 * 100).toFixed(0), 5)}% ` +
        `${pad(r.atendidos, 10)}   ${r.atendidos - fin.atendidos} (${(((r.atendidos / fin.atendidos) - 1) * 100).toFixed(1)}%)`,
    );
  }

  console.log('\n─── Por qué no desagendar antes de bajar las ausencias (fase 1 con menos sobreagenda) ───');
  console.log('sobreagenda            media    P90   ≤15′  consultas   vs. fase 1');
  const pool = ESCENARIOS.find((e) => e.id === 'pool')!;
  const f1 = resumenes.find((r) => r.escenario.id === 'pool')!;
  for (const [nombre, fs] of [['la de hoy', 0.35], ['la mitad', 0.2], ['casi ninguna', 0.1], ['ninguna', 0]] as const) {
    const r = evaluarEscenario({ ...pool, id: `pool-${fs}`, factorSobreagenda: fs });
    console.log(
      `${nombre.padEnd(22)}${pad(r.espera.toFixed(1), 6)}′ ${pad(r.p90.toFixed(0), 6)}′ ${pad((r.dentroDe15 * 100).toFixed(0), 5)}% ` +
        `${pad(r.atendidos, 10)}   ${r.atendidos - f1.atendidos} (${(((r.atendidos / f1.atendidos) - 1) * 100).toFixed(1)}%)`,
    );
  }

  console.log('\n─── Curva de la jornada ───');
  const horas = horasDelEje(resumenes);
  const valores = resumenes.map((r) => new Map(r.curva.map((p) => [p.hora, p.espera])));

  console.log(
    `${'hora'.padEnd(7)}${resumenes.map((r) => r.escenario.corto.padStart(15)).join('')}`,
  );
  for (const h of horas) {
    const celdas = valores
      .map((v) => (v.has(h) ? `${v.get(h)!.toFixed(1)}′` : 'sin cola'))
      .map((s) => pad(s, 15))
      .join('');
    console.log(`${formatoHora(h).padEnd(7)}${celdas}`);
  }

  /* El asistente clínico no se modela como mecanismo: se mide cuánto vale
   * acortar la consulta real, que es lo que haría si recupera parte del
   * tiempo de documentación. Es una sensibilidad, no una promesa. */
  console.log('\n─── Sensibilidad · consulta real más corta (asistente clínico) ───');
  console.log('Sobre la fase 2 (desagendar), sin tocar la agenda ni el volumen.\n');
  console.log('consulta real      media    tarde     P90   ≤15′  consultas   cierre');
  const desagendar = ESCENARIOS.find((e) => e.id === 'desagendar')!;
  for (const f of [1, 0.95, 0.9, 0.85]) {
    const r = evaluarEscenario({ ...desagendar, id: `${desagendar.id}-x${f}`, factorDuracionReal: f });
    console.log(
      `${`${Math.round((1 - f) * 100)}% más corta`.padEnd(16)}${pad(r.espera.toFixed(1), 7)}′ ` +
        `${pad(r.tarde.toFixed(1), 7)}′ ${pad(r.p90.toFixed(0), 6)}′ ${pad((r.dentroDe15 * 100).toFixed(0), 5)}% ` +
        `${pad(r.atendidos, 10)}   ${formatoHora(r.cierre)}`,
    );
  }

  /* La proporción de primeras consultas es un supuesto sin fuente local. Se
   * muestra cómo cambia el escenario de primera vez con 10%, 17% (supuesto),
   * 28% (SNS español 2024) y 37% (Hospital General de México 2025). */
  console.log('\n─── Sensibilidad · proporción de primeras consultas (supuesto: 17%) ───');
  console.log('Escenario de la primera consulta agendada a 1,5 veces el turno.\n');
  console.log('primeras consultas   media    tarde     P90   ≤15′  consultas   vs. desagendar');
  const primeraVez = ESCENARIOS.find((e) => e.id === 'primeravez')!;
  for (const p of [0.1, 0.17, 0.28, 0.37]) {
    const ref = evaluarEscenario({ ...desagendar, id: `${desagendar.id}-p${p}`, proporcionPrimeraVez: p });
    const r = evaluarEscenario({ ...primeraVez, id: `${primeraVez.id}-p${p}`, proporcionPrimeraVez: p });
    console.log(
      `${`${Math.round(p * 100)}%`.padEnd(19)}${pad(r.espera.toFixed(1), 7)}′ ` +
        `${pad(r.tarde.toFixed(1), 7)}′ ${pad(r.p90.toFixed(0), 6)}′ ${pad((r.dentroDe15 * 100).toFixed(0), 5)}% ` +
        `${pad(r.atendidos, 10)}   ${ref.espera.toFixed(1)}′ y ${ref.atendidos} consultas (${r.atendidos - ref.atendidos})`,
    );
  }
  console.log();
}

main();
