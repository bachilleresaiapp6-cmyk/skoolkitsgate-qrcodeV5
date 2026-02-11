"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/splash-screen";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth");
    }, 5000); // 5 second splash screen

    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen />;
}
