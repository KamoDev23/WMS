"use client";
import React, { useState, useMemo, useId, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Project } from "@/types/project";

type SortOrder = "asc" | "desc";

export interface ProjectsTableProps {
  projects: Project[];
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({ projects }) => {
  const router = useRouter();
  const data = projects ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  // Initially sort by "dateOpened" descending.
  const [sortColumn, setSortColumn] = useState<keyof Project>("dateOpened");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  // New state for rows per page with default 10
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">(10);

  // State for managing column visibility.
  const [visibleColumns, setVisibleColumns] = useState<Record<keyof Project, boolean>>({
    id: true,
    registrationNumber: true,
    vehicleType: true,
    typeOfWork: true,
    location: true,
    dateOpened: true,
    status: true,
    odometerReading: true,
  });

  const handleSort = (column: keyof Project) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const filteredProjects = useMemo(() => {
    return data.filter((project) =>
      Object.values(project).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, data]);

  const sortedProjects = useMemo(() => {
    if (!sortColumn) return filteredProjects;
    return [...filteredProjects].sort((a, b) => {
      const aVal = a[sortColumn].toString().toLowerCase();
      const bVal = b[sortColumn].toString().toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProjects, sortColumn, sortOrder]);

  const totalPages =
    rowsPerPage === "all" ? 1 : Math.ceil(sortedProjects.length / rowsPerPage);
  const paginatedProjects = useMemo(() => {
    if (rowsPerPage === "all") {
      return sortedProjects;
    }
    const start = (currentPage - 1) * rowsPerPage;
    return sortedProjects.slice(start, start + rowsPerPage);
  }, [sortedProjects, currentPage, rowsPerPage]);

  const handleRowClick = (id: string) => {
    router.push(`/projects/${id}`);
  };

  const toggleColumnVisibility = (column: keyof Project) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Options for rows per page dropdown.
  const rowsOptions: (number | "all")[] = [5, 10, 15, 20, "all"];

  return (
    <section className="p-2">
      <div className="flex items-center py-2">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
          ref={inputRef}
        />
        {/* Columns Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(visibleColumns).map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns[col as keyof Project]}
                onCheckedChange={() => toggleColumnVisibility(col as keyof Project)}
                className="capitalize"
              >
                {col}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Rows per page Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="ml-2">
              Rows: {rowsPerPage === "all" ? "All" : rowsPerPage} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Rows per page</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {rowsOptions.map((option) => (
              <DropdownMenuItem
                key={option.toString()}
                onSelect={() => {
                  setRowsPerPage(option);
                  setCurrentPage(1);
                }}
              >
                {option === "all" ? "All" : option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.id && (
                <TableHead onClick={() => handleSort("id")}>
                  Project ID {sortColumn === "id" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.registrationNumber && (
                <TableHead onClick={() => handleSort("registrationNumber")}>
                  Registration Number{" "}
                  {sortColumn === "registrationNumber"
                    ? sortOrder === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </TableHead>
              )}
              {visibleColumns.status && (
                <TableHead onClick={() => handleSort("status")}>
                  Status {sortColumn === "status" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.vehicleType && (
                <TableHead onClick={() => handleSort("vehicleType")}>
                  Vehicle Type {sortColumn === "vehicleType" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.typeOfWork && (
                <TableHead onClick={() => handleSort("typeOfWork")}>
                  Type of Work {sortColumn === "typeOfWork" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.location && (
                <TableHead onClick={() => handleSort("location")}>
                  Location {sortColumn === "location" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.dateOpened && (
                <TableHead onClick={() => handleSort("dateOpened")}>
                  Date {sortColumn === "dateOpened" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length ? (
              paginatedProjects.map((project) => (
                <TableRow
                  key={project.id}
                  onClick={() => handleRowClick(project.id)}
                  className="cursor-pointer hover:bg-muted"
                >
                  {visibleColumns.id && <TableCell>{project.id}</TableCell>}
                  {visibleColumns.registrationNumber && <TableCell>{project.registrationNumber}</TableCell>}
                  {visibleColumns.status && <TableCell>{project.status}</TableCell>}
                  {visibleColumns.vehicleType && <TableCell>{project.vehicleType}</TableCell>}
                  {visibleColumns.typeOfWork && <TableCell>{project.typeOfWork}</TableCell>}
                  {visibleColumns.location && <TableCell>{project.location}</TableCell>}
                  {visibleColumns.dateOpened && <TableCell>{project.dateOpened}</TableCell>}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    Object.keys(visibleColumns).filter((col) => visibleColumns[col as keyof Project]).length
                  }
                  className="text-center h-24"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </section>
  );
};

export default ProjectsTable;
