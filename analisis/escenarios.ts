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
 * Lee de `lib/escenarios.ts`, el mismo módulo que alimenta el gráfico de la
 * aplicación: la pantalla y el documento no pueden divergir.
 */

import { formatoHora } from '../lib/domain';
import { compararEscenarios, horasDelEje } from '../lib/escenarios';

const pad = (s: string | number, n: number) => String(s).padStart(n);

function main(): void {
  const resumenes = compararEscenarios();
  const base = resumenes[0];
  const fin = resumenes[resumenes.length - 1];

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
  console.log();
}

main();
