export default function Loading() {
  return (
    <div className="-m-5 flex h-[calc(100vh-3.5rem)] flex-col bg-ink-50">
      <div className="h-14 border-b border-ink-100 bg-white" />
      <div className="flex flex-1">
        <div className="w-[68px] border-r border-ink-100 bg-white" />
        <div className="flex-1 p-5">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
