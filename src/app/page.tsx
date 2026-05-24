"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Simple check: check if user session exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090e1a] text-slate-300">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="rounded-2xl bg-blue-600 p-4 text-white shadow-xl shadow-blue-500/20">
          <TrendingUp size={48} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Initializing Trade...</span>
      </div>
    </div>
  );
}
