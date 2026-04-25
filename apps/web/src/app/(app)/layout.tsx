"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Client-side auth guard
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) router.replace("/login");
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-600 text-lg">💪 FitMe</span>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
              <Link href="/exercises" className="hover:text-gray-900">Exercises</Link>
              <Link href="/workouts" className="hover:text-gray-900">Workouts</Link>
              <Link href="/metrics" className="hover:text-gray-900">Metrics</Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

