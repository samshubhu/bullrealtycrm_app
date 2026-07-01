import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui";
import { Badge } from "@/components/ui/badges";
import { Key, Webhook, Copy } from "lucide-react";

const ENDPOINTS = [
  ["POST", "/api/leads", "Create lead (lead capture) — send x-api-key header"],
  ["GET", "/api/leads", "List leads"],
  ["PUT", "/api/leads/:id", "Update lead"],
  ["POST", "/api/calls", "Log call / telephony webhook"],
  ["POST", "/api/whatsapp", "Send WhatsApp message"],
  ["POST", "/api/webhooks/meta-leads", "Meta Lead Ads webhook"],
];

const EVENTS = [
  "lead.created", "lead.updated", "call.started", "call.completed", "call.missed",
  "whatsapp.sent", "whatsapp.delivered", "whatsapp.read", "deal.created", "deal.updated",
  "task.created", "task.completed",
];

export default async function ApiWebhooksPage() {
  const supabase = await createClient();
  const [{ data: keys }, { data: logs }] = await Promise.all([
    supabase.from("api_keys").select("*").is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <div>
      <PageHeader title="API & Webhooks" subtitle="Integration keys, endpoints and webhook events" actions={<button className="btn-primary"><Key className="h-4 w-4" /> Generate key</button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <SectionTitle>API Keys</SectionTitle>
          {keys?.length ? (
            <div className="divide-y divide-ink-100">
              {keys.map((k: any) => (
                <div key={k.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{k.name}</p>
                    <p className="text-xs text-ink-400 font-mono">{k.prefix}••••••••</p>
                  </div>
                  <div className="flex gap-1">{(k.permissions ?? []).map((p: string) => <Badge key={p}>{p}</Badge>)}</div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Key} title="No API keys" description="Generate a key to enable lead capture from Meta, 99acres, and your website." />}
        </Card>

        <Card className="overflow-hidden">
          <SectionTitle>Endpoints</SectionTitle>
          <div className="divide-y divide-ink-100">
            {ENDPOINTS.map(([method, path, desc]) => (
              <div key={path + method} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`badge font-mono ${method === "GET" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>{method}</span>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-ink-800 truncate">{path}</p>
                  <p className="text-xs text-ink-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <SectionTitle>Webhook Events</SectionTitle>
          <div className="p-4 flex flex-wrap gap-2">
            {EVENTS.map((e) => <span key={e} className="badge bg-ink-100 text-ink-600 font-mono">{e}</span>)}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <SectionTitle>Recent Webhook Logs</SectionTitle>
          {logs?.length ? (
            <div className="divide-y divide-ink-100">
              {logs.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-mono text-ink-700">{l.event}</span>
                  <Badge className={l.status === "received" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>{l.status}</Badge>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Webhook} title="No webhook activity" />}
        </Card>
      </div>
    </div>
  );
}
