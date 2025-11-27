"use client";

import ColumnFilter from "@/components/column-filter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";

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

interface Filters {
  name: string;
  description: string;
}

export const getColumns = (
  filters: Filters,
  handleFilterChange: (key: string, value: string) => void,
  onEdit: (item: Product) => void,
  onDelete: (item: Product) => void,
): ColumnDef<Product>[] => [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const images = row.original.image;
      const imageUrl =
        images && images.length > 0
          ? images[0].formats?.thumbnail?.url || images[0].url
          : null;

      return imageUrl ? (
        <Image
          src={`http://localhost:1337${imageUrl}`}
          alt={images[0].alternativeText || row.original.name}
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
          No image
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: () => (
      <ColumnFilter
        label="Name"
        placeholder="Filter name..."
        value={filters.name || ""}
        onChange={(val: string) => handleFilterChange("name", val)}
      />
    ),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;
      return category ? (
        category.name
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.price;
      return price ? (
        `₹${price.toLocaleString()}`
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock;
      return (
        <div className="text-center">
          <span className={stock > 0 ? " text-green-600" : "text-red-600"}>
            {stock}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ row }) => {
      const barcode = row.original.barcode;
      return barcode || <span className="text-muted-foreground">N/A</span>;
    },
  },
  {
    accessorKey: "description",
    header: () => (
      <ColumnFilter
        label="Description"
        placeholder="Filter description..."
        value={filters.description || ""}
        onChange={(val: string) => handleFilterChange("description", val)}
      />
    ),
    cell: ({ row }) => {
      const description = row.original.description;
      if (!description)
        return <span className="text-muted-foreground">N/A</span>;

      const maxLength = 80; // Character limit instead of word limit

      if (description.length > maxLength) {
        return (
          <span title={description} className="block max-w-xs truncate">
            {description.substring(0, maxLength)}...
          </span>
        );
      }

      return <span className="block max-w-xs">{description}</span>;
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => {
              onEdit(row.original);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              onDelete(row.original);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
