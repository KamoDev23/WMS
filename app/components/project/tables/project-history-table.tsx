"use client";
import React, { useState, useEffect, useId, useRef } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  CircleXIcon,
  FilterIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";

interface ProjectHistoryTableProps {
  projects?: Project[];
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  showAllLink?: boolean;
  filterByStatus?: string;
}

// Define columns with appropriate status badge
const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "id",
    header: "Project ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "registrationNumber",
    header: "Registration Number",
    cell: ({ row }) => <div>{row.getValue("registrationNumber")}</div>,
  },
  {
    accessorKey: "vehicleType",
    header: "Vehicle Type",
    cell: ({ row }) => <div>{row.getValue("vehicleType")}</div>,
  },
  {
    accessorKey: "typeOfWork",
    header: "Type of Work",
    cell: ({ row }) => <div>{row.getValue("typeOfWork")}</div>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <div>{row.getValue("location")}</div>,
  },
  {
    accessorKey: "dateOpened",
    header: "Date Opened",
    cell: ({ row }) => <div>{row.getValue("dateOpened")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      // Determine badge variant based on status
      let variant: "default" | "secondary" | "outline" = "default";
      if (status === "Closed") variant = "outline";
      else if (status === "In Progress") variant = "secondary";
      
      return (
        <Badge variant={variant}>
          {status}
        </Badge>
      );
    },
  },
];

export function ProjectHistoryTable({
  projects = [],
  isLoading = false,
  onRefresh,
  title = "Open Projects",
  showAllLink = true,
  filterByStatus
}: ProjectHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter projects by status if filterByStatus is provided
  const filteredProjects = filterByStatus 
    ? projects.filter(project => project.status === filterByStatus)
    : projects;

  // Set up the table with global filtering, sorting, and pagination
  const table = useReactTable({
    data: filteredProjects,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with title and buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex space-x-2">
          
          {showAllLink && (
            <Button size="sm" onClick={() => router.push("/projects")}>
              View All Projects
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center justify-between gap-8">

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Global search bar */}
        <div className="relative w-full sm:w-96">
          <Input
            ref={inputRef}
            placeholder="Search projects..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
            }}
             className="ps-9 w-96"
          /> 
          <div className="absolute inset-y-0 start-0 flex items-center justify-center pl-3">
            <FilterIcon size={16} className="opacity-60" />
          </div>
          {globalFilter && (
            <button
              className="absolute inset-y-0 end-0 flex items-center pr-3 text-muted-foreground"
              onClick={() => {
                setGlobalFilter("");
                if (inputRef.current) inputRef.current.focus();
              }}
            >
              <CircleXIcon size={16} />
            </button>
          )}
        </div>
      </div>
      <div>
      {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}</div>
      </div>

      {/* Projects table */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-muted-foreground mb-4">No projects found</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : header.column.getCanSort() ? (
                          <div
                            className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                            tabIndex={0}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: (
                                <ChevronUpIcon size={16} className="opacity-60" />
                              ),
                              desc: (
                                <ChevronDownIcon size={16} className="opacity-60" />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => router.push(`/projects/${row.original.id}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="text-sm">
              Rows per page:
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Select number" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground flex-1 text-right">
            {table.getFilteredRowModel().rows.length} of {table.getRowCount()} row(s)
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectHistoryTable;