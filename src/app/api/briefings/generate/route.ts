import { NextResponse } from "next/server";
import { generateBriefing } from "@/lib/agents/briefing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const briefing = await generateBriefing({});
    return NextResponse.json({ ok: true, briefing });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
