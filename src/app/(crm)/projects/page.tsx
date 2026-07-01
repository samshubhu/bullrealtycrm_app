import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Badge } from "@/components/ui/badges";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Home, MapPin, Calendar, Building } from "lucide-react";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("*").order("name");

  // lead counts per project
  const { data: leadCounts } = await supabase.from("leads").select("project_id");
  const counts = new Map<string, number>();
  (leadCounts ?? []).forEach((l: any) => l.project_id && counts.set(l.project_id, (counts.get(l.project_id) ?? 0) + 1));

  const list = (projects ?? []) as any[];

  return (
    <div>
      <PageHeader title="Projects & Properties" subtitle={`${list.length} active projects`} />
      {list.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p) => (
            <Card key={p.id} className="overflow-hidden hover:shadow-pop transition">
              <div className="h-24 bg-gradient-to-br from-brand-500 to-brand-700 relative">
                <span className="absolute top-3 right-3"><Badge className="bg-white/20 text-white">{titleCase(p.status)}</Badge></span>
                <Building className="absolute bottom-3 left-4 h-8 w-8 text-white/40" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink-900">{p.name}</h3>
                <p className="text-xs text-ink-400">{p.developer}</p>
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 text-ink-600"><MapPin className="h-4 w-4 text-ink-400" /> {p.location}, {p.city}</p>
                  <p className="flex items-center gap-2 text-ink-600"><Home className="h-4 w-4 text-ink-400" /> {(p.unit_types ?? []).join(", ") || titleCase(p.property_type)}</p>
                  {p.possession_date && <p className="flex items-center gap-2 text-ink-600"><Calendar className="h-4 w-4 text-ink-400" /> Possession {new Date(p.possession_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-sm font-medium text-brand-600">{formatCurrency(p.price_min)} – {formatCurrency(p.price_max)}</span>
                  <span className="text-xs text-ink-400">{counts.get(p.id) ?? 0} leads</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={Home} title="No projects yet" /></Card>
      )}
    </div>
  );
}
