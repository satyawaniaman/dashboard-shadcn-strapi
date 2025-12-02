"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/lib/axios";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Sale {
  id: number;
  date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
}

interface RevenueStats {
  today: number;
  weekly: number;
  monthly: number;
  lastMonth: number;
  growthRate: number;
}

export function SectionCardsSales() {
  const [stats, setStats] = useState<RevenueStats>({
    today: 0,
    weekly: 0,
    monthly: 0,
    lastMonth: 0,
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const now = new Date();

        // Helper to get date range
        const getDateRange = (type: string) => {
          let startDate = new Date();
          let endDate = new Date();

          switch (type) {
            case "today":
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
            case "weekly":
              startDate.setDate(now.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
            case "monthly":
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
            case "lastMonth":
              startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              endDate = new Date(now.getFullYear(), now.getMonth(), 0);
              endDate.setHours(23, 59, 59, 999);
              break;
          }

          return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };
        };

        // Fetch data for each period
        const fetchPeriod = async (type: string) => {
          const { startDate, endDate } = getDateRange(type);
          const query = new URLSearchParams();
          query.set("filters[date][$gte]", startDate);
          query.set("filters[date][$lte]", endDate);
          query.set("pagination[pageSize]", "100");

          const response = await axiosInstance.get(`/api/sales?${query}`);
          const sales = response.data.data as Sale[];

          return sales.reduce((total, sale) => {
            return (
              total + (sale.subtotal + sale.tax_amount - sale.discount_amount)
            );
          }, 0);
        };

        const [todayRevenue, weeklyRevenue, monthlyRevenue, lastMonthRevenue] =
          await Promise.all([
            fetchPeriod("today"),
            fetchPeriod("weekly"),
            fetchPeriod("monthly"),
            fetchPeriod("lastMonth"),
          ]);

        // Calculate growth rate
        const growth =
          lastMonthRevenue > 0
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        setStats({
          today: todayRevenue,
          weekly: weeklyRevenue,
          monthly: monthlyRevenue,
          lastMonth: lastMonthRevenue,
          growthRate: growth,
        });
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <CardDescription className="h-4 w-24 bg-muted rounded" />
              <CardTitle className="h-8 w-32 bg-muted rounded mt-2" />
            </CardHeader>
            <CardFooter className="h-12 bg-muted/50 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today&apos;s Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.today)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.today > 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {stats.today > 0 ? "Active" : "No sales"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sales from today
          </div>
          <div className="text-muted-foreground">
            Total revenue including tax and discounts
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Weekly Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.weekly)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Last 7 days
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Performance this week <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Revenue from the past 7 days
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Monthly Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.monthly)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              This month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current month total <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total revenue for {new Date().toLocaleDateString("en-US", { month: "long" })}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatPercentage(stats.growthRate)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.growthRate >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(stats.growthRate)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.growthRate >= 0 ? (
              <>
                Growth vs last month <IconTrendingUp className="size-4" />
              </>
            ) : (
              <>
                Decline vs last month <IconTrendingDown className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            Compared to previous month
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
