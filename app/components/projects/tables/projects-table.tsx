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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define status badge variants and colors
const getStatusBadgeProps = (status: string) => {
  switch (status) {
    case "Open":
      return {
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600"
      };
    case "Closed":
      return {
        variant: "secondary" as const,
        className: "bg-green-500 text-white hover:bg-green-600"
      };
    case "In Progress":
      return {
        variant: "outline" as const,
        className: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
      };
    case "Cancelled":
      return {
        variant: "destructive" as const,
        className: "bg-red-500 hover:bg-red-600"
      };
    case "On Hold":
      return {
        variant: "outline" as const,
        className: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
      };
    case "Pending":
      return {
        variant: "outline" as const,
        className: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
      };
    default:
      return {
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
      };
  }
};

// StatusBadge component
const StatusBadge = ({ status }: { status: string }) => {
  const { variant, className } = getStatusBadgeProps(status);
  
  return (
    <Badge variant={variant} className={cn(className)}>
      {status}
    </Badge>
  );
};

type SortOrder = "asc" | "desc";

// Define filter interface
interface Filters {
  status: string | null;
  vehicleType: string | null;
  typeOfWork: string | null;
  location: string | null;
}

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
  
  // Filter states
  const [filters, setFilters] = useState<Filters>({
    status: null,
    vehicleType: null,
    typeOfWork: null,
    location: null
  });

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
    dateClosed: true,
  });

  // Extract unique values for each filter
  const filterOptions = useMemo(() => {
    return {
      status: Array.from(new Set(data.map(project => project.status))).sort(),
      vehicleType: Array.from(new Set(data.map(project => project.vehicleType))).sort(),
      typeOfWork: Array.from(new Set(data.map(project => project.typeOfWork))).sort(),
      location: Array.from(new Set(data.map(project => project.location))).sort(),
    };
  }, [data]);

  const handleSort = (column: keyof Project) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  // Update filter handler
  const updateFilter = (type: keyof Filters, value: string | null) => {
    setFilters(prev => ({ ...prev, [type]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: null,
      vehicleType: null,
      typeOfWork: null,
      location: null
    });
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredProjects = useMemo(() => {
    return data
      // Apply search filter
      .filter((project) =>
        Object.values(project).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      // Apply category filters
      .filter(project => 
        (!filters.status || project.status === filters.status) &&
        (!filters.vehicleType || project.vehicleType === filters.vehicleType) &&
        (!filters.typeOfWork || project.typeOfWork === filters.typeOfWork) &&
        (!filters.location || project.location === filters.location)
      );
  }, [searchQuery, data, filters]);

  const sortedProjects = useMemo(() => {
    if (!sortColumn) return filteredProjects;
    return [...filteredProjects].sort((a, b) => {
      const aVal = a[sortColumn]?.toString().toLowerCase() ?? "";
      const bVal = b[sortColumn]?.toString().toLowerCase() ?? "";
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
      <div className="flex flex-wrap items-center gap-2 py-2">
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
        
        {/* Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant={activeFilterCount > 0 ? "default" : "outline"} 
              className="ml-2 relative"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 bg-primary-foreground text-primary absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="flex justify-between items-center">
              Filters
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1 text-xs"
                  onClick={clearAllFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Status filter */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="justify-between">
                <span>Status</span>
                {filters.status && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {filters.status}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[180px]">
                  <ScrollArea className="h-60">
                    <DropdownMenuItem
                      className="justify-between"
                      onSelect={() => updateFilter('status', null)}
                    >
                      All Statuses
                      {!filters.status && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.status.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        className="justify-between"
                        onSelect={() => updateFilter('status', status)}
                      >
                        <div className="flex items-center">
                          <StatusBadge status={status} />
                        </div>
                        {filters.status === status && <span>✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Vehicle Type filter */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="justify-between">
                <span>Vehicle Type</span>
                {filters.vehicleType && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {filters.vehicleType}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[180px]">
                  <ScrollArea className="h-60">
                    <DropdownMenuItem
                      className="justify-between"
                      onSelect={() => updateFilter('vehicleType', null)}
                    >
                      All Vehicle Types
                      {!filters.vehicleType && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.vehicleType.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        className="justify-between"
                        onSelect={() => updateFilter('vehicleType', type)}
                      >
                        {type}
                        {filters.vehicleType === type && <span>✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Type of Work filter */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="justify-between">
                <span>Work Type</span>
                {filters.typeOfWork && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {filters.typeOfWork}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[180px]">
                  <ScrollArea className="h-60">
                    <DropdownMenuItem
                      className="justify-between"
                      onSelect={() => updateFilter('typeOfWork', null)}
                    >
                      All Work Types
                      {!filters.typeOfWork && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.typeOfWork.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        className="justify-between"
                        onSelect={() => updateFilter('typeOfWork', type)}
                      >
                        {type}
                        {filters.typeOfWork === type && <span>✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Location filter */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="justify-between">
                <span>Location</span>
                {filters.location && (
                  <Badge variant="outline" className="ml-2 font-normal truncate max-w-[80px]">
                    {filters.location}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[180px]">
                  <ScrollArea className="h-60">
                    <DropdownMenuItem
                      className="justify-between"
                      onSelect={() => updateFilter('location', null)}
                    >
                      All Locations
                      {!filters.location && <span>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.location.map((location) => (
                      <DropdownMenuItem
                        key={location}
                        className="justify-between"
                        onSelect={() => updateFilter('location', location)}
                      >
                        {location}
                        {filters.location === location && <span>✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 ml-2 items-center">
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <Badge 
                  key={key} 
                  variant="secondary" 
                  className="px-2 py-1 flex items-center gap-1"
                >
                  <span className="capitalize text-xs font-medium text-muted-foreground">{key}:</span>
                  <span className="text-xs">{value}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => updateFilter(key as keyof Filters, null)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {key} filter</span>
                  </Button>
                </Badge>
              )
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Columns Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto">
              Columns <ChevronDown className="h-4 w-4 ml-1" />
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
              Rows: {rowsPerPage === "all" ? "All" : rowsPerPage} <ChevronDown className="h-4 w-4 ml-1" />
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
                <TableHead onClick={() => handleSort("id")} className="cursor-pointer">
                  Project ID {sortColumn === "id" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.registrationNumber && (
                <TableHead onClick={() => handleSort("registrationNumber")} className="cursor-pointer">
                  Registration Number{" "}
                  {sortColumn === "registrationNumber"
                    ? sortOrder === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </TableHead>
              )}
              {visibleColumns.status && (
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  Status {sortColumn === "status" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.vehicleType && (
                <TableHead onClick={() => handleSort("vehicleType")} className="cursor-pointer">
                  Vehicle Type {sortColumn === "vehicleType" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.typeOfWork && (
                <TableHead onClick={() => handleSort("typeOfWork")} className="cursor-pointer">
                  Type of Work {sortColumn === "typeOfWork" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.location && (
                <TableHead onClick={() => handleSort("location")} className="cursor-pointer">
                  Location {sortColumn === "location" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </TableHead>
              )}
              {visibleColumns.dateOpened && (
                <TableHead onClick={() => handleSort("dateOpened")} className="cursor-pointer">
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
                  {visibleColumns.status && (
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                  )}
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