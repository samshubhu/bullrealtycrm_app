export default function Loading() {
  return (
    <div>
      {/* top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-5 w-40 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-20 rounded-lg" />
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr] min-[1400px]:grid-cols-[300px_1fr_340px]">
        {/* left summary */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="skeleton h-14 w-14 rounded-full" />
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
          </div>
          <div className="card p-4">
            <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
          </div>
        </div>

        {/* center workspace */}
        <div className="space-y-4">
          <div className="skeleton h-12 rounded-xl" />
          <div className="card p-4">
            <div className="mb-4 flex gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-7 w-16 rounded-full" />)}</div>
            <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
          </div>
        </div>

        {/* right rail */}
        <div className="space-y-4 lg:col-span-2 min-[1400px]:col-span-1">
          {[0, 1, 2].map((i) => <div key={i} className="card p-4"><div className="skeleton h-4 w-24 rounded" /><div className="mt-3 space-y-2.5">{[0, 1, 2].map((j) => <div key={j} className="skeleton h-9 rounded-lg" />)}</div></div>)}
        </div>
      </div>
    </div>
  );
}
