export default function StudentDashboard() {
  return (
    <div className="flex h-screen bg-zinc-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-zinc-800">UniAssist</div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="p-2 bg-zinc-800 rounded">Dashboard</div>
          <div className="p-2 text-zinc-400">Applications</div>
          <div className="p-2 text-zinc-400">Discounts</div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Student Dashboard Shell</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 font-medium">Ziya</span>
            <div className="w-8 h-8 bg-zinc-200 rounded-full border border-zinc-300"></div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <main className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-white border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400">
              Discounts Placeholder
            </div>
            <div className="h-40 bg-white border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400">
              Applications Placeholder
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}