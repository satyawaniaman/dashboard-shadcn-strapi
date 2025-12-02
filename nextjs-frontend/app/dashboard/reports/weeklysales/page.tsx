"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const WeeklySalesPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/reports?tab=weekly");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to weekly sales report...</p>
    </div>
  );
};

export default WeeklySalesPage;
