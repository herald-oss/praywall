// Raíces de groserías en español para el filtro de contenido (lib/moderation.ts).
//
// Deliberadamente conservador: excluye palabras ambiguas que también tienen
// un uso legítimo y frecuente en un muro de oración (ej. "perra"/"zorra" como
// nombres de mascotas, "joder"/"idiota" como expresiones de angustia genuina,
// "coger" que es un verbo normal en España, "negro" como color/apelativo,
// "concha" como concha marina). Prioriza no bloquear peticiones de oración
// reales sobre atrapar cada insulto posible.
//
// obscenity no normaliza tildes/ñ (no son ASCII), así que se listan variantes
// con y sin acento explícitamente. Cada término se matchea como palabra
// completa (con boundaries) en lib/moderation.ts, así que no hace falta listar
// cada conjugación — solo formas base y plurales comunes.
export const ES_PROFANITY_TERMS: string[] = [
  "puta",
  "puto",
  "putas",
  "putos",
  "hijueputa",
  "hijoputa",
  "maricon",
  "maricón",
  "mariconazo",
  "cabron",
  "cabrón",
  "cabrona",
  "cabrones",
  "pendejo",
  "pendeja",
  "pendejos",
  "pendejas",
  "gilipollas",
  "coño",
  "verga",
  "vergas",
  "culiado",
  "culiada",
  "chingar",
  "chingada",
  "chingado",
  "chingadera",
  "cagada",
  "cagadas",
  "cagon",
  "cagón",
  "malparido",
  "malparida",
  "mierda",
  "mierdas",
];
