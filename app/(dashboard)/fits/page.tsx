"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FitsPageRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/sizing");
  }, [router]);

  return null;
}
