import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-600 text-white p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-white/15">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold">BullSales Suite</p>
            <p className="text-xs text-white/70">Real Estate CRM</p>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight max-w-md">
            Close more property deals with a CRM built for real estate teams.
          </h2>
          <p className="mt-4 text-white/80 max-w-md">
            Leads, calls, WhatsApp, site visits, pipeline and automation — all in one
            premium workspace.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              ["12k+", "Leads managed"],
              ["98%", "Faster follow-ups"],
              ["₹500Cr", "Pipeline tracked"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-xs text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/50">© 2026 Bull Realty Global</p>
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -top-16 -left-16 h-60 w-60 rounded-full bg-white/5" />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <p className="font-bold text-ink-900">BullSales Suite</p>
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="text-sm text-ink-500 mt-1">Sign in to your CRM workspace.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <div className="mt-6 rounded-lg bg-ink-50 border border-ink-100 p-3 text-xs text-ink-500">
            <p className="font-medium text-ink-600 mb-1">Demo accounts (password: password123)</p>
            <p>admin@bullrealty.com · manager@bullrealty.com · rahul@bullrealty.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
