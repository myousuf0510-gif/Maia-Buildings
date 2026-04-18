import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/status
 * Lightweight probe for which outbound notification channels are wired.
 * Returns booleans only — never leaks the actual webhook URL or key.
 */
export async function GET() {
  return NextResponse.json(
    {
      slack: Boolean(process.env.SLACK_WEBHOOK_URL),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      supabase: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
