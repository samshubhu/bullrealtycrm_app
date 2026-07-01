import {
  LayoutDashboard, Users, Contact, Building2, Handshake, KanbanSquare,
  CheckSquare, Calendar, Phone, MessageCircle, Mail, Megaphone, Workflow,
  BarChart3, Home, UserCog, Settings, Webhook, Bell, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}

export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "CRM" },
  { label: "Leads", href: "/leads", icon: Users, group: "CRM" },
  { label: "Contacts", href: "/contacts", icon: Contact, group: "CRM" },
  { label: "Accounts", href: "/accounts", icon: Building2, group: "CRM" },
  { label: "Deals", href: "/deals", icon: Handshake, group: "CRM" },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare, group: "CRM" },

  { label: "Tasks", href: "/tasks", icon: CheckSquare, group: "Activities" },
  { label: "Calendar", href: "/calendar", icon: Calendar, group: "Activities" },
  { label: "Calls", href: "/calls", icon: Phone, group: "Activities" },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle, group: "Activities" },
  { label: "Email", href: "/email", icon: Mail, group: "Activities" },

  { label: "Campaigns", href: "/campaigns", icon: Megaphone, group: "Growth" },
  { label: "Automation", href: "/automation", icon: Workflow, group: "Growth" },
  { label: "Reports", href: "/reports", icon: BarChart3, group: "Growth" },
  { label: "Projects", href: "/projects", icon: Home, group: "Growth" },

  { label: "Team", href: "/team", icon: UserCog, group: "Admin" },
  { label: "Settings", href: "/settings", icon: Settings, group: "Admin" },
  { label: "API & Webhooks", href: "/api-webhooks", icon: Webhook, group: "Admin" },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "Admin" },
];

export const NAV_GROUPS = ["CRM", "Activities", "Growth", "Admin"];
