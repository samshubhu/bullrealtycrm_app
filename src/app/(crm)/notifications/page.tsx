import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Bell, UserPlus, Clock, AlertTriangle } from "lucide-react";

const ICON: Record<string, any> = {
  lead_assigned: { icon: UserPlus, color: "bg-brand-50 text-brand-600" },
  follow_up: { icon: Clock, color: "bg-amber-50 text-amber-600" },
  escalation: { icon: AlertTriangle, color: "bg-red-50 text-red-600" },
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  const list = data ?? [];

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${list.filter((n: any) => !n.read_at).length} unread`} />
      <Card className="overflow-hidden">
        {list.length ? (
          <div className="divide-y divide-ink-100">
            {list.map((n: any) => {
              const meta = ICON[n.type] ?? { icon: Bell, color: "bg-ink-100 text-ink-500" };
              const Icon = meta.icon;
              return (
                <Link key={n.id} href={n.link ?? "#"} className={`flex items-start gap-3 px-4 py-3 hover:bg-ink-50 ${!n.read_at ? "bg-brand-50/30" : ""}`}>
                  <span className={`grid place-items-center h-9 w-9 rounded-lg shrink-0 ${meta.color}`}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800">{n.title}</p>
                    <p className="text-xs text-ink-500">{n.body}</p>
                  </div>
                  <span className="text-xs text-ink-400 whitespace-nowrap">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        )}
      </Card>
    </div>
  );
}
