import type { Prayer } from "@/lib/db/schema";

// Forma interna traída de DB (incluye identificadores) + join de userName.
// userId/visitorId nunca deben salir de este módulo hacia una respuesta.
export type PrayerRow = Pick<
  Prayer,
  | "id"
  | "text"
  | "displayName"
  | "userId"
  | "visitorId"
  | "isAnonymous"
  | "category"
  | "intercessorCount"
  | "goalReached"
  | "answeredAt"
  | "testimony"
  | "createdAt"
> & { userName: string | null };

// Forma pública: sin userId ni visitorId. canManage le dice al cliente si
// puede archivar esta oración, sin revelar el identificador de nadie.
export type PublicPrayer = Omit<
  PrayerRow,
  "userId" | "visitorId" | "userName"
> & {
  userName: string | null;
  canManage: boolean;
};

export interface Requester {
  userId: string | null;
  visitorId: string | null;
}

/**
 * Convierte una fila interna en su forma pública segura.
 * - Nunca expone userId ni visitorId.
 * - Si la oración es anónima, displayName/userName siempre viajan null
 *   (arregla la fuga de nombre real en oraciones marcadas anónimas que
 *   quedaron vinculadas a una cuenta vía signup).
 * - canManage: true solo si el requester es el dueño verificado server-side.
 */
export function toPublicPrayer(
  row: PrayerRow,
  requester: Requester
): PublicPrayer {
  const isAnon = row.isAnonymous ?? true;

  let canManage = false;
  if (row.userId != null) {
    canManage = requester.userId != null && requester.userId === row.userId;
  } else if (row.visitorId != null) {
    canManage =
      requester.visitorId != null && requester.visitorId === row.visitorId;
  }

  return {
    id: row.id,
    text: row.text,
    displayName: isAnon ? null : row.displayName,
    isAnonymous: isAnon,
    category: row.category,
    intercessorCount: row.intercessorCount,
    goalReached: row.goalReached,
    answeredAt: row.answeredAt,
    // Testimony text is only for the owner's own account view — never
    // exposed on the public wall/detail page to anyone else.
    testimony: canManage ? row.testimony : null,
    createdAt: row.createdAt,
    userName: isAnon ? null : row.userName,
    canManage,
  };
}

export function toPublicPrayers(
  rows: PrayerRow[],
  requester: Requester
): PublicPrayer[] {
  return rows.map((row) => toPublicPrayer(row, requester));
}
