// Integration catalog for MAIA for Buildings.

export type IntegrationCategory =
  | "pms"            // property management system (Yardi, Mintfield, RealPage)
  | "accounting"     // accounting / AP (QuickBooks, Xero)
  | "payments"       // Stripe, Plaid
  | "bms"            // building management / IoT
  | "utility"        // utility data (Toronto Hydro, Enbridge, Alectra)
  | "messaging"      // Slack, Twilio
  | "ai"             // LLM providers
  | "identity"       // SSO / Auth
  | "calendar"       // Google / O365 calendars
  | "storage"        // S3 / Vercel Blob for docs + images
  | "data"           // public data feeds (OpenWeather, Ontario Land Registry)
  | "monitoring";    // Sentry, Datadog

export type ConnectionStatus = "connected" | "available" | "beta" | "planned";

export interface Integration {
  id: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  purpose: string;
  dataIn: string[];          // what MAIA reads
  dataOut: string[];         // what MAIA writes
  cadence: string;
  authMethod: string;
  setupSteps: string[];
  status: ConnectionStatus;
  envKey?: string;
  docUrl?: string;
  usedBy: string[];          // agent ids
  accent: string;
}

export const INTEGRATIONS: Integration[] = [
  // PMS
  {
    id: "yardi-voyager",
    name: "Yardi Voyager",
    vendor: "Yardi Systems",
    category: "pms",
    purpose: "Primary PMS — tenants, leases, rent roll, vendor AP. Source of truth for most data.",
    dataIn: ["Tenant records", "Unit roll", "Lease terms", "Rent roll", "Vendor AP records", "Existing work orders"],
    dataOut: ["New work orders", "Work order status updates", "Assignee identity"],
    cadence: "Every 30 min + real-time webhooks on rent events",
    authMethod: "Yardi Web Services (SOAP) · username + password per property",
    setupSteps: [
      "Enable Yardi Web Services on your Voyager deployment",
      "Create a service-account user with read + write permissions",
      "Add credentials to Vercel secrets as YARDI_API_USER, YARDI_API_PASS",
      "Configure the property codes to sync in /configs",
      "Run initial backfill (takes 15–60 min depending on portfolio size)",
    ],
    status: "available",
    envKey: "YARDI_API_USER",
    docUrl: "/knowledge/integ-yardi-voyager",
    usedBy: ["arrears_sentinel", "vacancy_watcher", "dispatch_agent", "turnover_orchestrator"],
    accent: "#D97706",
  },
  {
    id: "buildium",
    name: "Buildium",
    vendor: "RealPage",
    category: "pms",
    purpose: "Alternative PMS option — full sync mirroring the Yardi integration pattern.",
    dataIn: ["Tenant records", "Lease roll", "Rent ledger", "Vendor records"],
    dataOut: ["Work orders", "Assignments"],
    cadence: "Hourly",
    authMethod: "OAuth 2.0",
    setupSteps: [
      "Generate OAuth client in Buildium admin",
      "Add BUILDIUM_CLIENT_ID and BUILDIUM_CLIENT_SECRET",
      "Authorize MAIA's callback URL",
      "Map Buildium property IDs to MAIA building IDs",
    ],
    status: "available",
    envKey: "BUILDIUM_CLIENT_ID",
    usedBy: ["arrears_sentinel", "vacancy_watcher"],
    accent: "#0EA5E9",
  },
  {
    id: "appfolio",
    name: "AppFolio Property Manager",
    vendor: "AppFolio",
    category: "pms",
    purpose: "US-centric PMS. Primarily for cross-border portfolios or US expansion.",
    dataIn: ["Tenants", "Leases", "Rent ledger"],
    dataOut: ["Work orders"],
    cadence: "Hourly",
    authMethod: "API key",
    setupSteps: [
      "Generate API key in AppFolio",
      "Add APPFOLIO_API_KEY",
      "Map property database IDs",
    ],
    status: "planned",
    envKey: "APPFOLIO_API_KEY",
    usedBy: ["arrears_sentinel"],
    accent: "#7C3AED",
  },

  // Payments
  {
    id: "stripe",
    name: "Stripe",
    vendor: "Stripe",
    category: "payments",
    purpose: "Rent collection processing — card + ACH + PAD. Powers Arrears Sentinel's real-time risk updates.",
    dataIn: ["charge.succeeded", "charge.failed", "charge.dispute.created", "invoice.*"],
    dataOut: ["Create PaymentIntent for rent", "Subscribe tenant to recurring rent"],
    cadence: "Real-time webhooks + 15-min reconciliation",
    authMethod: "Restricted API key + webhook signing secret",
    setupSteps: [
      "Create a restricted API key with the required scopes (charges, customers, subscriptions)",
      "Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Vercel",
      "Point Stripe webhook endpoint at /api/webhooks/stripe",
      "Verify signature + test event flow in dashboard",
    ],
    status: "available",
    envKey: "STRIPE_SECRET_KEY",
    docUrl: "/knowledge/integ-stripe",
    usedBy: ["arrears_sentinel"],
    accent: "#635BFF",
  },
  {
    id: "plaid",
    name: "Plaid",
    vendor: "Plaid",
    category: "payments",
    purpose: "Bank account verification for pre-authorised debit setup — reduces payment failure rate.",
    dataIn: ["Account verified", "Balance signal (when permitted)"],
    dataOut: ["Link token request"],
    cadence: "On-demand at lease signing + periodic re-verification",
    authMethod: "Client ID + secret · separate for sandbox / development / production",
    setupSteps: [
      "Sign up + set up Plaid sandbox",
      "Add PLAID_CLIENT_ID + PLAID_SECRET + PLAID_ENV",
      "Enable Auth + Identity products",
      "Wire Link component into lease-signing flow",
    ],
    status: "planned",
    envKey: "PLAID_CLIENT_ID",
    usedBy: ["arrears_sentinel"],
    accent: "#00B9FF",
  },

  // BMS / IoT
  {
    id: "johnson-metasys",
    name: "Johnson Controls Metasys",
    vendor: "Johnson Controls",
    category: "bms",
    purpose: "BMS integration for live HVAC + lighting telemetry + setpoint overrides.",
    dataIn: ["Zone temperatures", "Setpoints", "Runtime", "Equipment alarms", "Sub-metered kWh"],
    dataOut: ["Setpoint override commands"],
    cadence: "5-minute polling · real-time alarm push",
    authMethod: "Per-building credentials · BACnet/IP or Metasys API",
    setupSteps: [
      "Deploy Metasys gateway with external API exposed",
      "Create a read-write service account scoped to your buildings",
      "Add BMS_<BUILDING_ID>_CREDENTIALS to Vercel",
      "Map zones to MAIA zone IDs in /configs",
      "Test with a single zone before enabling portfolio-wide",
    ],
    status: "beta",
    envKey: "BMS_CREDENTIALS",
    docUrl: "/knowledge/integ-bms",
    usedBy: ["energy_optimizer"],
    accent: "#0EA5E9",
  },
  {
    id: "siemens-desigo",
    name: "Siemens Desigo CC",
    vendor: "Siemens",
    category: "bms",
    purpose: "BMS alternative · BACnet + native REST + MQTT.",
    dataIn: ["Telemetry", "Alarms", "Trend logs"],
    dataOut: ["Setpoint overrides"],
    cadence: "5-minute polling",
    authMethod: "API token per site",
    setupSteps: [
      "Enable the Desigo CC REST API on your installation",
      "Create a service account with Read/Write on the HVAC objects",
      "Add DESIGO_<BUILDING_ID>_TOKEN",
      "Import object list into MAIA",
    ],
    status: "beta",
    envKey: "DESIGO_TOKEN",
    usedBy: ["energy_optimizer"],
    accent: "#009999",
  },
  {
    id: "honeywell-webs",
    name: "Honeywell WEBs",
    vendor: "Honeywell",
    category: "bms",
    purpose: "BACnet-native BMS integration for Honeywell-equipped buildings.",
    dataIn: ["BACnet objects", "Alarms", "Runtime"],
    dataOut: ["Setpoint + schedule overrides"],
    cadence: "5-minute polling",
    authMethod: "Per-gateway credentials",
    setupSteps: [
      "Expose WEBs via VPN or dedicated gateway",
      "Add HONEYWELL_<BUILDING_ID>_CREDENTIALS",
    ],
    status: "planned",
    envKey: "HONEYWELL_CREDENTIALS",
    usedBy: ["energy_optimizer"],
    accent: "#E61E28",
  },

  // Utility
  {
    id: "toronto-hydro",
    name: "Toronto Hydro Green Button",
    vendor: "Toronto Hydro",
    category: "utility",
    purpose: "15-minute interval electricity data for each meter — drives the Energy Optimizer's baseline + savings attribution.",
    dataIn: ["15-min interval kWh per meter", "TOU classification", "Monthly bill summaries"],
    dataOut: [],
    cadence: "Daily pull + monthly reconcile",
    authMethod: "Green Button OAuth per customer account",
    setupSteps: [
      "Have each building's account holder authorise Green Button access",
      "Add GREEN_BUTTON_CLIENT_ID + SECRET",
      "Backfill 12 months of interval data (run once on connect)",
    ],
    status: "available",
    envKey: "GREEN_BUTTON_CLIENT_ID",
    usedBy: ["energy_optimizer"],
    accent: "#003DA5",
  },
  {
    id: "enbridge-gas",
    name: "Enbridge Gas",
    vendor: "Enbridge",
    category: "utility",
    purpose: "Natural gas consumption data — used for heating benchmark + Scope 1 carbon tracking.",
    dataIn: ["Monthly therm consumption per meter", "Bill amounts"],
    dataOut: [],
    cadence: "Monthly",
    authMethod: "API key after account holder consent",
    setupSteps: [
      "Authorise third-party access on Enbridge My Account",
      "Add ENBRIDGE_API_KEY",
    ],
    status: "planned",
    envKey: "ENBRIDGE_API_KEY",
    usedBy: ["energy_optimizer"],
    accent: "#009E49",
  },

  // Messaging
  {
    id: "slack",
    name: "Slack",
    vendor: "Slack",
    category: "messaging",
    purpose: "Alert routing for critical events — #ops-alerts, #collections, #compliance channels.",
    dataIn: [],
    dataOut: ["Alert messages to channels", "DMs to specific on-call"],
    cadence: "Real-time · fires on agent events",
    authMethod: "Slack Incoming Webhook (per channel) or Bot OAuth token",
    setupSteps: [
      "Create a Slack app in your workspace",
      "Add Incoming Webhooks to #ops-alerts, #collections, #compliance",
      "Add SLACK_WEBHOOK_OPS + SLACK_WEBHOOK_COLLECTIONS to Vercel",
      "Test via the Notifications section in Settings",
    ],
    status: "connected",
    envKey: "SLACK_WEBHOOK_OPS",
    usedBy: ["dispatch_agent", "arrears_sentinel", "compliance_sentinel"],
    accent: "#611F69",
  },
  {
    id: "twilio",
    name: "Twilio",
    vendor: "Twilio",
    category: "messaging",
    purpose: "SMS to tenants for high-priority events (flooding, no heat, access issues).",
    dataIn: ["SMS delivery receipts", "Inbound SMS (tenant reply)"],
    dataOut: ["Outbound SMS"],
    cadence: "Real-time",
    authMethod: "Account SID + Auth Token",
    setupSteps: [
      "Create Twilio account + purchase a sender number",
      "Add TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER",
      "Configure inbound webhook URL for replies",
    ],
    status: "available",
    envKey: "TWILIO_ACCOUNT_SID",
    usedBy: ["dispatch_agent", "arrears_sentinel"],
    accent: "#F22F46",
  },
  {
    id: "resend",
    name: "Resend",
    vendor: "Resend",
    category: "messaging",
    purpose: "Transactional email delivery — N4 cover letters, rent reminders, entry notices, work-order confirmations.",
    dataIn: ["Bounce / delivery events"],
    dataOut: ["Email messages"],
    cadence: "Real-time",
    authMethod: "API key",
    setupSteps: [
      "Sign up at resend.com + verify your sending domain",
      "Add RESEND_API_KEY",
      "Configure SPF + DKIM on your domain",
    ],
    status: "available",
    envKey: "RESEND_API_KEY",
    usedBy: ["arrears_sentinel", "compliance_sentinel"],
    accent: "#0F172A",
  },

  // AI
  {
    id: "anthropic",
    name: "Anthropic · Claude",
    vendor: "Anthropic",
    category: "ai",
    purpose: "Reasoning LLM for agent rationales, weekly briefings, escalation drafts.",
    dataIn: [],
    dataOut: ["Prompt + context payloads"],
    cadence: "On-demand + scheduled weekly briefing",
    authMethod: "API key",
    setupSteps: [
      "Sign up at anthropic.com + generate a workspace key",
      "Add ANTHROPIC_API_KEY",
      "Monitor token usage in Anthropic console",
    ],
    status: "connected",
    envKey: "ANTHROPIC_API_KEY",
    usedBy: ["briefing_composer", "dispatch_agent", "arrears_sentinel"],
    accent: "#C15F3C",
  },
  {
    id: "openai",
    name: "OpenAI",
    vendor: "OpenAI",
    category: "ai",
    purpose: "Alternative / fallback LLM for reasoning + embeddings for knowledge retrieval.",
    dataIn: [],
    dataOut: ["Prompts", "Embedding requests"],
    cadence: "On-demand",
    authMethod: "API key",
    setupSteps: [
      "Create an OpenAI account and API key",
      "Add OPENAI_API_KEY",
    ],
    status: "available",
    envKey: "OPENAI_API_KEY",
    usedBy: ["briefing_composer"],
    accent: "#10B981",
  },

  // Data
  {
    id: "supabase",
    name: "Supabase",
    vendor: "Supabase",
    category: "storage",
    purpose: "Primary data store — all \`ry_*\` tables + auth + RLS.",
    dataIn: ["All MAIA state"],
    dataOut: ["All MAIA state"],
    cadence: "Continuous",
    authMethod: "Service role key + anon key",
    setupSteps: [
      "Already provisioned for MAIA deployment",
      "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_ANON_KEY set",
    ],
    status: "connected",
    envKey: "SUPABASE_SERVICE_ROLE_KEY",
    usedBy: ["dispatch_agent", "arrears_sentinel", "energy_optimizer", "compliance_sentinel", "vacancy_watcher", "turnover_orchestrator", "briefing_composer", "work_order_market"],
    accent: "#3ECF8E",
  },
  {
    id: "google-maps",
    name: "Google Maps",
    vendor: "Google Cloud",
    category: "data",
    purpose: "Portfolio Map rendering + geocoding for new property addresses.",
    dataIn: [],
    dataOut: ["Map tiles + geocode requests"],
    cadence: "On-demand",
    authMethod: "API key · domain-restricted",
    setupSteps: [
      "Create a Google Cloud project with Maps JavaScript API enabled",
      "Generate an API key and restrict to your production domains",
      "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to Vercel",
    ],
    status: "connected",
    envKey: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    usedBy: [],
    accent: "#4285F4",
  },
  {
    id: "open-weather",
    name: "OpenWeather",
    vendor: "OpenWeather",
    category: "data",
    purpose: "Weather forecasts feeding the Energy Optimizer's heating/cooling load predictions.",
    dataIn: ["Hourly forecasts · 7 days"],
    dataOut: [],
    cadence: "Hourly",
    authMethod: "API key",
    setupSteps: [
      "Create an account + generate a key",
      "Add OPENWEATHER_API_KEY",
    ],
    status: "available",
    envKey: "OPENWEATHER_API_KEY",
    usedBy: ["energy_optimizer"],
    accent: "#EB6E4B",
  },

  // Identity
  {
    id: "google-sso",
    name: "Google Workspace SSO",
    vendor: "Google",
    category: "identity",
    purpose: "Single sign-on for Royal York managers via Google Workspace.",
    dataIn: ["User profile"],
    dataOut: [],
    cadence: "Session-based",
    authMethod: "OAuth 2.0",
    setupSteps: [
      "Set up OAuth consent screen in Google Cloud",
      "Add GOOGLE_OAUTH_CLIENT_ID and SECRET to Supabase Auth config",
      "Restrict to royalyorkproperty.com domain",
    ],
    status: "available",
    envKey: "GOOGLE_OAUTH_CLIENT_ID",
    usedBy: [],
    accent: "#4285F4",
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365 SSO",
    vendor: "Microsoft",
    category: "identity",
    purpose: "SSO for M365-based orgs.",
    dataIn: ["User profile"],
    dataOut: [],
    cadence: "Session-based",
    authMethod: "OAuth 2.0 + Azure AD",
    setupSteps: [
      "Register app in Azure AD",
      "Configure redirect URI + scopes",
      "Add MS_OAUTH_CLIENT_ID + SECRET",
    ],
    status: "planned",
    envKey: "MS_OAUTH_CLIENT_ID",
    usedBy: [],
    accent: "#00A4EF",
  },

  // Monitoring
  {
    id: "sentry",
    name: "Sentry",
    vendor: "Sentry",
    category: "monitoring",
    purpose: "Error tracking for MAIA runtime + agent runs.",
    dataIn: [],
    dataOut: ["Errors + traces"],
    cadence: "Real-time",
    authMethod: "DSN",
    setupSteps: [
      "Create a Next.js project in Sentry",
      "Add SENTRY_DSN + SENTRY_AUTH_TOKEN",
    ],
    status: "available",
    envKey: "SENTRY_DSN",
    usedBy: [],
    accent: "#362D59",
  },
];

export const CATEGORY_META: Record<IntegrationCategory, { label: string; color: string }> = {
  pms:        { label: "Property Management",  color: "#D97706" },
  accounting: { label: "Accounting",           color: "#0891B2" },
  payments:   { label: "Payments",             color: "#635BFF" },
  bms:        { label: "Building Mgmt (BMS)",  color: "#0EA5E9" },
  utility:    { label: "Utility",              color: "#059669" },
  messaging:  { label: "Messaging",            color: "#611F69" },
  ai:         { label: "AI",                   color: "#C15F3C" },
  identity:   { label: "Identity / SSO",       color: "#4285F4" },
  calendar:   { label: "Calendar",             color: "#4285F4" },
  storage:    { label: "Storage",              color: "#3ECF8E" },
  data:       { label: "Data feeds",           color: "#64748B" },
  monitoring: { label: "Monitoring",           color: "#362D59" },
};

export const STATUS_META: Record<ConnectionStatus, { label: string; color: string; bg: string }> = {
  connected: { label: "Connected", color: "#059669", bg: "rgba(16,185,129,0.1)" },
  available: { label: "Available", color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  beta:      { label: "Beta",      color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  planned:   { label: "Planned",   color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};
