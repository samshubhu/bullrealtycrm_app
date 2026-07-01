import { formatDistanceToNow } from "date-fns";
import {
  UserPlus, UserCheck, Phone, MessageCircle, Mail, StickyNote, CheckSquare,
  RefreshCw, Handshake, MapPin, Trophy, Circle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  lead_created: { icon: UserPlus, color: "bg-brand-500" },
  lead_assigned: { icon: UserCheck, color: "bg-indigo-500" },
  call_made: { icon: Phone, color: "bg-violet-500" },
  whatsapp_sent: { icon: MessageCircle, color: "bg-emerald-500" },
  email_sent: { icon: Mail, color: "bg-sky-500" },
  note_added: { icon: StickyNote, color: "bg-amber-500" },
  task_created: { icon: CheckSquare, color: "bg-orange-500" },
  task_completed: { icon: CheckSquare, color: "bg-green-500" },
  status_changed: { icon: RefreshCw, color: "bg-blue-500" },
  deal_created: { icon: Handshake, color: "bg-teal-500" },
  site_visit: { icon: MapPin, color: "bg-fuchsia-500" },
  lead_converted: { icon: Trophy, color: "bg-green-600" },
};

export interface TimelineItem {
  id: string;
  type: string;
  description: string;
  created_at: string;
  actor?: { full_name: string } | null;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-ink-400 py-8 text-center">No activity recorded yet.</p>;
  }
  return (
    <ol className="relative ml-3 border-l border-ink-100">
      {items.map((it) => {
        const meta = ICONS[it.type] ?? { icon: Circle, color: "bg-ink-400" };
        const Icon = meta.icon;
        return (
          <li key={it.id} className="mb-5 ml-6">
            <span className={cn("absolute -left-3 grid place-items-center h-6 w-6 rounded-full text-white ring-4 ring-white", meta.color)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-800">{it.description}</p>
              <time className="text-xs text-ink-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}
              </time>
            </div>
            {it.actor?.full_name && <p className="text-xs text-ink-400 mt-0.5">by {it.actor.full_name}</p>}
          </li>
        );
      })}
    </ol>
  );
}
