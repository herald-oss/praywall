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
> & { userName: string | null; viewerHasPrayed?: boolean };

// Forma pública: sin userId ni visitorId. canManage le dice al cliente si
// puede archivar esta oración, sin revelar el identificador de nadie.
export type PublicPrayer = Omit<
  PrayerRow,
  "userId" | "visitorId" | "userName" | "viewerHasPrayed"
> & {
  userName: string | null;
  canManage: boolean;
  viewerHasPrayed: boolean;
};

export interface Requester {
  userId: string | null;
  visitorId: string | null;
}

/** True when the requester owns this prayer (account first, then cookie). */
export function isOwner(
  row: Pick<PrayerRow, "userId" | "visitorId">,
  requester: Requester
): boolean {
  if (row.userId != null) {
    return requester.userId != null && requester.userId === row.userId;
  }
  if (row.visitorId != null) {
    return requester.visitorId != null && requester.visitorId === row.visitorId;
  }
  return false;
}

/**
 * Convierte una fila interna en su forma pública segura.
 * - Nunca expone userId ni visitorId.
 * - Si la oración es anónima, displayName/userName siempre viajan null.
 * - canManage: true solo si el requester es el dueño verificado server-side.
 * - viewerHasPrayed: si este requester ya oró por ella.
 */
export function toPublicPrayer(
  row: PrayerRow,
  requester: Requester
): PublicPrayer {
  const isAnon = row.isAnonymous ?? true;
  const canManage = isOwner(row, requester);

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
    viewerHasPrayed: row.viewerHasPrayed ?? false,
  };
}

export function toPublicPrayers(
  rows: PrayerRow[],
  requester: Requester
): PublicPrayer[] {
  return rows.map((row) => toPublicPrayer(row, requester));
}
