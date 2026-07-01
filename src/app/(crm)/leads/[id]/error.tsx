"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div>
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-500"><AlertTriangle className="h-6 w-6" /></span>
        <p className="font-medium text-ink-800">Couldn&apos;t load this lead</p>
        <p className="mt-1 text-sm text-ink-400">The record may have been deleted or you don&apos;t have access.</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/leads" className="btn-outline">Back to leads</Link>
        </div>
      </div>
    </div>
  );
}
