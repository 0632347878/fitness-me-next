"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) { router.replace("/dashboard"); return; }

    const visited = localStorage.getItem("fm-visited");
    if (!visited) localStorage.setItem("fm-visited", "1");
    router.replace(visited ? "/login" : "/register");
  }, [router]);

  return null;
}
