/**
 * SUPUESTOS DEL CASO DE NEGOCIO — fuente única.
 *
 * Todo número que no esté en el brief vive acá, con su fuente y su rango.
 * El documento y la aplicación leen de este archivo: si en la defensa alguien
 * discute un supuesto, se cambia el valor y se recalcula en el momento.
 *
 * DECISIÓN DE MODELADO — importa y hay que poder defenderla:
 * El modelo trabaja en UNIDADES FÍSICAS (consultas, horas-consultorio,
 * minutos) y monetiza recién al final, con un único parámetro de conversión.
 * En un contexto inflacionario un caso de negocio expresado en pesos se vence
 * en un trimestre; uno expresado en consultas evitadas y horas recuperadas
 * sigue siendo válido, y se re-monetiza cambiando un solo número.
 */

export type Confianza = 'alta' | 'media' | 'baja';

export interface Supuesto<T = number> {
  /** Qué se asume. */
  descripcion: string;
  valor: T;
  /** Rango plausible para el análisis de sensibilidad. */
  rango: [T, T];
  unidad: string;
  fuente: string;
  confianza: Confianza;
  /** Qué cambia en la conclusión si el valor real es otro. */
  sensibilidad: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * SUPUESTO 0 — JURISDICCIÓN
 *
 * El brief NO dice en qué país opera la red. Menciona HIPAA, que es normativa
 * de Estados Unidos, pero describe una operación (agenda telefónica, planillas
 * compartidas, 8 sedes ambulatorias) sin más señales geográficas.
 *
 * Se asume Argentina. Es el supuesto que más cosas arrastra: cambia el marco
 * regulatorio, el orden de magnitud de los valores económicos y hasta la
 * estrategia de canal para los recordatorios. Por eso va primero y por eso
 * es la primera pregunta que hay que hacerle al cliente.
 * ──────────────────────────────────────────────────────────────────────────── */

export const JURISDICCION = {
  asumida: 'Argentina',
  fuente: 'No especificado en el brief. Asunción explícita.',
  siEsOtra: [
    'Estados Unidos: HIPAA pasa a ser vinculante (hoy lo proponemos como estándar de diseño, no como obligación legal). Los valores económicos cambian un orden de magnitud.',
    'Otro país de LATAM: el marco de protección de datos cambia (habría que mapear la ley local), pero la estructura del caso de negocio se sostiene.',
  ],
} as const;

/* ── Operación ───────────────────────────────────────────────────────────── */

export const CONSULTAS_POR_DIA: Supuesto = {
  descripcion: 'Turnos agendados por día en toda la red',
  valor: 1371,
  rango: [900, 1800],
  unidad: 'turnos/día',
  fuente:
    'Derivado de los otros supuestos: 8 sedes × 4-6 consultorios × jornada 08-18h ' +
    'con slots de 15-30 min. El brief no da volumen.',
  confianza: 'media',
  sensibilidad:
    'MEDIDO, y no es lo que uno esperaría. El beneficio ABSOLUTO escala con el volumen, ' +
    'pero el PORCENTAJE de mejora no depende del tamaño sino de la utilización. ' +
    'Comprobado: las 8 sedes dan -37%; un subconjunto de 4 sedes más congestionadas ' +
    '(39,5′ de base contra 30,7′) da -51%. Y con la misma capacidad y la mitad de la ' +
    'demanda, la espera de una sede cae de 56,8′ a 4,2′: sin congestión no hay nada que ' +
    'optimizar. Lo que se sostiene ante un error de volumen es el ORDEN DE LAS FASES.',
};

export const CONSULTORIOS: Supuesto = {
  descripcion: 'Consultorios activos en la red',
  valor: 42,
  rango: [24, 60],
  unidad: 'consultorios',
  fuente:
    'Asunción de 4-6 por sede. El brief solo dice "8 clínicas ambulatorias". ' +
    'Se calibró para que la utilización resultante quedara apenas por debajo de 1, ' +
    'que es el régimen congestionado-pero-estable que describe la clienta: si fuera ' +
    'mayor a 1 la cola crecería sin techo y habría pacientes atendiéndose a las 22h.',
  confianza: 'media',
  sensibilidad:
    'Junto con el volumen determina la utilización, que es la variable que realmente ' +
    'gobierna el resultado. Es el par de supuestos a validar primero en la fase 0.',
};

export const DURACION_SLOT: Supuesto = {
  descripcion: 'Duración nominal del turno según especialidad',
  valor: 20,
  rango: [15, 30],
  unidad: 'minutos',
  fuente:
    'La duración media de la consulta ambulatoria en Argentina se ubica en torno a los ' +
    '15 minutos, y los nomencladores toman 20 minutos como referencia operativa. ' +
    'Se modelaron 15/20/25/30 según especialidad.',
  confianza: 'alta',
  sensibilidad:
    'Cambia la capacidad instalada. Slots más largos con la misma grilla agravan la ' +
    'congestión; más cortos la alivian pero empeoran la calidad de la consulta.',
};

export const SOBRECARGA_CONSULTA: Supuesto = {
  descripcion:
    'Cuánto excede la consulta real a la duración agendada (multiplicador medio)',
  valor: 1.2,
  rango: [1.1, 1.3],
  unidad: 'multiplicador',
  fuente:
    'CONSERVADOR. CONVERGENCIA DE FUENTES, ninguna concluyente sola. Gremial (Soc. Argentina de Cardiología): al ' +
    '70% de los profesionales se les exige ofrecer turnos de 10-15 minutos, mientras ' +
    'que consideran que la consulta requiere 20-30. Esa brecha declarada implica un ' +
    'factor de 1,5 a 2×. Sectorial (INFOMED): media ambulatoria ~15 min, rara vez supera 20. Gremial federal (COMRA): congestión sistémica, turnos a 3 meses. Académica: estudios de tiempo de consulta ambulatoria en SciELO y en Rev. Argentina de Salud Pública (Hosp. El Cruce, 26 profesionales, 11 subespecialidades). Modelamos 1,1-1,3×, por debajo de todas. La fuente gremial es de UNA especialidad y tiene incentivo a declarar que necesita más tiempo: no se usa sola ni se toma su magnitud.',
  confianza: 'alta',
  sensibilidad:
    'Es el motor de la cascada: si la consulta dura más que el slot, cada turno empuja ' +
    'al siguiente. Con factor 1 no habría deriva y el problema del brief no existiría. ' +
    'Al haber elegido el extremo bajo, subestimamos el problema y por lo tanto también ' +
    'el beneficio: el caso real es probablemente mejor que el que presentamos.',
};

export const JORNADA_HORAS: Supuesto = {
  descripcion: 'Extensión de la jornada de consultorios externos',
  valor: 10,
  rango: [8, 12],
  unidad: 'horas (08:00-18:00)',
  fuente:
    'Asunción de horario corrido de consultorios externos. El brief no lo menciona.',
  confianza: 'media',
  sensibilidad:
    'Una jornada partida (mañana y tarde con corte) reiniciaría parcialmente la cascada ' +
    'al mediodía y bajaría la deriva acumulada. Habría que confirmarlo: cambia la forma ' +
    'de la curva, no la dirección del resultado.',
};

export const PROFUNDIDAD_POOL: Supuesto = {
  descripcion:
    'Proporción de consultorios que comparten especialidad con otro de la misma sede',
  valor: 0.95,
  rango: [0.25, 1],
  unidad: 'proporción',
  fuente:
    'ASUNCIÓN SIN FUENTE — la más débil del modelo, y está declarada como tal. ' +
    'Se apoya solo en el razonamiento de que un centro ambulatorio con 4-6 consultorios ' +
    'no sostiene 6 especialidades distintas de tiempo completo: concentra en las de ' +
    'mayor demanda y las duplica. No encontramos estadística pública de composición ' +
    'de consultorios por especialidad en centros ambulatorios argentinos. ' +
    'Es el primer dato a medir en la fase 0.',
  confianza: 'baja',
  sensibilidad:
    'CRÍTICO para la fase 1. Sin pares de la misma especialidad no hay a dónde reasignar ' +
    'y el motor no encuentra un solo movimiento. Si la red está fragmentada, el valor se ' +
    'corre íntegramente a las fases 2 y 3, que no dependen de la estructura.',
};

/* ── Conducta del paciente ───────────────────────────────────────────────── */

export const TASA_AUSENCIA: Supuesto = {
  descripcion: 'Ausencias sin aviso sobre turnos agendados',
  valor: 0.3,
  rango: [0.23, 0.34],
  unidad: 'proporción',
  fuente:
    'Reportado por la Directora en la reunión (30%). Consistente con Giunta et al., ' +
    'Hospital Italiano de Buenos Aires / CONICET, que estima 23-34% en un sistema de ' +
    'salud argentino.',
  confianza: 'alta',
  sensibilidad:
    'Es el dato mejor respaldado del modelo: el valor del brief cae dentro del rango ' +
    'publicado. Mueve el tamaño del premio, no la dirección.',
};

/**
 * Distribución de causas de ausencia.
 *
 * Se toma prestada de otra institución y eso hay que decirlo: Giunta et al.
 * relevó causas por autorreporte en el Hospital Italiano de Buenos Aires, cuya
 * población es mayoritariamente urbana y de cobertura prepaga. La red del brief
 * tiene sedes en CABA, Zona Norte, Sur, Oeste y La Plata: poblaciones distintas,
 * con acceso al transporte y condiciones laborales distintas.
 *
 * ACOPLAMIENTO CON EL SUPUESTO ANTERIOR — no lo habíamos declarado:
 * la reducción del 35% por recordatorios SOLO es coherente si el olvido pesa
 * cerca del 44%. Un recordatorio no resuelve un problema de transporte ni una
 * urgencia laboral. Si en esta red el olvido pesara la mitad, la reducción
 * esperable se derrumba y la fase 2 hay que replantearla.
 */
export const CAUSAS_AUSENCIA: Supuesto<Record<string, number>> = {
  descripcion: 'Peso relativo de cada causa de ausencia sin aviso',
  valor: {
    olvido: 0.44,
    imprevistos: 0.153,
    malestar: 0.12,
    laborales: 0.053,
    transporte: 0.047,
  },
  rango: [{ olvido: 0.2 }, { olvido: 0.6 }],
  unidad: 'proporción por causa',
  fuente:
    'Giunta et al., Hospital Italiano de Buenos Aires: causas por autorreporte. ' +
    'PRESTADO DE OTRA POBLACIÓN — es evidencia de apoyo, no medición local.',
  confianza: 'baja',
  sensibilidad:
    'Determina qué proporción del ausentismo es ATACABLE con un recordatorio. ' +
    'El olvido lo es; el transporte y los problemas laborales no. Se mide en la ' +
    'fase 0 llamando a los ausentes, que además permite recuperar el turno.',
};

export const REDUCCION_POR_RECORDATORIOS: Supuesto = {
  descripcion: 'Reducción de ausencias atribuible a recordatorios con confirmación',
  valor: 0.35,
  rango: [0.2, 0.5],
  unidad: 'proporción de reducción',
  fuente:
    'Conservador. La literatura académica muestra reducción significativa con SMS y ' +
    'llamado telefónico, no con email (UNLP; St. Joseph Hospital: 11,6% → 4,7%). ' +
    'Los proveedores comerciales publican 50-80%, pero son datos propios sin revisión ' +
    'independiente: NO se usan.',
  confianza: 'media',
  sensibilidad:
    'Elegimos deliberadamente el extremo conservador. Si el efecto real es mayor, el ' +
    'caso mejora. Si la cartera de pacientes es mayoritariamente adulta mayor con baja ' +
    'penetración de smartphone, puede caer por debajo del rango: hay que preguntarlo.',
};

/* ── Economía ────────────────────────────────────────────────────────────── */

export const INGRESO_POR_CONSULTA: Supuesto = {
  descripcion: 'Ingreso neto que percibe la institución por consulta ambulatoria',
  valor: 1,
  rango: [1, 1],
  unidad: 'consulta (unidad física, sin monetizar)',
  fuente:
    'NO monetizado a propósito. Los aranceles éticos mínimos publicados por los ' +
    'colegios médicos provinciales (p. ej. Consejo Médico de La Pampa, 2026: $49.500 ' +
    'consulta general y $62.000 especialista) son un PISO gremial, no lo que la ' +
    'institución efectivamente cobra a una obra social, que suele estar bastante por ' +
    'debajo. Usar ese número como ingreso sobreestimaría el caso.',
  confianza: 'baja',
  sensibilidad:
    'Por eso el modelo entrega el resultado en CONSULTAS y HORAS-CONSULTORIO. La ' +
    'conversión a pesos la hace el cliente con su propio dato, que es el único correcto ' +
    'y el único que no se desactualiza con la inflación.',
};

export const EXISTE_LISTA_DE_ESPERA: Supuesto<boolean> = {
  descripcion: 'Hay demanda insatisfecha para ocupar los turnos liberados',
  valor: true,
  rango: [false, true],
  unidad: 'sí/no',
  fuente: 'Asunción. El brief no lo menciona.',
  confianza: 'baja',
  sensibilidad:
    'EL SUPUESTO QUE MÁS MUEVE EL CASO. La fase 3 reduce la agenda en 56 consultas/día. ' +
    'Con lista de espera esos turnos se rellenan y el costo tiende a cero: la mejora de ' +
    'experiencia sale gratis. Sin lista de espera, es una pérdida real de facturación y ' +
    'hay que presentarla como un intercambio explícito entre volumen y experiencia.',
};

export const TODOS: Array<Supuesto<number | boolean>> = [
  CONSULTAS_POR_DIA,
  CONSULTORIOS,
  DURACION_SLOT,
  SOBRECARGA_CONSULTA,
  JORNADA_HORAS,
  PROFUNDIDAD_POOL,
  TASA_AUSENCIA,
  REDUCCION_POR_RECORDATORIOS,
  INGRESO_POR_CONSULTA,
  EXISTE_LISTA_DE_ESPERA,
];

/**
 * Preguntas para el cliente, ordenadas por cuánto cambia la respuesta.
 * Llevarlas a la reunión: preguntar bien vale más que adivinar bien.
 */
export const PREGUNTAS_ABIERTAS = [
  '¿En qué país opera la red? Lo preguntamos porque el brief menciona HIPAA y el marco aplicable cambia.',
  '¿Cuánto percibe efectivamente la institución por una consulta ambulatoria, neto de lo que va al profesional?',
  '¿Tienen lista de espera o demanda insatisfecha? Define si liberar un turno vale algo.',
  '¿Cuántos consultorios por especialidad hay en cada sede? Define cuánto rinde la reasignación.',
  '¿Qué edad promedio tiene la cartera de pacientes y por qué canal los contactan hoy?',
  '¿Qué sistema usan hoy además de las planillas? Es el principal riesgo de integración.',
  '¿El paciente que falta vuelve a pedir turno? Si reagenda, la pérdida es un corrimiento, no una baja.',
] as const;
