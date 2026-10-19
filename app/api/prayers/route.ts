import { NextRequest, NextResponse } from "next/server";
import { LIMITS } from "@/lib/config";
import { readJson } from "@/lib/http/body";
import { getClientIp } from "@/lib/http/client-ip";
import { errorResponse } from "@/lib/http/errors";
import { assertSameOrigin } from "@/lib/http/origin";
import { enforceRateLimit } from "@/lib/http/rate";
import { createPrayer } from "@/lib/prayers/create";
import { listWall } from "@/lib/prayers/queries";
import { toPublicPrayer, toPublicPrayers } from "@/lib/prayers/serialize";
import { getRequester } from "@/lib/requester";
import { createPrayerSchema, isUuid, parseInput } from "@/lib/validation";
import { getOrCreateVisitorId, setVisitorCookie } from "@/lib/visitor";
import { notifySSEClients } from "../prayers/stream/route";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const offset = Number(params.get("offset") ?? "0");
    const exclude = params.get("exclude");

    const requester = await getRequester(request.cookies);
    const rows = await listWall({
      requester,
      offset: Number.isFinite(offset) ? offset : 0,
      excludeId: isUuid(exclude) ? exclude : null,
    });

    return NextResponse.json(toPublicPrayers(rows, requester));
  } catch (error) {
    return errorResponse(error, "Failed to fetch prayers");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`prayer:ip:${getClientIp(request)}`, LIMITS.prayerPerIp);

    const { visitorId, isNew } = getOrCreateVisitorId(request);
    enforceRateLimit(`prayer:visitor:${visitorId}`, LIMITS.prayerPerVisitor);

    const input = parseInput(createPrayerSchema, await readJson(request));
    const requester = await getRequester(request.cookies);

    const { row, isDuplicate } = await createPrayer(input, {
      userId: requester.userId,
      userName: requester.userName,
      visitorId,
    });

    // Broadcast only genuinely new prayers, anonymized for every listener
    // (canManage false) — the author's own flags only go in this response.
    if (!isDuplicate) {
      notifySSEClients(
        toPublicPrayer({ ...row, userName: null }, { userId: null, visitorId: null })
      );
    }

    const response = NextResponse.json(
      toPublicPrayer({ ...row, userName: null }, { userId: requester.userId, visitorId }),
      { status: isDuplicate ? 200 : 201 }
    );
    if (isNew) setVisitorCookie(response, visitorId, request);
    return response;
  } catch (error) {
    return errorResponse(error, "Failed to create prayer");
  }
}
