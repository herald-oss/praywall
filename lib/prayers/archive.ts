import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { prayers } from "@/lib/db/schema";

/**
 * Archiva + anonimiza UNA oración. Nunca hace DELETE físico: conserva text/
 * category/intercessorCount/timestamps para estudio agregado, pero limpia
 * todo lo que identifique a quién la escribió.
 *
 * El filtro isNull(archivedAt) la hace idempotente y a prueba de carrera: un
 * segundo intento de archivar la misma fila devuelve 0 filas afectadas en
 * vez de pisar el archivedAt original.
 */
export async function archivePrayer(id: string): Promise<number> {
  const rows = await db
    .update(prayers)
    .set({
      archivedAt: new Date(),
      displayName: null,
      visitorId: null,
      userId: null,
    })
    .where(and(eq(prayers.id, id), isNull(prayers.archivedAt)))
    .returning({ id: prayers.id });
  return rows.length;
}

/**
 * Archiva + anonimiza TODAS las oraciones de un userId. Pensada para correr
 * en el hook beforeDelete de Better-Auth, ANTES de que borre la fila `user`
 * — en ese momento la fila todavía existe, así que eq(userId, userId)
 * matchea. Al limpiar userId acá mismo, el FK onDelete:"set null" que corre
 * después no tiene nada más que hacer (ya están en null).
 */
export async function archivePrayersOwnedByUser(
  userId: string
): Promise<number> {
  const rows = await db
    .update(prayers)
    .set({
      archivedAt: new Date(),
      displayName: null,
      visitorId: null,
      userId: null,
    })
    .where(and(eq(prayers.userId, userId), isNull(prayers.archivedAt)))
    .returning({ id: prayers.id });
  return rows.length;
}
