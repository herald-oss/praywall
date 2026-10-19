import { NextRequest, NextResponse } from "next/server";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { listIntercededPrayers, listOwnPrayers } from "@/lib/prayers/queries";
import { toPublicPrayers } from "@/lib/prayers/serialize";
import { getRequester } from "@/lib/requester";

// Requires a logged-in session — this is account-scoped data, not public.
export async function GET(request: NextRequest) {
  try {
    const requester = await getRequester(request.cookies);
    if (!requester.userId) throw new HttpError(401, "unauthorized");

    const [mine, interceded] = await Promise.all([
      listOwnPrayers(requester),
      listIntercededPrayers(requester),
    ]);

    return NextResponse.json({
      myPrayers: toPublicPrayers(mine, requester),
      intercededPrayers: toPublicPrayers(interceded, requester),
    });
  } catch (error) {
    return errorResponse(error, "Failed to fetch account prayers");
  }
}
