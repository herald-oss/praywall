import { NextRequest, NextResponse } from "next/server";
import { LIMITS } from "@/lib/config";
import { readJson } from "@/lib/http/body";
import { getClientIp } from "@/lib/http/client-ip";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { assertSameOrigin } from "@/lib/http/origin";
import { enforceRateLimit } from "@/lib/http/rate";
import { intercede } from "@/lib/prayers/intercede";
import { publish } from "@/lib/realtime/broker";
import { getRequester } from "@/lib/requester";
import { intercedeSchema, parseInput } from "@/lib/validation";
import { getOrCreateVisitorId, setVisitorCookie } from "@/lib/visitor";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { prayerId } = parseInput(intercedeSchema, await readJson(request));

    // The goal of 33 must mean 33 people. Without an account we can't prove
    // that, so cap what one network can add: a generous per-IP rate (a whole
    // church may share one Wi-Fi) plus a daily cap per IP per prayer.
    const ip = getClientIp(request);
    enforceRateLimit(`intercede:ip:${ip}`, LIMITS.intercedePerIp);
    enforceRateLimit(`intercede:ip-prayer:${ip}:${prayerId}`, LIMITS.intercedePerIpPerPrayer);

    const { visitorId, isNew } = getOrCreateVisitorId(request);
    const requester = await getRequester(request.cookies);

    const result = await intercede({ prayerId, visitorId, userId: requester.userId });
    if (result.status === "not_found") throw new HttpError(404, "not_found");
    if (result.status === "prayed") {
      publish({
        type: "count",
        id: prayerId,
        intercessorCount: result.count,
        goalReached: result.goalReached,
      });
    }

    const response = NextResponse.json({
      count: result.count,
      goalReached: result.goalReached,
      alreadyPrayed: result.status === "already",
      ownPrayer: result.status === "own",
    });
    if (isNew) setVisitorCookie(response, visitorId, request);
    return response;
  } catch (error) {
    return errorResponse(error, "Failed to record intercession");
  }
}
