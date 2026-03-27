"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Client redirect so `output: export` (GitHub Pages) works; `redirect()` is not static-export friendly. */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-zinc-400">
      正在跳转…
    </div>
  );
}
