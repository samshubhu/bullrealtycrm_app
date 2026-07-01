import { requireProfile } from "@/lib/auth";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badges";
import { ROLE_LABELS } from "@/lib/constants";

export default async function ProfilePage() {
  const profile = await requireProfile();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile Settings" subtitle="Manage your account details" />
      <Card className="p-6 mb-4">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{profile.full_name}</h2>
            <p className="text-sm text-ink-500">{profile.email}</p>
            <Badge className="mt-1.5 bg-brand-50 text-brand-700">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>Account</SectionTitle>
        <div className="p-5 grid grid-cols-2 gap-4">
          <Field label="Full name" defaultValue={profile.full_name} />
          <Field label="Email" defaultValue={profile.email} disabled />
          <Field label="Phone" defaultValue={profile.phone ?? ""} />
          <Field label="DID number" defaultValue={profile.did_number ?? ""} />
        </div>
        <div className="border-t border-ink-100 px-5 py-3 flex justify-end">
          <button className="btn-primary">Save changes</button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, defaultValue, disabled }: { label: string; defaultValue: string; disabled?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input disabled:bg-ink-50" defaultValue={defaultValue} disabled={disabled} />
    </div>
  );
}
