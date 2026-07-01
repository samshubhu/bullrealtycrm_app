"use client";

import { useState } from "react";
import { ArrowRight, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleKey = "leads" | "accounts" | "contacts" | "deals" | "pipeline";

const MODULE_HELP: Record<ModuleKey, {
  title: string;
  purpose: string;
  value: string;
  workflow: string[];
  employeeTip: string;
}> = {
  leads: {
    title: "Leads",
    purpose: "Raw enquiries from ads, portals, WhatsApp, calls, walk-ins, referrals, or campaigns.",
    value: "Sales teams use leads to qualify interest before creating long-term customer records. It keeps new demand fast, assignable, and easy to follow up.",
    workflow: [
      "Capture enquiry with source, project, budget, location, and phone.",
      "Assign owner and supporting manager.",
      "Call, qualify, schedule site visit or OBM, and update status.",
      "Convert qualified leads into Contact, Account, and Deal records.",
    ],
    employeeTip: "Use Leads for first-time enquiries. Convert only when the buyer is qualified enough to track as a real opportunity.",
  },
  accounts: {
    title: "Accounts",
    purpose: "The company, family, investor group, channel partner, or organization behind one or more contacts and deals.",
    value: "Accounts show the total relationship: all people, active deals, won revenue, hierarchy, ownership, and communication history in one place.",
    workflow: [
      "Create an account for a company, family office, investor group, broker, or repeat buyer.",
      "Attach all related contacts under the same account.",
      "Link every deal to the account so pipeline and revenue roll up correctly.",
      "Review account-level contacts, open pipeline, won revenue, notes, and history before follow-up.",
    ],
    employeeTip: "Use Accounts when one buyer group has multiple decision makers or repeat property opportunities.",
  },
  contacts: {
    title: "Contacts",
    purpose: "A real person: buyer, decision maker, investor, influencer, channel partner contact, or tenant contact.",
    value: "Contacts preserve relationship memory: phone, email, account, active deals, activities, calls, tasks, and follow-up context.",
    workflow: [
      "Create or convert a qualified lead into a contact.",
      "Attach the contact to an account when they belong to a company, family, or investor group.",
      "Create deals from the contact for each project/property opportunity.",
      "Track calls, WhatsApp, email, site visits, tasks, and last activity before each follow-up.",
    ],
    employeeTip: "Use Contacts for people you can call or message. One contact can influence multiple deals over time.",
  },
  deals: {
    title: "Deals",
    purpose: "A revenue opportunity for a specific buyer, project, property, unit, or booking journey.",
    value: "Deals make forecasting possible. Managers can see stage movement, deal value, expected close date, owner, project, account, and win/loss progress.",
    workflow: [
      "Create a deal from a qualified lead or contact.",
      "Connect the deal to contact, account, project, source, owner, and pipeline.",
      "Move it through stages: new opportunity, site visit, negotiation, booking, won, or lost.",
      "Use tasks, activities, and notes to keep next action clear until closure.",
    ],
    employeeTip: "Use Deals only when there is a real money opportunity. Keep value, stage, owner, and close date updated.",
  },
  pipeline: {
    title: "Pipeline",
    purpose: "A stage-wise board showing where each deal is in the sales journey.",
    value: "Pipeline helps managers and sales reps spot stuck deals, forecast revenue, and prioritize next actions.",
    workflow: [
      "Choose the right pipeline for the business process.",
      "Review deals by stage and owner.",
      "Move deals as site visits, OBM, negotiation, booking, won, or lost events happen.",
      "Use rotting/stale deal signals to rescue opportunities before they go cold.",
    ],
    employeeTip: "Use Pipeline daily to decide which deals need action now, not just to report numbers later.",
  },
};

export function ModuleHelp({ module, className }: { module: ModuleKey; className?: string }) {
  const [open, setOpen] = useState(false);
  const help = MODULE_HELP[module];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
          className,
        )}
        title={`${help.title} help`}
        aria-label={`${help.title} help`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-900/35 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Module guide</p>
                <h2 className="mt-1 text-lg font-semibold text-ink-900">{help.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                aria-label="Close help"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 text-sm text-ink-700">
              <section>
                <h3 className="font-semibold text-ink-900">What it does</h3>
                <p className="mt-1 leading-6">{help.purpose}</p>
              </section>
              <section>
                <h3 className="font-semibold text-ink-900">Value for sales</h3>
                <p className="mt-1 leading-6">{help.value}</p>
              </section>
              <section>
                <h3 className="font-semibold text-ink-900">Workflow</h3>
                <div className="mt-2 grid gap-2">
                  {help.workflow.map((step, index) => (
                    <div key={step} className="flex gap-2 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-brand-600 shadow-sm">
                        {index + 1}
                      </span>
                      <p className="leading-5">{step}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-3 text-brand-900">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-5">{help.employeeTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
