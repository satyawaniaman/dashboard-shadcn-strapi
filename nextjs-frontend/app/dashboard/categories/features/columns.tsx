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

interface Category {
  id: number;
  name: string;
  description: string;
  documentId: string;
}

interface Filters {
  name: string;
  description: string;
}

export const getColumns = (
  filters: Filters,
  handleFilterChange: (key: string, value: string) => void,
  onEdit: (item: Category) => void,
  onDelete: (item: Category) => void,
): ColumnDef<Category>[] => [
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
    accessorKey: "description",
    header: () => (
      <ColumnFilter
        label="Description"
        placeholder="Filter description..."
        value={filters.description || ""}
        onChange={(val: string) => handleFilterChange("description", val)}
      />
    ),
    cell: (info) => info.getValue(),
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
