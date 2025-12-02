"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TodaySalesPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/reports?tab=daily");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to daily sales report...</p>
    </div>
  );
};

export default TodaySalesPage;
