import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role =
  | "super_admin"
  | "admin"
  | "sales_manager"
  | "sales_executive"
  | "telecaller"
  | "marketing"
  | "support"
  | "accounts";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  team_id: string | null;
  status: string;
  avatar_url: string | null;
  did_number: string | null;
}

/** Returns the current auth user + profile, or null. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, team_id, status, avatar_url, did_number")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}

/** Use in protected pages — redirects to /login when unauthenticated. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export const MANAGER_ROLES: Role[] = ["super_admin", "admin", "sales_manager"];
export const ADMIN_ROLES: Role[] = ["super_admin", "admin"];

export function isManager(role: Role) {
  return MANAGER_ROLES.includes(role);
}
export function isAdmin(role: Role) {
  return ADMIN_ROLES.includes(role);
}
