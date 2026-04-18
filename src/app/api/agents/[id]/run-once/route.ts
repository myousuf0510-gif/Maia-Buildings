import { NextRequest, NextResponse } from "next/server";
import { runAgentOnce } from "@/lib/agents/runner";

export const runtime = "nodejs";

/**
 * POST /api/agents/[id]/run-once
 * Manual single-pass trigger — used by the "Run Now" button on the inspector.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await runAgentOnce(params.id);
  const status = result.ok
    ? 200
    : result.error?.includes("Agent not found")
      ? 404
      : 500;
  return NextResponse.json(result, { status });
}
