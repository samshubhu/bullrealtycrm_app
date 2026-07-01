import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm card p-8">
        <span className="grid place-items-center h-10 w-10 rounded-lg bg-brand-600 text-white mb-5">
          <Building2 className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-bold text-ink-900">Reset your password</h1>
        <p className="text-sm text-ink-500 mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <form className="mt-5 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@bullrealty.com" />
          </div>
          <button type="button" className="btn-primary w-full h-10">
            Send reset link
          </button>
        </form>
        <Link href="/login" className="mt-5 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
