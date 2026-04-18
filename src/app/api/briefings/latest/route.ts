import { NextResponse } from "next/server";
import { latestBriefing } from "@/lib/agents/briefing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const briefing = await latestBriefing();
  return NextResponse.json(
    { briefing },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
