"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MonthlySalesPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/reports?tab=monthly");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to monthly sales report...</p>
    </div>
  );
};

export default MonthlySalesPage;
