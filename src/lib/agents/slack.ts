// Slack webhook integration for new MAIA decisions.
//
// If SLACK_WEBHOOK_URL is set (Vercel env var), any agent run created by
// runAgentOnce() will also post a compact Block Kit message to the target
// channel so directors can triage from Slack without opening the app.
//
// Graceful no-op if the env var is missing — the agent pipeline never fails
// because Slack is unavailable.

import type { Candidate, Reasoning } from "./runner";

const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://maia-demo.vercel.app";

type SlackPayload = {
  agentId: string;
  agentName: string;
  runId: string;
  candidate: Candidate;
  reasoning: Reasoning;
  confidence: number;
  source: "claude" | "synthesized";
  triggeredAt: string;
};

/**
 * POST a Block Kit message to Slack. Never throws — logs and returns.
 * Returns true if the message was sent, false otherwise (including when the
 * webhook isn't configured, which is an expected state in many envs).
 */
export async function postSlackNewDecision(p: SlackPayload): Promise<boolean> {
  const hook = process.env.SLACK_WEBHOOK_URL;
  if (!hook) return false;

  const link = `${PUBLIC_APP_URL}/agents/${p.agentId}?run=${p.runId}`;
  const fatigueBand =
    p.candidate.fatigue_score >= 85
      ? "CRITICAL"
      : p.candidate.fatigue_score >= 75
        ? "AT RISK"
        : "ELEVATED";
  const confPct = Math.round(p.confidence * 100);
  const topDrivers = p.reasoning.drivers
    .slice(0, 3)
    .map((d) => `• ${d.label}`)
    .join("\n");

  const body = {
    text: `${p.agentName}: ${fatigueBand} — ${p.candidate.name} · fatigue ${p.candidate.fatigue_score} · conf ${confPct}%`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `⚡ ${p.agentName} · ${fatigueBand}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Staff*\n${p.candidate.name}` },
          { type: "mrkdwn", text: `*Fatigue*\n${p.candidate.fatigue_score}/100` },
          {
            type: "mrkdwn",
            text: `*Confidence*\n${confPct}% (${p.source === "claude" ? "Claude" : "heuristic"})`,
          },
          { type: "mrkdwn", text: `*Run*\n\`${p.runId}\`` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Proposed action*\n${p.reasoning.proposed_action_description}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Top drivers*\n${topDrivers}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            style: "primary",
            text: { type: "plain_text", text: "Review & Approve" },
            url: link,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "View Ledger" },
            url: `${PUBLIC_APP_URL}/decisions-ledger?searchText=${encodeURIComponent(p.runId)}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `MAIA · ${new Date(p.triggeredAt).toLocaleString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit", second: "2-digit" })} UTC · jurisdiction ON-CA`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[slack] webhook returned ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[slack] post failed:", (e as Error).message);
    return false;
  }
}
