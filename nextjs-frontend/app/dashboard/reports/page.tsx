"use client";

import { getReportColumns } from "@/app/dashboard/reports/features/columns";
import { DataTable } from "./features/data-table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconCalendar,
  IconCalendarWeek,
  IconCalendarMonth,
  IconDownload,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

interface Product {
  id: number;
  documentId: string;
  name: string;
}

interface SaleProduct {
  product: Product;
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  documentId: string;
  date: string;
  total: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  invoice_number: string;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  notes: string;
  products?: SaleProduct[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface Filters {
  customer_name: string;
  invoice_number: string;
}

interface ReportStats {
  totalSales: number;
  totalInvoices: number;
  averageSale: number;
  totalRevenue: number;
}

const Page = () => {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "daily";

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    customer_name: "",
    invoice_number: "",
  });
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [stats, setStats] = useState<ReportStats>({
    totalSales: 0,
    totalInvoices: 0,
    averageSale: 0,
    totalRevenue: 0,
  });

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getDateRange = (type: string) => {
    const now = new Date();
    let endDate = new Date();
    let startDate = new Date();

    switch (type) {
      case "daily":
        // Today
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        // Last 7 days
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const fetchData = async () => {
    const buildQuery = () => {
      const query = new URLSearchParams();
      query.set("pagination[page]", String(page));
      query.set("pagination[pageSize]", String(pageSize));
      query.set("sort[0]", "date:desc");
      query.set("populate[0]", "products.product");

      // Add date range filters
      const { startDate, endDate } = getDateRange(activeTab);
      query.set("filters[date][$gte]", startDate);
      query.set("filters[date][$lte]", endDate);

      if (filters.customer_name) {
        query.set("filters[customer_name][$containsi]", filters.customer_name);
      }

      if (filters.invoice_number) {
        query.set(
          "filters[invoice_number][$containsi]",
          filters.invoice_number,
        );
      }

      return query.toString();
    };

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/sales?${buildQuery()}`);
      setSales(response.data.data);
      setMeta(response.data.meta.pagination);

      // Calculate stats
      const salesData = response.data.data as Sale[];
      const totalRevenue = salesData.reduce((sum, sale) => {
        return sum + (sale.subtotal + sale.tax_amount - sale.discount_amount);
      }, 0);

      setStats({
        totalSales: salesData.reduce((sum, sale) => sum + sale.subtotal, 0),
        totalInvoices: salesData.length,
        averageSale: salesData.length > 0 ? totalRevenue / salesData.length : 0,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.log("Failed to fetch sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters, activeTab]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const handleExportReport = () => {
    const reportType = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    // Create CSV content
    const headers = [
      "Invoice #",
      "Date",
      "Customer",
      "Email",
      "Phone",
      "Subtotal",
      "Tax",
      "Discount",
      "Total",
    ];
    const rows = sales.map((sale) => {
      const total = sale.subtotal + sale.tax_amount - sale.discount_amount;
      return [
        sale.invoice_number,
        new Date(sale.date).toLocaleDateString(),
        sale.customer_name,
        sale.customer_email,
        sale.customer_phone,
        sale.subtotal,
        sale.tax_amount,
        sale.discount_amount,
        total,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const columns = getReportColumns(filters, handleFilterChange);

  const StatsCard = ({
    title,
    value,
    subtitle,
  }: {
    title: string;
    value: string;
    subtitle?: string;
  }) => (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Sales Reports</CardTitle>
          <CardDescription>
            <span>View daily, weekly, and monthly sales reports</span>
          </CardDescription>

          <CardAction>
            <Button onClick={handleExportReport} className="gap-2">
              <IconDownload className="h-4 w-4" />
              Export Report
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="daily" className="gap-2">
                <IconCalendar className="h-4 w-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-2">
                <IconCalendarWeek className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                <IconCalendarMonth className="h-4 w-4" />
                Monthly
              </TabsTrigger>
            </TabsList>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Total Revenue"
                value={`₹${stats.totalRevenue.toLocaleString()}`}
                subtitle="Including tax and discounts"
              />
              <StatsCard
                title="Total Sales"
                value={`₹${stats.totalSales.toLocaleString()}`}
                subtitle="Subtotal amount"
              />
              <StatsCard
                title="Total Invoices"
                value={stats.totalInvoices.toString()}
                subtitle={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} period`}
              />
              <StatsCard
                title="Average Sale"
                value={`₹${stats.averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                subtitle="Per invoice"
              />
            </div>

            <TabsContent value="daily" className="mt-0">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <DataTable columns={columns} data={sales} />
              )}
            </TabsContent>

            <TabsContent value="weekly" className="mt-0">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <DataTable columns={columns} data={sales} />
              )}
            </TabsContent>

            <TabsContent value="monthly" className="mt-0">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <DataTable columns={columns} data={sales} />
              )}
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center mt-4 text-sm text-muted-foreground">
            {meta && (
              <>
                {sales.length === 0
                  ? "No rows"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${
                      (meta.page - 1) * meta.pageSize + sales.length
                    } of ${meta.total} rows`}
              </>
            )}

            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>Rows per page</span>
            </div>

            <span className="whitespace-nowrap">
              Page {meta?.page} of {meta?.pageCount}
            </span>

            {/* pagination buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, meta?.pageCount || 1))
                }
                disabled={page === meta?.pageCount}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(meta?.pageCount || 1)}
                disabled={page === meta?.pageCount}
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
