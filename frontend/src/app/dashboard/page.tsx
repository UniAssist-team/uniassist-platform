'use client';
import Sidebar from '@/components/Sidebar';

export default function StudentDashboard() {
  const userRole = 'student';
  
  return (
    <div className="flex h-screen bg-zinc-50 font-sans">
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Student Dashboard Shell</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 font-medium">User</span>
            <div className="w-8 h-8 bg-zinc-200 rounded-full border border-zinc-300"></div>
          </div>
        </header>

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