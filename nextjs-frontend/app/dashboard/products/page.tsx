"use client";

import { getColumns } from "./features/columns";
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
import { Dialog } from "@/components/ui/dialog";
import { New } from "./features/new";
import { toast } from "sonner";

interface Category {
  id: number;
  documentId: string;
  name: string;
  description: string;
}

interface Image {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  url: string;
  formats?: {
    thumbnail?: {
      url: string;
    };
    small?: {
      url: string;
    };
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  documentId: string;
  price: number;
  stock: number;
  barcode: string | null;
  category: Category | null;
  image: Image[];
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface Filters {
  name: string;
  description: string;
}

const Page = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    description: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const fetchData = async () => {
    const buildQuery = () => {
      const query = new URLSearchParams();
      query.set("pagination[page]", String(page));
      query.set("pagination[pageSize]", String(pageSize));
      query.set("populate[0]", "category");
      query.set("populate[1]", "image");
      if (filters.name) {
        query.set("filters[name][$containsi]", filters.name);
      }

      if (filters.description) {
        query.set("filters[description][$containsi]", filters.description);
      }

      return query.toString();
    };

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/products?${buildQuery()}`);

      setProducts(response.data.data);
      setMeta(response.data.meta.pagination);
    } catch (error) {
      console.log("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const handleDelete = async (item: Product) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await axiosInstance.delete(`/api/products/${item.documentId}`);
      await fetchData();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.log("Delete failed: ", error);
      toast.error("Failed to delete product");
    }
  };

  const columns = getColumns(
    filters,
    handleFilterChange,
    (item) => {
      setSelectedItem(item);
      setDialogOpen(true);
    },
    handleDelete,
  );

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            <span>List of products</span>
          </CardDescription>

          <CardAction>
            <Button
              onClick={() => {
                setSelectedItem(null);
                setDialogOpen(true);
              }}
            >
              Add a new record
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <New
                item={selectedItem}
                isOpen={dialogOpen}
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchData();
                }}
              />
            </Dialog>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <DataTable columns={columns} data={products} />
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center mt-4 text-sm text-muted-foreground">
            {meta && (
              <>
                {products.length === 0
                  ? "No rows"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${
                      (meta.page - 1) * meta.pageSize + products.length
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
