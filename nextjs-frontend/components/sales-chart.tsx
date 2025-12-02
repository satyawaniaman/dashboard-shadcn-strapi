"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, ReferenceLine } from "recharts";
import React, { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JetBrains_Mono } from "next/font/google";
import { useMotionValueEvent, useSpring } from "motion/react";
import axiosInstance from "@/app/lib/axios";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CHART_MARGIN = 35;

interface Sale {
  id: number;
  date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
}

interface ChartDataPoint {
  month: string;
  revenue: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--secondary-foreground)",
  },
} satisfies ChartConfig;

export function SalesChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [growthRate, setGrowthRate] = useState(0);

  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Fetch sales from last 12 months
        const now = new Date();
        const twelveMonthsAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 11,
          1,
        );

        const query = new URLSearchParams();
        query.set("filters[date][$gte]", twelveMonthsAgo.toISOString());
        query.set("pagination[pageSize]", "1000");
        query.set("sort[0]", "date:asc");

        const response = await axiosInstance.get(`/api/sales?${query}`);
        const sales = response.data.data as Sale[];

        // Group sales by month
        const monthlyData: { [key: string]: number } = {};

        sales.forEach((sale) => {
          const date = new Date(sale.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const revenue =
            sale.subtotal + sale.tax_amount - sale.discount_amount;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          monthlyData[monthKey] += revenue;
        });

        // Create chart data for last 12 months
        const data: ChartDataPoint[] = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const monthName = date.toLocaleDateString("en-US", {
            month: "short",
          });

          data.push({
            month: monthName,
            revenue: Math.round(monthlyData[monthKey] || 0),
          });
        }

        setChartData(data);

        // Calculate growth rate (current month vs previous month)
        if (data.length >= 2) {
          const currentMonth = data[data.length - 1].revenue;
          const previousMonth = data[data.length - 2].revenue;

          if (previousMonth > 0) {
            const growth =
              ((currentMonth - previousMonth) / previousMonth) * 100;
            setGrowthRate(growth);
          }
        }
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const maxValueIndex = React.useMemo(() => {
    if (chartData.length === 0) return { index: 0, value: 0 };

    // if user is moving mouse over bar then set value to the bar value
    if (activeIndex !== undefined) {
      return { index: activeIndex, value: chartData[activeIndex].revenue };
    }
    // if no active index then set value to max value
    return chartData.reduce(
      (max, data, index) => {
        return data.revenue > max.value ? { index, value: data.revenue } : max;
      },
      { index: 0, value: 0 },
    );
  }, [activeIndex, chartData]);

  const maxValueIndexSpring = useSpring(maxValueIndex.value, {
    stiffness: 100,
    damping: 20,
  });

  const [springyValue, setSpringyValue] = React.useState(maxValueIndex.value);

  useMotionValueEvent(maxValueIndexSpring, "change", (latest: number) => {
    setSpringyValue(Number(latest.toFixed(0)));
  });

  React.useEffect(() => {
    maxValueIndexSpring.set(maxValueIndex.value);
  }, [maxValueIndex.value, maxValueIndexSpring]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="h-8 w-32 bg-muted rounded animate-pulse" />
          <CardDescription className="h-4 w-24 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={cn(jetBrainsMono.className, "text-2xl tracking-tighter")}
          >
            ₹{maxValueIndex.value.toLocaleString()}
          </span>
          <Badge variant="secondary">
            {growthRate >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4 rotate-180" />
            )}
            <span>
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </span>
          </Badge>
        </CardTitle>
        <CardDescription>
          {growthRate >= 0 ? "Growth" : "Decline"} vs. last month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              onMouseLeave={() => setActiveIndex(undefined)}
              margin={{
                left: CHART_MARGIN,
              }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
                {chartData.map((_, index) => (
                  <Cell
                    className="duration-200"
                    opacity={index === maxValueIndex.index ? 1 : 0.2}
                    key={index}
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </Bar>
              <ReferenceLine
                opacity={0.4}
                y={springyValue}
                stroke="var(--secondary-foreground)"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={<CustomReferenceLabel value={maxValueIndex.value} />}
              />
            </BarChart>
          </ChartContainer>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface CustomReferenceLabelProps {
  viewBox?: {
    x?: number;
    y?: number;
  };
  value: number;
}

const CustomReferenceLabel: React.FC<CustomReferenceLabelProps> = (props) => {
  const { viewBox, value } = props;
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;

  // we need to change width based on value length
  const width = React.useMemo(() => {
    const characterWidth = 8; // Average width of a character in pixels
    const padding = 10;
    return value.toString().length * characterWidth + padding;
  }, [value]);

  return (
    <>
      <rect
        x={x - CHART_MARGIN}
        y={y - 9}
        width={width}
        height={18}
        fill="var(--secondary-foreground)"
        rx={4}
      />
      <text
        fontWeight={600}
        x={x - CHART_MARGIN + 6}
        y={y + 4}
        fill="var(--primary-foreground)"
      >
        {value.toLocaleString()}
      </text>
    </>
  );
};
