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
// con y sin acento explícitamente. lib/moderation.ts matchea cada término con
// boundary solo al INICIO (no al final), así que un término cubre cualquier
// palabra que EMPIECE con él (plurales, sufijos, "puta123"...) pero NO otras
// conjugaciones/formas que no compartan ese prefijo exacto. Para verbos, listar
// el prefijo/raíz más corto que cubra las formas comunes (ej. "ching" en vez
// de "chingar", para que también atrape "chinga", "chingón", etc.), no el
// infinitivo.
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
  // Stem, not infinitive: matching only "chingar" misses the far more
  // common imperative/conjugated forms ("chinga", "chingas", "chingón",
  // "chingada"...) since the matcher only checks a leading boundary, not
  // arbitrary inflections. "ching" as a prefix has no legitimate Spanish
  // word it collides with.
  "ching",
  "cag",
  "malparido",
  "malparida",
  "mierda",
  "mierdas",
];

// Frases de burla/spam conocidas — se matchean como frase EXACTA (con
// boundary al inicio Y al final), no como raíz. A diferencia de
// ES_PROFANITY_TERMS, aquí la raíz de la frase ("mamar") es ambigua por sí
// sola (amamantar a un bebé es un uso legítimo y común en una oración de
// familia), así que solo se bloquea la frase completa de burla, nunca la
// palabra suelta.
export const ES_MOCKERY_PHRASES: string[] = [
  "no mames",
  "no mamen",
  "no mamés",
  "ptm",
  "wtf",
];
