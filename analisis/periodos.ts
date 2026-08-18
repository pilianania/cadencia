/**
 * Precalcula un año de operación de la red y lo guarda como JSON para la
 * vista de gerencia. Correr con: npm run periodos
 *
 * En Node lleva un par de segundos; en el navegador en modo desarrollo
 * bloquea la pestaña. Como las semillas son deterministas, el resultado es
 * reproducible: es el mismo simulador que produce el resto de las cifras.
 */
import { writeFileSync } from 'node:fs';
import { simularAnio, porMes, compactar } from '../lib/periodos';

const datos = simularAnio();
const compacto = JSON.stringify(compactar(datos));
writeFileSync('data/gerencia.json', compacto);
const kb = (compacto.length / 1024).toFixed(0);
console.log(`${datos.jornadas.length} jornadas · ${kb} KB`);
console.log('mes  fase  espera   P90  ausencias  uso   libre/día');
for (const [i, m] of porMes(datos).entries()) {
  const fase = datos.jornadas.find((j) => j.mes === i + 1)!.fase;
  console.log(
    `${String(i + 1).padStart(3)}    ${fase}   ${m.esperaMedia.toFixed(1).padStart(5)}′ ${m.p90.toFixed(0).padStart(5)}′  ` +
      `${((m.ausentesSinAviso / m.ofrecidos) * 100).toFixed(0).padStart(6)}%  ${((m.atendidos / m.ofrecidos) * 100).toFixed(0)}%   ${(m.minutosLibreConSala / 60 / 22).toFixed(0)} h`,
  );
}
