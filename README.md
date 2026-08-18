# Cadencia · gestión de turnos ambulatorios

Prototipo funcional, propuesta técnica y caso de negocio para una red de ocho
clínicas ambulatorias que busca reducir la espera de sus pacientes.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Prototipo (aplicación web) | En la raíz del sitio desplegado, o local con `npm run dev` en http://localhost:3000. Pestañas Red, Sede y Paciente; en Red y Sede, conmutador Hoy / Por período. |
| Propuesta escrita | `propuesta/propuesta.html` (se sirve en `/propuesta.html` del sitio desplegado). Cuatro pestañas: Resumen, Propuesta, Negocio, Anexo. |
| Fuentes de la propuesta | `propuesta/*.md`: resumen ejecutivo, plan de implementación, propuesta de valor, caso de negocio, anexo de supuestos. |
| Simulador y modelo | `lib/seed.ts` (generación de la jornada), `lib/simulador.ts` (la jornada minuto a minuto), `lib/optimizador.ts` (motor de reasignación), `lib/escenarios.ts` (escenarios y réplicas), `lib/periodos.ts` (año simulado para la vista Por período). |
| Análisis reproducibles | `npm run analisis` (escenarios, opciones con costo y sensibilidades; 64 réplicas), `npm run periodos` (regenera `data/gerencia.json`), `npm run umbral` (ganancia mínima del motor). Todo número del documento sale de ahí. |
| Notas para la defensa | `NOTAS-DEFENSA.md` |

## Correr local

```bash
npm install
npm run dev
```

`npm run build` copia la propuesta a `public/` y compila la aplicación; es lo
que corre el despliegue.
